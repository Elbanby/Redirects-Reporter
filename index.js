const fs = require('fs');
const https = require('https');
const readline = require('readline');

// Custom modules
const cridentials = require("./credentials/credentials.js");

const inputFile = process.argv[2];
const outputFile = process.argv[3];

const resultPath = './results/';
const resourcePath = './resources/';
const inStream = fs.createReadStream(resourcePath + inputFile);
const outStream = fs.createWriteStream(resultPath + outputFile);

const rl = readline.createInterface(inStream, outStream);

const username = cridentials.userName;
const password = cridentials.password;
const auth = "Basic " + new Buffer(`${username}:${password}`).toString("base64");

const bulk = 100;

var urlObjArray = [];
var numUrls = 0;
var sentReq = 0;
var returnedReq = 0;
var linkOfDeathIndex = 0;
var index = 0; 
var startTime = getTime();

rl.on("line", (url) => {
  enQue(url,numUrls);
  numUrls++;
});

rl.on("close", ()=>{
  inStream.close();
  main();
});

function enQue(url,index) {
  let urlInfo = getUrlInfo(url);
  let urlObj = new urlObjConstruct(urlInfo.host,urlInfo.path,index);
  urlObjArray.push(urlObj);
}

function urlObjConstruct(host,path,index) {
  let urlObj = {};
  urlObj.host = host;
  urlObj.path = path;
  urlObj.originalPath = '';
  urlObj.finalUrl = '';
  urlObj.redirected = false;
  urlObj.index = index;
  urlObj.statusCode = -1;
  urlObj.finalStatusCode = -1;
  urlObj.numFailed = -1;
  urlObj.numberOfRedirects = 0;

  return urlObj;
}

function getUrlInfo(url) {
  let hostBegin = url.indexOf('https://');
  let hostEnd = url.indexOf('.com/');
  let host = url.substring(hostBegin + getLength('https://') , hostEnd + getLength('.com') ) ;
  let path = url.substring(url.indexOf(host) + getLength(host));
  if (hostEnd === -1) {
      path = '';
  }
  return { host, path };
}

function getLength(string) {
  return string.length;
}

function main() {
  console.log('I got called. Time for the meaty stuff');
  //Writes the headers to the output file
  append(outputFile, `Original Url, Status Code, Final Url, Status\n`);
  if (numUrls > bulk) {
    for (let i = 0 ; i < bulk ; i++){
      send(urlObjArray[index]);
      index++;
    }
  } else {
    send(urlObjArray[index]);
  }


}

function send(urlObj) {
  console.log('Sending request to link num# ' + urlObj.index);
  console.log('Number of requests sent = ' + sentReq);
  console.log('Number of returned Requests = ' + returnedReq);
  get(urlObj);
}

function append(filePath, str) {
  fs.appendFile(filePath, str, err => {
    if (err) console.log(err);
  });
}

function getTime() {
  return new Date().toLocaleTimeString();
}

function get(urlObj) {
  sentReq++;
  console.log('Request sent to index ' + urlObj.index);

  const options = {
    method: "HEAD",
    host: urlObj.host,
    path: urlObj.path,
    followAllRedirects: true,
    headers: {
      Authorization: auth
    }
  };

  var req = https.request(options, (res) => {
    returnedReq++;
    handleResponse(urlObj,res);
  });

  req.on('error', (err)=> {
    returnedReq++;
    handleError(urlObj,err);
  });

  req.setTimeout(4000,()=>{
    console.log('time out');
    req.abort();
  });
  req.end();
}


function handleResponse(urlObj, res) {
  console.log('Handling response ');
  urlObj.finalStatusCode = res.statusCode;

  if ((res.statusCode >= 400 || res.statusCode <= 200  || urlObj.numberOfRedirects > 2)) {
    //this means the link already has a result
    if (urlObj.redirected) {
      str = `${urlObj.host}${urlObj.originalPath}, ${urlObj.statusCode}, ${urlObj.host}${urlObj.path}, ${urlObj.finalStatusCode}\n`;
    } else {
      str = `${urlObj.host}${urlObj.path}, ${res.statusCode}, 'no redirection', ${res.statusCode}\n`;
    }
    append(resultPath + outputFile, `${str}`);
  } else {
    let urlInfo = getUrlInfo(res.headers.location);
    urlObj.originalPath = urlObj.path;
    urlObj.statusCode = res.statusCode;
    urlObj.path = urlInfo.path;
    urlObj.redirected = true;
    urlObj.numberOfRedirects++;
    urlObjArray.push(urlObj);
  }
  hasNext();
}

function hasNext() {
  if (index != urlObjArray.length - 1) {
      console.log('Sendnig new request ');
      send(urlObjArray[index++]);

  } else {
    console.log('Do exit stuff');
    console.log(startTime + '...'+ getTime());
  }
}

function handleError(urlObj, err){
  console.log('Handling error');
  urlObj.numFailed++;
  if ( (err.code === "ETIMEDOUT" || err.code === "ECONNRESET") && (urlObj.numFailed < 2) ) {
    console.log('retry');
    urlObjArray.push(urlObj);
  } else {
    console.log('Dead link ' + err);
    append(resultPath + 'error_' + outputFile, `${urlObj.host}${urlObj.path}, ${err}`);
  }
  hasNext();
}

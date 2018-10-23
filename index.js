// Core Libraries
const fs = require("fs");
const readline = require("readline");
const https = require("https");
// Custom modules
const cridentials = require("./credentials/credentials.js");

// Program variables
const resultPath = "./results/";
const resourcesPath = "./resources/";

const inputFile = resourcesPath + process.argv[2];
const outputFile = process.argv[3];
const errorFile = `error_${outputFile}`;

const inStream = fs.createReadStream(inputFile);
const outStream = fs.createWriteStream(resultPath + outputFile);
const errStream = fs.createWriteStream(resultPath + errorFile);

const rl = readline.createInterface(inStream, outStream);

const username = cridentials.username;
const password = cridentials.password;

const auth =
  "Basic " + new Buffer(`${username}:${password}`).toString("base64");

const fileHeaders = `Original Url, Status Code, Final Url, Status\n`;

var urlObjArray = [];
var errorObjArray = [];

//// TODO: dynamically decide the number of chunk
var chunk = 200;
var index = 0;

var numberOfUrls = 0;

var startIndex = 0;

var returnedRequests = 0;
var sentRequest = 0;

let startTime = new Date().toLocaleTimeString();

//Writes the headers to the output file
append(resultPath + outputFile, fileHeaders);

console.log("Program start : " + startTime);
rl.on("line", line => {
  numberOfUrls++;
  //line = encodeURI(line);
  const path = line.substring(line.indexOf(".com/") + 5);
  let tempObj = {
    path: path,
    numFailed: -1,
    originalPath: "",
    index: -1,
    statusCode: -1,
    finialStausCode: -1,
    finalUrl: "",
    redirected: false,
    host: ""
  };
  tempObj.index = index++;
  tempObj.originalPath = path;
  tempObj.path = path;
  tempObj.host = line.substring("https://".length, line.indexOf(".com/") + 4);
  urlObjArray.push(tempObj);
});

rl.on("close", () => {
  chunk = (numberOfUrls > 200)? 200 : numberOfUrls;
  propagateRequests(startIndex, chunk);
});

function propagateRequests(startIndex, chunk) {
  if (sentRequest == urlObjArray.length) {
    return;
  }
  let subQueue = urlObjArray.slice(startIndex, chunk);

  subQueue.forEach(obj => {
    get(obj)
      .then(res => {
        console.log(
          res.statusCode +
            " found for url at index[" +
            obj.index +
            "]\nREQUEST RETURNED : " +
            returnedRequests
        );

        obj.finialStausCode = res.statusCode;

        if (res.statusCode != 301 && res.statusCode != 307) {
          let str = "";
          if (obj.redirected) {
            //// TODO: if 200 make sure you display 200 as well
            str = `${obj.host}/${obj.originalPath}, ${obj.statusCode}, ${
              obj.host
            }/${obj.path}, ${obj.finialStausCode}\n`;
          } else {
            str = `${obj.host}/${obj.path}, ${
              res.statusCode
            }, 'no redirection', ${res.statusCode}\n`;
          }
          append(resultPath + outputFile, str);
        } else {
          console.log("🧐 trace redirects");
          //Now you need to change the properties in the urlObj then put it back
          //In the end of the que.
          obj.path = getPath(obj.host, res.headers.location);
          obj.statusCode = res.statusCode;
          obj.finialStausCode = -1;
          obj.redirected = true;
          urlObjArray.push(obj);
        }
        singleRequest();
        return;
      })
      .catch(err => {
        let str = `${obj.host}/${obj.path}, ${err.code} \n`;
        if (
          (err.code === "ETIMEDOUT" || err.code === "ECONNRESET") &&
          obj.numFailed < 2
        ) {
          console.log(
            obj.path +
              ">>>>>TIME OUT || Socket hang up >> Added to the end of the queue " +
              err.code
          );
          urlObjArray.push(obj);
          singleRequest();
        } else {
          let str = `https://${obj.host}${obj.path}, ${err.code}\n`;
          append(resultPath + errorFile, str);
          console.log(
            "\nERROR CODE 02 " +
              "REQUEST RETURNED : " +
              returnedRequests +
              " " +
              err +
              "URL: " +
              str
          );
          return;
        }
      });
  });
}

function get(urlObj) {
  sentRequest++;
  console.log(`Number of requests sent: ------------> ${sentRequest}`);
  const options = {
    method: "GET",
    host: urlObj.host,
    path: "/" + urlObj.path,
    timeout: 30000,
    followAllRedirects: true,
    headers: {
      Authorization: auth
    }
  };
  return new Promise((resolve, reject) => {
    https
      .get(options, res => {
        returnedRequests++;
        resolve(res);
      })
      .on("error", err => {
        returnedRequests++;
        urlObj.numFailed++;
        reject(err);
      });
  });
}

function append(file, str) {
  fs.appendFile(file, str, err => {
    if (err) {
      console.log(err);
    }
  });
}

function singleRequest() {
  if (sentRequest != urlObjArray.length) {
    startIndex = chunk;
    chunk += 1;
    propagateRequests(startIndex, chunk);
  } else {
    console.log("ending");
    let endTime = new Date().toLocaleTimeString();
    console.log(`${startTime} ..... ${endTime}`);
    return;
  }
}

function getPath(host, url) {
  let strLen = `https://${host}/`.length;
  return url.substring(strLen);
}

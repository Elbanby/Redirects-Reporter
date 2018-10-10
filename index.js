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
const host = "www.greatwestlife.com";
const auth =
  "Basic " + new Buffer(`${username}:${password}`).toString("base64");

const fileHeaders = `Original Url, Status Code, Final Url, Status\n`

var urlObjArray = [];
var errorObjArray = [];

var chunk = 58;
var index = 0;

var startIndex = 0;

var returnedRequests = 0;
var sentRequest = 0;

let startTime = new Date().toLocaleTimeString();

//Writes the headers to the output file
append(resultPath + outputFile, fileHeaders);

console.log("Program start : " + startTime);
rl.on("line", path => {
  let tempObj = {
    path: path,
    index: -1,
    statusCode: -1,
    finialStausCode: -1,
    finalUrl: ""
  };
  tempObj.index = index++;
  tempObj.path = path;
  urlObjArray.push(tempObj);
});

rl.on("close", () => {
  propagateRequests(startIndex, chunk);
});

function propagateRequests(startIndex, chunk) {

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

        let str = `${host}/${obj.path}, ${res.statusCode}, ${
          res.headers.location
        }, 200\n`;
        append(resultPath + outputFile, str);
        singleRequest();
      })
      .catch(err => {
        let str = `${host}/${obj.path}, ${err.code} \n`;
        if (err.code === "ETIMEDOUT" || err.code === "ECONNRESET") {
          console.log(
            obj.path +
              ">>>>>TIME OUT || Socket hang up >> Added to the end of the queue " +
              err.code
          );
          urlObjArray.push(obj);
          singleRequest();
        } else {
          let str =  `${obj.path}, ${err.code}\n`
          append(resultPath + errorFile, str);
          console.log(
            "\nERROR CODE 02 " + "REQUEST RETURNED : " + returnedRequests + ' ' + err.code
          );
        }
      });
  });
}

function get(urlObj) {
  sentRequest++;
  console.log(`Number of requests sent: ------------> ${sentRequest}`);
  const options = {
    method: "GET",
    host: host,
    path: encodeURI("/" + urlObj.path),
    timeout: 30000,
    followAllRedirects: true,
    headers: {
      Authorization: auth
    }
  };
  return new Promise((resolve, reject) => {
    https
      .get(options, res => {
        res.on("data", data => {
          returnedRequests++;
          resolve(res);
        });
      })
      .on("error", err => {
        returnedRequests++;
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
  if (sentRequest == urlObjArray.length) {
    let endTime = new Date().toLocaleTimeString();
    console.log(`${startTime} ..... ${endTime}`);
  }
  startIndex = chunk;
  chunk += 1;
  propagateRequests(startIndex, chunk);
}

/*
  Link parser changes all the links in the text file to be
  inside the json file as in array. This serves the idea of
  dealing with the links later as a json object, instead of
  an excel or txt file.

  @Usage:
  you run `node linkParser.js <path to your txt file> <path to output json file> `
  Or just run node linkParser.js. However, in that case you must have
  links.txt in the resource folder, and the output will be called links.json
  also in the resource folder.
*/
const fs = require('fs');
const readline = require('readline');

const textFile = process.argv[2] || './resources/links.txt';
const jsonFile = process.argv[3] || './resources/links.json';

const inStream = fs.createReadStream(textFile);
const wStream = fs.createWriteStream(jsonFile);

const rl = readline.createInterface(inStream, wStream);

var jsonObj  = {
  links: []
}

rl.on('line', function(link) {
  jsonObj.links.push(link);
});

rl.on('close', function(){
  let toJson = JSON.stringify(jsonObj);
  wStream.write(toJson);
});

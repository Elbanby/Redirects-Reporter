/*
  This class should create a internet watcher. Which will handle internet
  failure and insure that the program still runs once the connectivity
  is back.
*/

const os = require('os');
const events = require('events');
var internetWatcher = new events.EventEmitter();

internetWatcher.on('offline', function(msg){
  //Instead of a message, do a callback that cleans up to where you stopped
  console.log(msg);
});

internetWatcher.on('online', function(msg){
  console.log(msg);
});

function isOnline() {
  let network = os.networkInterfaces();
  //Currently checking if the inrernet is working on ethernet 1
  if (network.en1) {
    internetWatcher.emit('online','We are online');
    return true;
  } else {
    internetWatcher.emit('offline','No internet connetion');
    return false;
  }
}



module.exports = {
  isOnline
}

'use strict';

const path = require('path');
const express = require('express');
const WebSocketServer = require('ws').WebSocketServer;

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');

const server = express()
.use((req, res) => res.sendFile(INDEX) )
.listen(PORT, () => console.log(`Listening on ${ PORT }`));

const wss = new WebSocketServer({ server });
var webSockets = {}; // userID: webSocket

function generatePassword() {
  var length = 8,
  charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  retVal = "";
  for (var i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
}

function IsJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

// CONNECT /:userID
// wscat -c ws://localhost:3000/1
wss.on('connection', function connection(webSocket,request) {

  var userID  = request.url.slice(1);
  var innerID = generatePassword()
  if( webSockets[userID] === undefined ){ webSockets[userID] = {}; }
  webSockets[userID][innerID] = webSocket

  console.log('connected: ' + userID + '_' + innerID + ' in ' + Object.getOwnPropertyNames(webSockets))

  // Forward Message
  //
  // Receive               Example
  // [touserID, text]      [2, "Hello, World!"]
  //
  // Send                  Example
  // [fromuserID, text]    [1, "Hello, World!"]
  webSocket.on('message', function(message) {
    if(IsJsonString(message)){
      console.log('received from ' + userID + '_' + innerID + ': ' + message)
      var msg = JSON.parse(message)
      msg.from = userID
      var toUserWebSocket = webSockets[msg.to]
      if(toUserWebSocket){
        console.log('sent to ' + msg.to + ': ' + JSON.stringify(msg))
        for(var ws in toUserWebSocket){
          toUserWebSocket[ws].send(JSON.stringify(msg))
        }
      }
    }
  })

  webSocket.on('close', function () {
    delete webSockets[userID][innerID]
    console.log('deleted: ' + userID + '_' + innerID)
  })

});
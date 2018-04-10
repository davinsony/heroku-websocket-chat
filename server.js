'use strict';

const express = require('express');
const SocketServer = require('ws').Server;
const path = require('path');

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');

const server = express()
.use((req, res) => res.sendFile(INDEX) )
.listen(PORT, () => console.log(`Listening on ${ PORT }`));

const webSocketServer = new SocketServer({ server });
var webSockets = {}; // userID: webSocket

// CONNECT /:userID
// wscat -c ws://localhost:5000/1
webSocketServer.on('connection', function (webSocket) {
  var userID = webSocket.upgradeReq.url.substr(1)
  webSockets[userID] = webSocket
  console.log('connected: ' + userID + ' in ' + Object.getOwnPropertyNames(webSockets))

  // Forward Message
  //
  // Receive               Example
  // [toUserID, text]      [2, "Hello, World!"]
  //
  // Send                  Example
  // [fromUserID, text]    [1, "Hello, World!"]
  webSocket.on('message', function(message) {
    console.log('received from ' + userID + ': ' + message)
    var msg = JSON.parse(message)
    var toUserWebSocket = webSockets[msg.to]
    if (toUserWebSocket) {
      msg.from = userID
      console.log('sent to ' + msg.to + ': ' + JSON.stringify(msg))
      toUserWebSocket.send(JSON.stringify(msg))
    }
  })

  webSocket.on('close', function () {
    delete webSockets[userID]
    console.log('deleted: ' + userID)
  })
})
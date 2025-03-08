import WebSocket, { WebSocketServer } from "ws";
import "./dollar.js";

import serveStatic from "serve-static";
import finalhandler from "finalhandler";
import http from "http";

// WEBSOCKETS SERVER
const wss = new WebSocketServer({ port: 2025 });
wss.on('connection', function connection(ws) {
    // start a recognizer class for each individual connected user
    const rec = new DollarRecognizer();

    // callback for error
    ws.on('error', console.error);
  
    // IMPORTANT
    ws.on('message', function message(data) {
      // do some processing on the data
      const arr = undefined;

      // recognize the gesture
      const gesture = undefined;

      // emit the gesture out to all connected clients
      wss.clients.forEach(function each (client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(gesture, { binary: false });
          }
      });
    });
});

// HTTP SERVER

// Create server
// Serve up public/ftp folder
const serve = serveStatic('../phone/', { index: ['index.html'] });
const server = http.createServer(function onRequest (req, res) {
    serve(req, res, finalhandler(req, res))
});
  
// Listen
server.listen(3000);
import WebSocket, { WebSocketServer } from "ws";
import DollarRecognizer from "./dollar.js";

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
        // integrate?
        const data = JSON.parse(data.toString())["data"]; 
        const states = [];

        let v_x = 0; let v_y = 0; let v_z = 0;
        let s_x = 0; let s_y = 0; let s_z = 0;
        states.push(s_x, s_y, s_z);

        for (let i = 0; i < data.length; i++) {
            v_x += data[i]["x"]; v_y += data[i]["y"]; v_z += data[i]["z"];
            s_x += v_x; s_y += v_y; s_z += v_z;
            states.push(s_x, s_y, s_z);
        }

        // use the resulting positions
        console.log(states);

        // recognize a gesture with the points
        let gesture = rec.Recognize(states, false);
        console.log(gesture);

        // data to send out to clients
        let result = JSON.stringify({
            user: "oops",
            gesture: gesture
        });

        // emit the gesture out to all connected clients
        wss.clients.forEach(function each (client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(result, { binary: false });
            }
        });
    });
});

// HTTP SERVER
const serve = serveStatic('../phone/', { index: ['index.html'] });
const server = http.createServer(function onRequest (req, res) {
    serve(req, res, finalhandler(req, res))
});

server.listen(3000);
import WebSocket, { WebSocketServer } from "ws";
import DollarRecognizer from "./dollar.js";
import Point from "./dollar.js";

import serveStatic from "serve-static";
import finalhandler from "finalhandler";
import http from "http";

// for generating new gestures
function formatPoints(points) {
    return points.map(point => `new Point(${point.x}, ${point.y})`).join(',');
}


// WEBSOCKETS SERVER
let num = 0;
const wss = new WebSocketServer({ port: 2025 });
wss.on('connection', function connection(ws) {
    console.log(`CONNECTION ${num}`);
    ws.send(JSON.stringify({ id: num }), { binary: false }); // send the user the number back

    // dont allow 5
    if (num > 4) {
        ws.close(); console.log("rejected for max"); return;
    } else {
        num++;
    }

    // start a recognizer class for each individual connected user
    const rec = new DollarRecognizer();

    // callback for error
    ws.on('error', console.error);
  
    // IMPORTANT
    ws.on('message', function message(data) {
        // parse the json points
        const points = JSON.parse(data.toString())["data"];
        console.log(points); 
        var states = new Array();

        // generate the point objects
        for (let i = 0; i < points.length; i++) {
            points[i]["x"] *= points[i]["x"];
            points[i]["y"] *= points[i]["y"];
            var point = new Point(points[i]["x"], points[i]["y"]);
            states.push(point);
        }

        // generate data
        let gaming = formatPoints(points);
        console.log(gaming);

        // recognize a gesture with the points
        let gesture = rec.Recognize(states, true);
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


  // let t_i = 1;

        // let v_x = 0; let v_y = 0; // let v_z = 0;
        // let s_x = 0; let s_y = 0; // let s_z = 0;
        // var point = new Point(s_x, s_y);
        // states.push(point);
        // // states.push(s_x, s_y, s_z);

        // for (let i = 0; i < points.length; i++) {
        //     v_x += points[i]["x"] * t_i; v_y += points[i]["y"] * t_i; // v_z += points[i]["z"] * t_i;
        //     s_x += v_x * t_i; s_y += v_y * t_i; // s_z += v_z * t_i;
        //     var gamingPoint = new Point(s_x, s_y);
        //     console.log(s_x);
        //     console.log(s_y);
        //     states.push(gamingPoint);
        //     // states.push(s_x, s_y, s_z);
        // }
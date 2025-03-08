import WebSocket, { WebSocketServer } from "ws";
import DollarRecognizer from "./dollar.js";
import Point from "./dollar.js";

import serveStatic from "serve-static";
import finalhandler from "finalhandler";
import http from "http";

import ShapeDetector from "shape-detector";

// shapes
var shapes = [
    {
        points: [{ x: -0.61, y: 7.84 },{ x: -0.78, y: 8.11 },{ x: -0.26, y: 7.07 },{ x: -0.27, y: 5.72 },{ x: -0.34, y: 4.64 },{ x: -2.48, y: 4.21 },{ x: -1.11, y: 4.89 },{ x: 0.07, y: 5.3 },{ x: 2.47, y: 4.84 },{ x: 2.05, y: 3.88 },{ x: 4.27, y: 2.3 },{ x: 3.63, y: 1.5 },{ x: -1.31, y: 0.04 },{ x: -5.02, y: 0.37 },{ x: -1.56, y: 3.84 },{ x: 1.57, y: 4.99 },{ x: 0.02, y: 2.8 },{ x: 0.76, y: 2.62 },{ x: -0.85, y: 3.7 },{ x: -4.26, y: 4.26 },{ x: -5.11, y: 5.46 },{ x: -4.24, y: 5.26 },{ x: 0.2, y: 5.7 },{ x: 3.46, y: 6.25 },{ x: 2.91, y: 6.76 }],
        name: "square"
    },
    {
        points: [{ x: -1.2, y: 7.45 },{ x: -2.46, y: 6.48 },{ x: -2.98, y: 5.06 },{ x: -3.16, y: 3.37 },{ x: -3.72, y: 0.94 },{ x: -4.05, y: 1.3 },{ x: 0.2, y: 2.35 },{ x: 4.72, y: 4.99 },{ x: 6.31, y: 5.46 },{ x: 6.75, y: 3.99 },{ x: 5.42, y: 2.1 },{ x: 4.82, y: -0.13 },{ x: 4.55, y: -0.7 },{ x: 2.55, y: -1.21 },{ x: -3.1, y: -0.58 },{ x: -5.1, y: 0.13 },{ x: -8.3, y: 1.37 },{ x: -6.86, y: 2.64 },{ x: -1.47, y: 3.97 },{ x: -0.03, y: 3.09 },{ x: 1.64, y: 2.77 },{ x: 4.13, y: 2.16 },{ x: 3.63, y: 2.05 },{ x: 2.91, y: 2.95 },{ x: 0.33, y: 4.73 }],
        name: "triangle"
    },
    {
        points: [{ x: 2.11, y: 6.3 },{ x: 1.83, y: 6.62 },{ x: 1.14, y: 6.73 },{ x: -1.18, y: 6.05 },{ x: -1.29, y: 5.59 },{ x: -0.37, y: 4.26 },{ x: 0.59, y: 3.47 },{ x: 1.88, y: 2.99 },{ x: 4.59, y: 2.65 },{ x: 6.68, y: 1.53 },{ x: 7.34, y: 0.08 },{ x: 5.09, y: -0.57 },{ x: -0.89, y: -1.49 },{ x: -3.71, y: -1.01 },{ x: -5.06, y: -0.63 },{ x: -7.87, y: 0.02 },{ x: -8.79, y: 1.1 },{ x: -5.51, y: 2.16 },{ x: -4.86, y: 2.33 },{ x: -3.22, y: 2.18 },{ x: 3.1, y: 2.91 },{ x: 5.16, y: 4.08 },{ x: 4.19, y: 5.09 },{ x: 3.48, y: 5.19 },{ x: 1.02, y: 5.81 }],
        name: "circle"
    },
    {
        points: [{ x: 1.07, y: 6.39 },{ x: 0.73, y: 5.3 },{ x: 1.22, y: 4.61 },{ x: 3.07, y: 3.47 },{ x: 4.42, y: 2.08 },{ x: 3.81, y: 0.97 },{ x: 3.32, y: -1.21 },{ x: 3.18, y: -0.77 },{ x: 0.66, y: 0.56 },{ x: 2.11, y: 1.7 },{ x: 3.07, y: 1.76 },{ x: 0.61, y: -0.48 },{ x: 0.15, y: -1.32 },{ x: -1.22, y: -1.5 },{ x: -1.93, y: 1.47 },{ x: -3.55, y: 2.62 },{ x: -4.68, y: 3.29 },{ x: -5.37, y: 1.43 },{ x: -4.93, y: -0.8 },{ x: 0.65, y: -2.27 },{ x: 3.37, y: -2.7 },{ x: 5.8, y: -1.5 },{ x: 8.36, y: -0.21 },{ x: 5.87, y: -0.06 },{ x: 1.6, y: -0.83 }],
        name: "x"
    },
    {
        points: [{ x: 0.11, y: 5.71 },{ x: 0.03, y: 4.6 },{ x: 1.44, y: 3.03 },{ x: 2.08, y: 1.44 },{ x: 3.34, y: 0.9 },{ x: 2.02, y: 0.66 },{ x: 2.1, y: 1.33 },{ x: 1.49, y: 2.46 },{ x: -0.3, y: 4.09 },{ x: 3.21, y: 4.81 },{ x: 5.04, y: 3.67 },{ x: 5.55, y: 3.41 },{ x: 2.65, y: 1.67 },{ x: 1.95, y: 0.68 },{ x: 0.17, y: -0.85 },{ x: -2.22, y: -1.83 },{ x: -6.69, y: -1.21 },{ x: -8.56, y: -0.5 },{ x: -7.14, y: 1.96 }],
        name: "check"
    },
    {
        points: [{ x: -1.55, y: 2.71 },{ x: -1.57, y: 2.84 },{ x: -0.62, y: 3.45 },{ x: -1.85, y: 3.61 },{ x: -2.28, y: 4.53 },{ x: -1.02, y: 4.41 },{ x: -0.77, y: 4.03 },{ x: -0.7, y: 3.23 },{ x: 0.19, y: 2.47 },{ x: -0.16, y: 2.88 },{ x: -1.01, y: 3.51 },{ x: -0.82, y: 4.18 },{ x: -0.34, y: 4.78 },{ x: -0.1, y: 4.82 },{ x: 0.23, y: 4.93 },{ x: 0.84, y: 3.78 },{ x: 0.85, y: 3.61 },{ x: 2.26, y: 2.02 },{ x: 1.63, y: 2.19 },{ x: 0.56, y: 0.67 },{ x: 0.88, y: 2.1 },{ x: 4.37, y: 3.71 },{ x: 2.75, y: 4.06 },{ x: 2.53, y: 4.08 },{ x: 3.23, y: 2.97 }],
        name: "caret"
    },
    {
        points: [{ x: -0.75, y: -0.06 },{ x: 1.49, y: 0.25 },{ x: 1.22, y: 1.15 },{ x: 1.5, y: 2.52 },{ x: 0.3, y: 3.79 },{ x: 0.93, y: 2.86 },{ x: 0.97, y: 1.15 },{ x: -0.64, y: 2.15 },{ x: -1.02, y: 2.45 },{ x: 0.43, y: 2.24 },{ x: 0.53, y: 0.35 },{ x: 3.44, y: 1.46 },{ x: 3.34, y: 2.92 },{ x: 3.24, y: 1.64 },{ x: 1.58, y: 0.4 },{ x: -0.84, y: 1.09 },{ x: 0.26, y: 2.03 },{ x: 1.73, y: 1.66 },{ x: 1.14, y: 0.81 },{ x: 1.92, y: 1.06 },{ x: 3.47, y: 1.81 },{ x: 4.31, y: 1.71 },{ x: 0.32, y: 0.58 },{ x: -1.65, y: 0.84 },{ x: -1.27, y: 1.26 }],
        name: "zigzag"
    },
    {
        points: [{ x: -2.78, y: 3.15 },{ x: -0.75, y: 2.69 },{ x: -0.78, y: 2.91 },{ x: 0.6, y: 3.7 },{ x: 1.09, y: 3.95 },{ x: 0.71, y: 3.68 },{ x: 4.73, y: 4.36 },{ x: 8.52, y: 3.63 },{ x: 8.51, y: -0.48 },{ x: -1.3, y: -3.23 },{ x: -13, y: -2.7 },{ x: -11.7, y: 6.99 },{ x: -2.68, y: 2 },{ x: 4.07, y: -0.75 },{ x: 15.25, y: -3.25 },{ x: 18.74, y: -1.46 },{ x: 7.05, y: -4.05 },{ x: -16.3, y: -1.34 },{ x: -4.42, y: 1.38 },{ x: 13.87, y: 5.49 },{ x: 10.57, y: 5.78 },{ x: 11.47, y: 4.26 },{ x: 0.06, y: -1.46 },{ x: -9.22, y: -2.34 },{ x: -1.8, y: 1.75 }],
        name: "arrow"
    },
    {
        points: [{ x: -2.78, y: 3.15 },{ x: -0.75, y: 2.69 },{ x: -0.78, y: 2.91 },{ x: 0.6, y: 3.7 },{ x: 1.09, y: 3.95 },{ x: 0.71, y: 3.68 },{ x: 4.73, y: 4.36 },{ x: 8.52, y: 3.63 },{ x: 8.51, y: -0.48 },{ x: -1.3, y: -3.23 },{ x: -13, y: -2.7 },{ x: -11.7, y: 6.99 },{ x: -2.68, y: 2 },{ x: 4.07, y: -0.75 },{ x: 15.25, y: -3.25 },{ x: 18.74, y: -1.46 },{ x: 7.05, y: -4.05 },{ x: -16.3, y: -1.34 },{ x: -4.42, y: 1.38 },{ x: 13.87, y: 5.49 },{ x: 10.57, y: 5.78 },{ x: 11.47, y: 4.26 },{ x: 0.06, y: -1.46 },{ x: -9.22, y: -2.34 },{ x: -1.8, y: 1.75 }],
        name: "delete"
    },
    {
        points: [{ x: 5.64, y: 1.97 },{ x: 6.18, y: 0.77 },{ x: 3.88, y: 0.29 },{ x: 3.84, y: -2.1 },{ x: 3.74, y: -1.83 },{ x: 5.08, y: -3.04 },{ x: 5.81, y: -1.95 },{ x: 6.1, y: -0.7 },{ x: 5.99, y: -0.92 },{ x: 6.35, y: -1.01 },{ x: 6.73, y: -1.09 },{ x: 8.87, y: -1.41 },{ x: 8.86, y: -2.21 },{ x: 7.76, y: -2.42 },{ x: 6.21, y: -1.81 },{ x: 5.77, y: -1.53 },{ x: 2.91, y: -0.44 },{ x: 1.72, y: 0.31 },{ x: -0.06, y: 1.49 },{ x: -1.51, y: 3.11 },{ x: -0.34, y: 3.84 },{ x: 0.34, y: 5.11 },{ x: 1.7, y: 5.12 },{ x: 3.09, y: 4.84 },{ x: -0.38, y: 2.64 }],
        name: "v"
    },
    {
        points: [{ x: 2.33, y: -0.62 },{ x: 5.4, y: -0.74 },{ x: 10.53, y: -1.87 },{ x: -0.68, y: -3.64 },{ x: -1.57, y: 0.4 },{ x: 1.6, y: 3.89 },{ x: -0.13, y: 2.42 },{ x: -1.93, y: -0.78 },{ x: 3.14, y: -4.58 },{ x: 7, y: -5.45 },{ x: -2.94, y: -0.98 },{ x: -2.43, y: -3.12 },{ x: 0.9, y: -6.38 },{ x: 8.38, y: -4.88 },{ x: 16.2, y: -3.58 },{ x: 18.31, y: -4.99 },{ x: 12.47, y: -6.71 },{ x: 2.24, y: -6.59 },{ x: -3.92, y: 0.01 },{ x: -4.95, y: 3.79 },{ x: -3.37, y: 3.38 },{ x: -9.37, y: -0.27 },{ x: 6.24, y: -7.95 },{ x: 15.92, y: -7.25 },{ x: 5.71, y: -2.61 }],
        name: "star"
    },
    {
        points: [{ x: 4.23, y: 1.79 },{ x: 3.09, y: 1.85 },{ x: 3.12, y: 1.61 },{ x: 2.56, y: 2.04 },{ x: 2.59, y: 1.9 },{ x: 2.48, y: 1.7 },{ x: 2.53, y: 1.33 },{ x: 4.41, y: -1.05 },{ x: 10.31, y: -3.12 },{ x: 12.26, y: -6.12 },{ x: 9.74, y: -7.73 },{ x: -5.02, y: -7.62 },{ x: -7.33, y: -5.09 },{ x: -13.75, y: -1.35 },{ x: -11.17, y: 0.98 },{ x: -7.82, y: 1.12 },{ x: -4.3, y: 1.61 },{ x: 1.58, y: -0.09 },{ x: 8.89, y: -1.32 },{ x: 9.33, y: -2.23 },{ x: 7.81, y: -3.48 },{ x: 5.93, y: -7.92 },{ x: 4.86, y: -10.6 },{ x: -3.35, y: -8.78 },{ x: -12.56, y: 0.52 }],
        name: "pigtail"
    }
]

// for generating new gestures
function formatPoints(points) {
    return points.map(point => `{ x: ${point.x}, y: ${point.y} }`).join(',');
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
    const rec = new ShapeDetector(shapes);

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
            var point = { x: points[i]["x"], y: points[i]["y"] };
            states.push(point);
        }

        // recognize a gesture with the points
        let gesture = rec.spot(states);
        console.log(gesture);

        console.log(formatPoints(points))

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
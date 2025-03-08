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
        points: [{ x: -0.95, y: 1.01 },{ x: -0.34, y: 0.88 },{ x: -0.67, y: 1.13 },{ x: -0.94, y: 1.18 },{ x: -0.69, y: 0.99 },{ x: -1.52, y: 0.58 },{ x: -2.88, y: 0.41 },{ x: -3.4, y: -0.43 },{ x: 2.36, y: -0.84 },{ x: 16.46, y: -2.27 },{ x: 31.26, y: -4.51 },{ x: 40.1, y: -4.11 },{ x: 28.81, y: -19.29 },{ x: -11.15, y: -38.59 },{ x: -48.13, y: -37.46 },{ x: -24.32, y: -12.03 },{ x: -4.67, y: -0.79 }],
        name: "slash"
    },
    {
        points: [{ x: -0.24, y: 0.61 },{ x: 0.02, y: 0.08 },{ x: -1.27, y: -0.1 },{ x: -0.66, y: -0.29 },{ x: -1.4, y: -0.21 },{ x: -0.85, y: -0.59 },{ x: -1.43, y: -1.17 },{ x: 13.3, y: -1.21 },{ x: 23.98, y: -3.62 },{ x: 43.55, y: -7.45 },{ x: 36.61, y: -15.82 },{ x: -6.78, y: -27.95 },{ x: -42.01, y: -44.07 },{ x: -34.19, y: -19.21 },{ x: -10.55, y: -4.34 }],
        name: "slash"
    },
    {
        points: [{ x: -0.53, y: 0.76 },{ x: -0.83, y: 0.57 },{ x: -0.89, y: 0.2 },{ x: -1.25, y: -0.3 },{ x: 0.5, y: -1.01 },{ x: 11.77, y: -4.91 },{ x: 21.16, y: -8.15 },{ x: 26.31, y: -9.92 },{ x: 21.59, y: -10.13 },{ x: -10.1, y: -17.31 },{ x: -40.63, y: -20.22 },{ x: -32.37, y: -9.05 },{ x: -11.12, y: -0.68 }],
        name: "slash"
    },
    {
        points: [{ x: 9.51, y: 0.96 },{ x: 8.86, y: 0.56 },{ x: 5.62, y: -0.92 },{ x: -6.27, y: -2.03 },{ x: 75.63, y: -2.79 },{ x: 53.61, y: -25.44 },{ x: -53.86, y: -32.38 },{ x: -25.97, y: -19.55 },{ x: 13.55, y: 1.13 }],
        name: "pop"
    }, 
    {
        points: [{ x: 7.61, y: 0.24 },{ x: 9.5, y: 0.15 },{ x: 6.79, y: -1.15 },{ x: 1.86, y: -3.61 },{ x: 67.46, y: 0.14 },{ x: 51.7, y: -24.36 },{ x: -46.12, y: -19.52 }],
        name: "pop"
    },
    {
        points: [{ x: 11.49, y: 0.52 },{ x: 8.61, y: -0.19 },{ x: 2.73, y: -1.74 },{ x: -1.91, y: -2.84 },{ x: 40.83, y: -2.22 },{ x: 77.03, y: -9.62 },{ x: 11.83, y: -25.25 }],
        name: "pop"
    }, 
    {
        points: [{ x: -0.61, y: 7.84 },{ x: -0.78, y: 8.11 },{ x: -0.26, y: 7.07 },{ x: -0.27, y: 5.72 },{ x: -0.34, y: 4.64 },{ x: -2.48, y: 4.21 },{ x: -1.11, y: 4.89 },{ x: 0.07, y: 5.3 },{ x: 2.47, y: 4.84 },{ x: 2.05, y: 3.88 },{ x: 4.27, y: 2.3 },{ x: 3.63, y: 1.5 },{ x: -1.31, y: 0.04 },{ x: -5.02, y: 0.37 },{ x: -1.56, y: 3.84 },{ x: 1.57, y: 4.99 },{ x: 0.02, y: 2.8 },{ x: 0.76, y: 2.62 },{ x: -0.85, y: 3.7 },{ x: -4.26, y: 4.26 },{ x: -5.11, y: 5.46 },{ x: -4.24, y: 5.26 },{ x: 0.2, y: 5.7 },{ x: 3.46, y: 6.25 },{ x: 2.91, y: 6.76 }],
        name: "square"
    },
    {
        points: [{ x: 2, y: 7.17 },{ x: 2.5, y: 6.66 },{ x: 0.82, y: 6.42 },{ x: 2.12, y: 7.01 },{ x: 1.64, y: 6.88 },{ x: -1.17, y: 4.23 },{ x: -9.6, y: -7.02 },{ x: 3.01, y: -16.15 },{ x: 22.56, y: -9.76 },{ x: 16.53, y: -4.78 },{ x: 14.65, y: -3.04 },{ x: 27.38, y: -0.83 },{ x: 21.16, y: -11.7 },{ x: -16.1, y: -32.65 },{ x: -3.28, y: -5.91 },{ x: 15.01, y: 0.18 },{ x: 27.86, y: -7.34 },{ x: 28.98, y: -21.26 },{ x: -2.89, y: -12.77 },{ x: -1.45, y: -1.75 },{ x: -6.29, y: 3.12 },{ x: -7.46, y: -7 },{ x: 2.87, y: -15.53 },{ x: 22.65, y: -1.62 },{ x: 16.76, y: 11.69 }],
        name: "square"
    },
    {
        points: [{ x: 3.07, y: 6.99 },{ x: 2.97, y: 7.07 },{ x: 1.83, y: 6.43 },{ x: -3.64, y: 0.51 },{ x: -8.53, y: -9.22 },{ x: 13.49, y: -9.54 },{ x: 17.94, y: 0.82 },{ x: 9.59, y: -0.81 },{ x: 13.38, y: -1.01 },{ x: 27.52, y: 0.31 },{ x: 18.16, y: -4.27 },{ x: 2.24, y: -19.94 },{ x: -23.71, y: -16.17 },{ x: 1.76, y: -0.98 },{ x: 7.93, y: -1.43 },{ x: 29.04, y: -0.63 },{ x: 14.58, y: -18.73 },{ x: -1.39, y: -4.41 },{ x: -5.79, y: -1.7 },{ x: -6.18, y: 1.61 },{ x: -6.94, y: 3.59 },{ x: -7.24, y: -10.81 },{ x: 17.76, y: -9.76 },{ x: 23.95, y: 9.46 },{ x: 15.05, y: 6.31 }],
        name: "square"
    },
    {
        points: [{ x: -1.2, y: 7.45 },{ x: -2.46, y: 6.48 },{ x: -2.98, y: 5.06 },{ x: -3.16, y: 3.37 },{ x: -3.72, y: 0.94 },{ x: -4.05, y: 1.3 },{ x: 0.2, y: 2.35 },{ x: 4.72, y: 4.99 },{ x: 6.31, y: 5.46 },{ x: 6.75, y: 3.99 },{ x: 5.42, y: 2.1 },{ x: 4.82, y: -0.13 },{ x: 4.55, y: -0.7 },{ x: 2.55, y: -1.21 },{ x: -3.1, y: -0.58 },{ x: -5.1, y: 0.13 },{ x: -8.3, y: 1.37 },{ x: -6.86, y: 2.64 },{ x: -1.47, y: 3.97 },{ x: -0.03, y: 3.09 },{ x: 1.64, y: 2.77 },{ x: 4.13, y: 2.16 },{ x: 3.63, y: 2.05 },{ x: 2.91, y: 2.95 },{ x: 0.33, y: 4.73 }],
        name: "triangle"
    },
    {
        points: [{ x: 1.07, y: 6.39 },{ x: 0.73, y: 5.3 },{ x: 1.22, y: 4.61 },{ x: 3.07, y: 3.47 },{ x: 4.42, y: 2.08 },{ x: 3.81, y: 0.97 },{ x: 3.32, y: -1.21 },{ x: 3.18, y: -0.77 },{ x: 0.66, y: 0.56 },{ x: 2.11, y: 1.7 },{ x: 3.07, y: 1.76 },{ x: 0.61, y: -0.48 },{ x: 0.15, y: -1.32 },{ x: -1.22, y: -1.5 },{ x: -1.93, y: 1.47 },{ x: -3.55, y: 2.62 },{ x: -4.68, y: 3.29 },{ x: -5.37, y: 1.43 },{ x: -4.93, y: -0.8 },{ x: 0.65, y: -2.27 },{ x: 3.37, y: -2.7 },{ x: 5.8, y: -1.5 },{ x: 8.36, y: -0.21 },{ x: 5.87, y: -0.06 },{ x: 1.6, y: -0.83 }],
        name: "x"
    },
    {
        points: [{ x: -1.55, y: 2.71 },{ x: -1.57, y: 2.84 },{ x: -0.62, y: 3.45 },{ x: -1.85, y: 3.61 },{ x: -2.28, y: 4.53 },{ x: -1.02, y: 4.41 },{ x: -0.77, y: 4.03 },{ x: -0.7, y: 3.23 },{ x: 0.19, y: 2.47 },{ x: -0.16, y: 2.88 },{ x: -1.01, y: 3.51 },{ x: -0.82, y: 4.18 },{ x: -0.34, y: 4.78 },{ x: -0.1, y: 4.82 },{ x: 0.23, y: 4.93 },{ x: 0.84, y: 3.78 },{ x: 0.85, y: 3.61 },{ x: 2.26, y: 2.02 },{ x: 1.63, y: 2.19 },{ x: 0.56, y: 0.67 },{ x: 0.88, y: 2.1 },{ x: 4.37, y: 3.71 },{ x: 2.75, y: 4.06 },{ x: 2.53, y: 4.08 },{ x: 3.23, y: 2.97 }],
        name: "caret"
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
        console.log(JSON.parse(data.toString())["heading"]);
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

        // send point acceleration data to console
        console.log(formatPoints(points));

        // data to send out to clients
        let result = JSON.stringify({
            user: num,
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
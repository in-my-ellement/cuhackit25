// check whether the device supports accelerometer
if (window.DeviceMotionEvent) {
    const ws = new WebSocket("ws://localhost:2025");
    
    // Connection opened
    ws.addEventListener("open", (event) => {
        ws.send("Hello Server!");
    });
} else {
    alert("accelerometer not supported :[");
}
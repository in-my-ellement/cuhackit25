// WebSocket connection
// TODO: fix this
const ws = new WebSocket('ws://198.21.212.1:2025');

// thats that hazel espresso
let id = undefined;

// DOM elements
const permissionBtn = document.getElementById('permission-btn');
const recorder = document.getElementById('recorder');
const recordBtn = document.getElementById('record-btn');
const accelX = document.getElementById('accel-x');
const accelY = document.getElementById('accel-y');
const accelZ = document.getElementById('accel-z');
const statusEl = document.getElementById('status');
const readingsContainer = document.getElementById('readings-container');

// State variables
let isRecording = false;
let recordedData = [];
let currentAccel = { x: 0, y: 0, z: 0 };
let recordingInterval = null;
let recordingStartTime = 0;

// Event listeners
permissionBtn.addEventListener('click', requestPermissions);
recordBtn.addEventListener('mousedown', startRecording);
recordBtn.addEventListener('touchstart', startRecording);
recordBtn.addEventListener('mouseup', stopRecording);
recordBtn.addEventListener('touchend', stopRecording);
recordBtn.addEventListener('mouseleave', stopRecording);

// Request permissions for device sensors
function requestPermissions() {
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission()
            .then(permissionState => {
                if (permissionState === 'granted') {
                    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                        DeviceOrientationEvent.requestPermission()
                            .then(orientPermission => {
                                if (orientPermission === 'granted') {
                                    initSensors();
                                }
                            })
                            .catch(console.error);
                    } else {
                        initSensors();
                    }
                }
            })
            .catch(console.error);
    } else {
        // No permission needed (Android, older iOS)
        initSensors();
    }
}

// Initialize sensors after permissions
function initSensors() {
    permissionBtn.style.display = 'none';
    recorder.classList.remove('hidden');
    
    if (window.DeviceMotionEvent) {
        window.addEventListener("devicemotion", handleMotion, false);
    } else {
        statusEl.textContent = "Accelerometer not supported on this device";
        statusEl.style.color = "red";
    }
}

// Handle motion data
function handleMotion(event) {
    if (!event.accelerationIncludingGravity) return;
    
    // Update current values
    currentAccel = {
        x: event.accelerationIncludingGravity.x ? parseFloat(event.accelerationIncludingGravity.x.toFixed(2)) : 0,
        y: event.accelerationIncludingGravity.y ? parseFloat(event.accelerationIncludingGravity.y.toFixed(2)) : 0,
        z: event.accelerationIncludingGravity.z ? parseFloat(event.accelerationIncludingGravity.z.toFixed(2)) : 0,
        timestamp: Date.now()
    };
    
    // Update display
    accelX.textContent = currentAccel.x.toFixed(2);
    accelY.textContent = currentAccel.y.toFixed(2);
    accelZ.textContent = currentAccel.z.toFixed(2);
}

// Start recording when button is pressed
function startRecording(e) {
    e.preventDefault(); // Prevent default behavior
    
    if (!window.DeviceMotionEvent) {
        alert("Accelerometer not supported on this device");
        return;
    }
    
    // Clear previous data
    recordedData = [];
    isRecording = true;
    recordingStartTime = Date.now();
    
    // Update UI
    statusEl.textContent = "Recording... release to stop";
    statusEl.style.color = "#e74c3c";
    
    // Record initial point immediately
    recordPoint();
    
    // Set up recording interval
    recordingInterval = setInterval(() => {
        recordPoint();
    }, 50); // Record every 50ms
}

// Record a single data point
function recordPoint() {
    if (isRecording) {
        recordedData.push({
            ...currentAccel,
            elapsedTime: Date.now() - recordingStartTime
        });
    }
}

// Stop recording when button is released
function stopRecording(e) {
    if (!isRecording) return;
    
    clearInterval(recordingInterval);
    isRecording = false;
    
    // Update UI
    statusEl.textContent = "Recording complete";
    statusEl.style.color = "green";
    
    // Select 25 evenly distributed points from the recorded data
    const sampledData = sampleData(recordedData, 25);
    
    // Display the data
    displayRecordedData(sampledData);
    
    // Send to WebSocket
    ws.send(JSON.stringify({
        type: 'recorded-data',
        data: sampledData,
        recordingTime: Date.now() - recordingStartTime
    }));
    
    // Reset status after 2 seconds
    setTimeout(() => {
        statusEl.textContent = "Hold button to record";
        statusEl.style.color = "#555";
    }, 2000);
}

// Sample the data to get exactly 25 points
function sampleData(data, sampleCount) {
    if (data.length <= sampleCount) return data; // Return all if we have fewer than requested
    
    const result = [];
    const step = (data.length - 1) / (sampleCount - 1);
    
    for (let i = 0; i < sampleCount; i++) {
        const index = Math.min(Math.floor(i * step), data.length - 1);
        result.push(data[index]);
    }
    
    return result;
}

// Display the recorded data on the page
function displayRecordedData(data) {
    // Clear the container
    readingsContainer.innerHTML = '';
    
    if (data.length === 0) {
        readingsContainer.innerHTML = '<div class="no-readings">No recordings yet</div>';
        return;
    }
    
    // Create elements for each data point
    data.forEach((point, index) => {
        const item = document.createElement('div');
        item.className = 'reading-item';
        item.innerHTML = `
            <strong>Point ${index + 1}</strong> (${point.elapsedTime}ms): 
            X: ${point.x.toFixed(2)}, 
            Y: ${point.y.toFixed(2)}, 
            Z: ${point.z.toFixed(2)}
        `;
        readingsContainer.appendChild(item);
    });
}

// Only initialize automatically if we don't need permissions
if (typeof DeviceMotionEvent.requestPermission !== 'function') {
    initSensors();
}

// Handle WebSocket events
ws.addEventListener('open', () => {
    alert('WebSocket connected');
});

ws.addEventListener("message", (event) => {
    console.log(event.data);
    if (id === undefined) {
        id = JSON.parse(event.data)["id"];
        console.log(id);
    }
});

ws.addEventListener('error', (error) => {
    alert('WebSocket error:', error);
});

ws.addEventListener('close', () => {
    alert('WebSocket disconnected');
});

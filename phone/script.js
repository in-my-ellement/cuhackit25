// WebSocket connection
const ws = new WebSocket('ws://198.21.212.1:2025');

// ID for the device
let id = undefined;

// DOM elements
const recorder = document.getElementById('recorder');
const recordBtn = document.getElementById('record-btn');
const calibrateBtn = document.createElement('button'); // New button for calibration
const accelX = document.getElementById('accel-x');
const accelY = document.getElementById('accel-y');
const accelZ = document.getElementById('accel-z');
const headingEl = document.createElement('div'); // New element for heading
const statusEl = document.getElementById('status');
const readingsContainer = document.getElementById('readings-container');

// Add calibrate button to the page
calibrateBtn.id = 'calibrate-btn';
calibrateBtn.textContent = 'Set Forward Direction';
calibrateBtn.className = 'btn';
recorder.insertBefore(calibrateBtn, recordBtn);

// Add heading element
headingEl.id = 'heading';
headingEl.innerHTML = 'Heading: <span>N/A</span>';
recorder.insertBefore(headingEl, document.getElementById('accel-data'));

// State variables
let isRecording = false;
let recordedData = [];
let currentAccel = { x: 0, y: 0, z: 0 };
let currentHeading = 0;
let forwardHeading = null;
let recordingInterval = null;
let recordingStartTime = 0;
let headingValues = [];

// Event listeners
recordBtn.addEventListener('mousedown', startRecording);
recordBtn.addEventListener('touchstart', startRecording);
recordBtn.addEventListener('mouseup', stopRecording);
recordBtn.addEventListener('touchend', stopRecording);
recordBtn.addEventListener('mouseleave', stopRecording);
calibrateBtn.addEventListener('click', setForwardDirection);

// Initialize sensors immediately
initSensors();

// Initialize sensors
function initSensors() {
    recorder.classList.remove('hidden');
    
    if (window.DeviceMotionEvent) {
        window.addEventListener("devicemotion", handleMotion, false);
    } else {
        statusEl.textContent = "Accelerometer not supported on this device";
        statusEl.style.color = "red";
    }
    
    if (window.DeviceOrientationEvent) {
        window.addEventListener("deviceorientation", handleOrientation, false);
    } else {
        statusEl.textContent = "Magnetometer not supported on this device";
        statusEl.style.color = "red";
    }
}

// Handle motion data (accelerometer)
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

// Handle orientation data (magnetometer)
function handleOrientation(event) {
    // Get heading (alpha is the compass direction)
    if (event.alpha !== null) {
        currentHeading = event.alpha;
        
        // Update heading display
        headingEl.querySelector('span').textContent = `${currentHeading.toFixed(1)}°`;
        
        // If recording, store heading values
        if (isRecording) {
            headingValues.push(currentHeading);
        }
    }
}

// Set the forward direction
function setForwardDirection() {
    forwardHeading = currentHeading;
    statusEl.textContent = `Forward direction set to ${forwardHeading.toFixed(1)}°`;
    statusEl.style.color = "green";
    calibrateBtn.textContent = `Forward: ${forwardHeading.toFixed(1)}°`;
    
    // Enable the record button
    recordBtn.disabled = false;
    
    setTimeout(() => {
        statusEl.textContent = "Ready to record";
        statusEl.style.color = "#555";
    }, 2000);
}

// Start recording when button is pressed
function startRecording(e) {
    e.preventDefault(); // Prevent default behavior
    
    if (!window.DeviceMotionEvent) {
        alert("Accelerometer not supported on this device");
        return;
    }
    
    if (forwardHeading === null) {
        alert("Please set forward direction first");
        return;
    }
    
    // Clear previous data
    recordedData = [];
    headingValues = [];
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
            x: currentAccel.x,
            y: currentAccel.y,
            z: currentAccel.z,
            heading: currentHeading,
            elapsedTime: Date.now() - recordingStartTime
        });
    }
}

// Calculate heading relative to forward direction
function calculateRelativeHeading(heading) {
    let relative = heading - forwardHeading;
    // Normalize to -180 to 180 degrees
    if (relative > 180) relative -= 360;
    if (relative < -180) relative += 360;
    return relative;
}

// Calculate average heading
function calculateAverageHeading(headings) {
    // Convert to relative headings
    const relativeHeadings = headings.map(h => calculateRelativeHeading(h));
    
    // Calculate average using circular mean
    let sumSin = 0;
    let sumCos = 0;
    
    relativeHeadings.forEach(angle => {
        // Convert to radians
        const radians = angle * (Math.PI / 180);
        sumSin += Math.sin(radians);
        sumCos += Math.cos(radians);
    });
    
    const avgRadians = Math.atan2(sumSin / relativeHeadings.length, sumCos / relativeHeadings.length);
    const avgDegrees = avgRadians * (180 / Math.PI);
    
    return avgDegrees;
}

// Stop recording when button is released
function stopRecording(e) {
    if (!isRecording) return;
    
    clearInterval(recordingInterval);
    isRecording = false;
    
    // Update UI
    statusEl.textContent = "Recording complete";
    statusEl.style.color = "green";
    
    // Calculate average heading relative to forward direction
    const avgHeading = calculateAverageHeading(headingValues);
    
    // Process accelerometer data for sending (only x and y as requested)
    const processedData = recordedData.map(point => ({
        x: point.x,
        y: point.y,
        elapsedTime: point.elapsedTime
    }));
    
    // Select 25 evenly distributed points from the processed data
    const sampledData = sampleData(processedData, 25);
    
    // Display the data
    displayRecordedData(sampledData, avgHeading);
    
    // Send to WebSocket
    ws.send(JSON.stringify({
        type: 'recorded-data',
        data: sampledData,
        recordingTime: Date.now() - recordingStartTime,
        heading: avgHeading
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
function displayRecordedData(data, avgHeading) {
    // Clear the container
    readingsContainer.innerHTML = '';
    
    if (data.length === 0) {
        readingsContainer.innerHTML = '<div class="no-readings">No recordings yet</div>';
        return;
    }
    
    // Add heading information
    const headingInfo = document.createElement('div');
    headingInfo.className = 'heading-info';
    headingInfo.innerHTML = `<strong>Average Direction:</strong> ${avgHeading.toFixed(1)}° ${avgHeading > 0 ? 'right' : 'left'} of forward`;
    readingsContainer.appendChild(headingInfo);
    
    // Create elements for each data point
    data.forEach((point, index) => {
        const item = document.createElement('div');
        item.className = 'reading-item';
        item.innerHTML = `
            <strong>Point ${index + 1}</strong> (${point.elapsedTime}ms): 
            X: ${point.x.toFixed(2)}, 
            Y: ${point.y.toFixed(2)}
        `;
        readingsContainer.appendChild(item);
    });
}

// Handle WebSocket events
ws.addEventListener('open', () => {
    console.log('WebSocket connected');
    
    // Disable record button until forward direction is set
    recordBtn.disabled = true;
});

ws.addEventListener("message", (event) => {
    console.log(event.data);
    if (id === undefined) {
        id = JSON.parse(event.data)["id"];
        console.log(id);
    }
});

ws.addEventListener('error', (error) => {
    console.error('WebSocket error:', error);
});

ws.addEventListener('close', () => {
    console.log('WebSocket disconnected');
});

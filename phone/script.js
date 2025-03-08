// WebSocket connection
const ws = new WebSocket('ws://198.21.212.1:2025');

// ID for the device
let id = undefined;

// Create the app structure first
document.body.innerHTML = `
<div id="app-container">
  <header>
    <h1>vincent van gesture</h1>
  </header>
  
  <main>
    <div id="recorder" class="hidden">
      <div id="status">initializing sensors...</div>
      
      <div id="calibration-container">
        <button id="calibrate-btn" class="btn primary-btn">set forward direction</button>
      </div>
      
      <div id="recording-container" class="hidden">
        <button id="record-btn" class="btn record-btn">hold to record motion</button>
      </div>
      
      <div id="sensor-data">
        <div id="heading">heading: <span>N/A</span></div>
        <div id="accel-data">
          <div>X: <span id="accel-x">0.00</span>g</div>
          <div>Y: <span id="accel-y">0.00</span>g</div>
          <div>Z: <span id="accel-z">0.00</span>g</div>
        </div>
      </div>
    </div>
    
    <div id="readings-container">
      <div class="no-readings">no recordings yet</div>
    </div>
  </main>
</div>
`;

// Add styles
const styleElement = document.createElement('style');
styleElement.textContent = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }
  
  body {
    background-color: #f0f0f0;
    color: #333;
  }
  
  #app-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
  }
  
  header {
    text-align: center;
    margin-bottom: 20px;
  }
  
  h1 {
    color: #2c3e50;
  }
  
  #recorder {
    background-color: #2c3e50;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    color: white;
  }
  
  #status {
    text-align: center;
    margin-bottom: 15px;
    font-weight: 500;
    color: #e0e0e0;
  }
  
  .btn {
    display: block;
    width: 100%;
    padding: 15px;
    margin: 10px 0;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    outline: none;
  }
  
  .primary-btn {
    background-color: #b3d4fc; /* Pale blue */
    color: #2c3e50;
  }
  
  .primary-btn:hover {
    background-color: #a0c4f0;
  }
  
  .record-btn {
    background-color: #4169e1; /* Royal blue */
    color: white;
  }
  
  .record-btn:hover {
    background-color: #3158d3;
  }
  
  .record-btn:active {
    background-color: #3a2e78; /* Purple when recording */
  }
  
  #sensor-data {
    margin-top: 20px;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 15px;
  }
  
  #heading, #accel-data {
    margin: 10px 0;
  }
  
  #accel-data {
    display: flex;
    justify-content: space-between;
  }
  
  #accel-data div {
    flex: 1;
    text-align: center;
    padding: 5px;
  }
  
  .hidden {
    display: none !important;
  }
  
  #readings-container {
    background-color: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  .heading-info {
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid #eee;
    font-size: 18px;
    color: #2c3e50;
  }
  
  .reading-item {
    padding: 10px;
    border-bottom: 1px solid #eee;
  }
  
  .reading-item:last-child {
    border-bottom: none;
  }
  
  .no-readings {
    text-align: center;
    color: #888;
    padding: 20px;
  }
`;
document.head.appendChild(styleElement);

// DOM elements (after they've been created in the HTML)
const recorder = document.getElementById('recorder');
const recordBtn = document.getElementById('record-btn');
const calibrateBtn = document.getElementById('calibrate-btn');
const accelX = document.getElementById('accel-x');
const accelY = document.getElementById('accel-y');
const accelZ = document.getElementById('accel-z');
const headingEl = document.getElementById('heading');
const statusEl = document.getElementById('status');
const readingsContainer = document.getElementById('readings-container');
const calibrationContainer = document.getElementById('calibration-container');
const recordingContainer = document.getElementById('recording-container');

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
        statusEl.textContent = "accelerometer not supported on this device";
        statusEl.style.color = "#ff7675";
    }
    
    if (window.DeviceOrientationEvent) {
        window.addEventListener("deviceorientation", handleOrientation, false);
    } else {
        statusEl.textContent = "magnetometer not supported on this device";
        statusEl.style.color = "#ff7675";
    }
    
    // Set initial status
    if (window.DeviceMotionEvent && window.DeviceOrientationEvent) {
        statusEl.textContent = "set the forward direction to begin";
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
    statusEl.style.color = "#2ecc71";
    
    // Hide calibration button and show recording button
    calibrationContainer.classList.add('hidden');
    recordingContainer.classList.remove('hidden');
    
    // Set a badge with forward direction
    const directionBadge = document.createElement('div');
    directionBadge.style.backgroundColor = 'rgba(255,255,255,0.1)';
    directionBadge.style.padding = '8px 12px';
    directionBadge.style.borderRadius = '4px';
    directionBadge.style.marginTop = '10px';
    directionBadge.style.textAlign = 'center';
    directionBadge.innerHTML = `<span>Forward: ${forwardHeading.toFixed(1)}°</span>`;
    recordingContainer.appendChild(directionBadge);
    
    setTimeout(() => {
        statusEl.textContent = "hold button to record motion";
        statusEl.style.color = "#e0e0e0";
    }, 2000);
}

// Start recording when button is pressed
function startRecording(e) {
    e.preventDefault(); // Prevent default behavior
    
    if (!window.DeviceMotionEvent) {
        alert("accelerometer not supported on this device");
        return;
    }
    
    if (forwardHeading === null) {
        alert("please set forward direction first");
        return;
    }
    
    // Clear previous data
    recordedData = [];
    headingValues = [];
    isRecording = true;
    recordingStartTime = Date.now();
    
    // Update UI
    recordBtn.style.backgroundColor = "#3a2e78";
    statusEl.textContent = "recording... release to stop";
    statusEl.style.color = "#ff7675";
    
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
    recordBtn.style.backgroundColor = "#4169e1";
    statusEl.textContent = "recording complete";
    statusEl.style.color = "#2ecc71";
    
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
        statusEl.textContent = "hold button to record motion";
        statusEl.style.color = "#e0e0e0";
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
    
    // Create a directional indicator
    const direction = avgHeading > 0 ? 'right' : 'left';
    const arrowChar = avgHeading > 0 ? '→' : '←';
    const absHeading = Math.abs(avgHeading);
    
    headingInfo.innerHTML = `
        <strong>Average Direction:</strong> 
        <div style="font-size: 1.2em; margin-top: 8px;">
            ${absHeading.toFixed(1)}° ${direction} of forward ${arrowChar}
        </div>
    `;
    readingsContainer.appendChild(headingInfo);
    
    // Add a separator
    const separator = document.createElement('div');
    separator.style.margin = '15px 0';
    separator.style.borderBottom = '1px solid #eee';
    readingsContainer.appendChild(separator);
    
    // Add data points title
    const dataTitle = document.createElement('div');
    dataTitle.style.fontWeight = 'bold';
    dataTitle.style.margin = '10px 0';
    dataTitle.textContent = 'Recorded Data Points';
    readingsContainer.appendChild(dataTitle);
    
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
});

ws.addEventListener("message", (event) => {
    console.log(event.data);
    if (id === undefined) {
        id = JSON.parse(event.data)["id"];
        console.log(id);
    }
});

ws.addEventListener('error', (error) => {
    console.error('websocket error:', error);
    statusEl.textContent = "websocket error - check console";
    statusEl.style.color = "#ff7675";
});

ws.addEventListener('close', () => {
    console.log('WebSocket disconnected');
    statusEl.textContent = "websocket disconnected";
    statusEl.style.color = "#ff7675";
});

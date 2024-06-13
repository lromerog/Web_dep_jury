const locations = [
    { name: "Home", lat: 51.0066688, lon: 4.4924928, radius: 0.3 },
    { name: "School", lat: 51.0225819, lon: 4.4878087, radius: 0.3 }
];

let moodData = loadData('moodData') || {};
let activityData = loadData('activityData') || {};
let voiceLogs = loadData('voiceLogs') || {};
let locationLogs = loadData('locationLogs') || [];
let emojiLog = loadData('emojiLog') || [];
let recognition;
const emojiCounts = {};

// Initialize the application
function setup() {
    cleanUpOldData(); // Clean up data from previous dates

    twemoji.parse(document.body);

    // Update UI with stored data
    updateEmojiLog();
    updateVoiceLogs(); // This will now clear and show only new logs
    updateLocationLogs();
    updateActivityList();
    initCharts(); // Initialize charts
}

// Clean up data older than today
function cleanUpOldData() {
    const today = new Date().toLocaleDateString();

    // Clean moodData
    Object.keys(moodData).forEach(date => {
        if (date !== today) {
            delete moodData[date];
            console.log(`Deleted old mood data for date: ${date}`);
        }
    });

    // Clean activityData
    Object.keys(activityData).forEach(date => {
        if (date !== today) {
            delete activityData[date];
            console.log(`Deleted old activity data for date: ${date}`);
        }
    });

    // Clean voiceLogs
    Object.keys(voiceLogs).forEach(date => {
        if (!Array.isArray(voiceLogs[date]) || date !== today) {
            delete voiceLogs[date];
            console.log(`Deleted invalid voice log data for date: ${date}`);
        }
    });

    // Clean locationLogs
    locationLogs = locationLogs.filter(log => log.includes(today));

    // Clean emojiLog
    emojiLog.forEach(entry => {
        entry.timestamps = entry.timestamps.filter(timestamp => timestamp.includes(today));
        if (entry.timestamps.length === 0) {
            emojiLog = emojiLog.filter(e => e !== entry);
        }
    });

    // Save cleaned data
    saveData('moodData', moodData);
    saveData('activityData', activityData);
    saveData('voiceLogs', voiceLogs);
    saveData('locationLogs', locationLogs);
    saveData('emojiLog', emojiLog);
}

// Function to save data to local storage
function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// Function to load data from local storage
function loadData(key) {
    return JSON.parse(localStorage.getItem(key)) || null;
}

// Get current date and time
function getCurrentDateTime() {
    const now = new Date();
    const date = now.toLocaleDateString();
    const time = now.toLocaleTimeString();
    return `${date} ${time}`;
}

// Handle speech recognition result
function handleSpeech(event) {
    const result = event.results[event.results.length - 1][0].transcript;
    addActivityVoice(result);
}

// Start listening for voice input
function startListening() {
    if (!recognition) {
        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.onresult = handleSpeech;
        recognition.continuous = false;
        recognition.interimResults = false;
    }
    recognition.start();
}

// Validate login form
function validateForm(event) {
    event.preventDefault(); // Prevent form from submitting
    const phone = document.getElementById('phone').value;
    const password = document.getElementById('password').value;
    const feedback = document.getElementById('loginFeedback');

    if (!phone || !password) {
        feedback.textContent = 'Please enter both phone number and password';
        return false;
    }

    feedback.textContent = '';
    alert('Login successful');
    // Implement showWelcomeScreen function if needed
    return false; // Prevent actual form submission for demo
}

// Update mood and log it
function updateMood(mood) {
    document.getElementById('mood').innerText = mood;
    twemoji.parse(document.getElementById('mood')); // Render updated emoji with Twemoji
    const dateTime = getCurrentDateTime();
    const date = new Date().toLocaleDateString();

    // Count emoji clicks
    if (!emojiCounts[mood]) {
        emojiCounts[mood] = 0;
    }
    emojiCounts[mood]++;
    console.log(`Emoji ${mood} clicked ${emojiCounts[mood]} times`);

    // Ensure moodData[date] is an array
    if (!Array.isArray(moodData[date])) {
        moodData[date] = [];
    }
    moodData[date].unshift({ mood, dateTime }); // Add to beginning

    // Update emoji log
    const emojiEntry = emojiLog.find(entry => entry.mood === mood);
    if (emojiEntry) {
        emojiEntry.count++;
        emojiEntry.timestamps.unshift(dateTime);
    } else {
        emojiLog.push({ mood, count: 1, timestamps: [dateTime] });
    }

    saveData('moodData', moodData);
    saveData('emojiLog', emojiLog);
    updateEmojiLog();
    updateCharts(); // Update charts immediately
}

// Add activity from text input
function addActivity() {
    const activityInput = document.getElementById('activityInput');
    const activityText = activityInput.value;
    if (activityText) {
        addActivityEntry(activityText, 'text');
        activityInput.value = ''; // Clear input field
    }
}

// Add activity from voice input
function addActivityVoice(activity) {
    if (activity) {
        const date = new Date().toLocaleDateString();
        // Ensure voiceLogs[date] is an array
        if (!Array.isArray(voiceLogs[date])) {
            voiceLogs[date] = [];
        }
        const activityWithTimestamp = `${getCurrentDateTime()}: ${activity} (voice)`;
        voiceLogs[date].unshift(activityWithTimestamp); // Add to beginning
        updateVoiceLogs(); // Update voice logs display
        saveData('voiceLogs', voiceLogs);
        addActivityEntry(activity, 'voice');
    } else {
        console.error("No activity to add from voice input.");
    }
}

// Add activity entry to list
function addActivityEntry(activity, type) {
    const date = new Date().toLocaleDateString();
    // Ensure activityData[date] is an array
    if (!Array.isArray(activityData[date])) {
        activityData[date] = [];
    }
    const activityWithTimestamp = `${getCurrentDateTime()}: ${activity} (${type})`;
    activityData[date].unshift(activityWithTimestamp); // Add to beginning
    const activityList = document.getElementById('activityList');
    if (activityList && type === 'text') {
        const activityItem = document.createElement('div');
        activityItem.classList.add('activity-entry');
        activityItem.innerText = activityWithTimestamp;
        activityList.prepend(activityItem); // Prepend to show at the top
    }
    saveData('activityData', activityData);
    updateActivityList(); // Update activity list
    updateCharts(); // Update charts immediately
}

// Update activity list from stored data
function updateActivityList() {
    const activityLogTableBody = document.querySelector('#activityLogTable tbody');
    if (activityLogTableBody) {
        activityLogTableBody.innerHTML = ''; // Clear activity log table
        Object.keys(activityData).forEach(date => {
            if (Array.isArray(activityData[date])) {
                activityData[date].forEach(activity => {
                    const activityItem = document.createElement('tr');
                    const activityParts = activity.split(': ');
                    const activityType = activityParts.pop().split(' ')[1];
                    const activityText = activityParts.join(': ').split(' (')[0];
                    activityItem.innerHTML = `
                        <td>${date}</td>
                        <td>${activityText}</td>
                        <td>${activityType}</td>
                    `;
                    activityLogTableBody.appendChild(activityItem);
                });
            }
        });
    } else {
        console.error("Activity log table body not found");
    }
}

// Get current location
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(saveLocation, handleLocationError);
    } else {
        console.error("Geolocation is not supported by this browser.");
    }
}

// Save location data
function saveLocation(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const dateTime = getCurrentDateTime();
    const locationName = identifyLocation(latitude, longitude);
    const location = `${locationName} - Latitude: ${latitude}, Longitude: ${longitude} - ${dateTime}`;
    locationLogs.unshift(location); // Add to beginning
    const locationLog = document.getElementById('locationLog');
    if (locationLog) {
        const locationItem = document.createElement('div');
        locationItem.classList.add('location-entry');
        locationItem.innerText = location;
        locationLog.prepend(locationItem);
    }
    document.getElementById('location').innerText = locationName;
    saveData('locationLogs', locationLogs);

    // Verify if coordinates are valid
    if (!isNaN(latitude) && !isNaN(longitude)) {
        // Update map
        L.marker([latitude, longitude]).addTo(myMap)
            .bindPopup(location)
            .openPopup();
        myMap.setView([latitude, longitude], 13);
    } else {
        console.error("Invalid coordinates: ", latitude, longitude);
    }

    // Log the mood associated with the location
    const mood = document.getElementById('mood').innerText;
    if (mood) {
        const moodLocationEntry = {
            lat: latitude,
            lon: longitude,
            mood: mood,
            dateTime: dateTime
        };
        const date = new Date().toLocaleDateString();
        moodData[date] = moodData[date] || [];
        moodData[date].push(moodLocationEntry);
        saveData('moodData', moodData);
        updateCharts(); // Update charts immediately
    }
}

// Identify location based on coordinates
function identifyLocation(lat, lon) {
    let closestLocation = null;
    let minDistance = Infinity;

    locations.forEach(location => {
        const distance = getDistance(lat, lon, location.lat, location.lon);
        if (distance < location.radius && distance < minDistance) {
            minDistance = distance;
            closestLocation = location;
        }
    });

    return closestLocation ? closestLocation.name : locations[0].name;
}

// Calculate distance between two coordinates
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lat2 - lon2);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in kilometers
    return d;
}

// Convert degrees to radians
function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

// Handle location error
function handleLocationError(error) {
    console.error("Error getting location:", error);
    document.getElementById('location').innerText = "Error getting location";
}

// Update emoji log from stored data
function updateEmojiLog() {
    const emojiTableContainer = document.getElementById('emojiTableContainer');
    if (emojiTableContainer) {
        emojiTableContainer.querySelector('tbody').innerHTML = '';

        emojiLog.sort((a, b) => a.mood.localeCompare(b.mood)); // Sort by emoji for ordered log

        emojiLog.forEach(entry => {
            // Create table row for emoji table
            const tableRow = document.createElement('tr');
            tableRow.innerHTML = `
                <td>${entry.mood}</td>
                <td>${entry.count}</td>
                <td>${entry.timestamps.slice(0, 5).join('<br>')}</td>
            `;
            emojiTableContainer.querySelector('tbody').appendChild(tableRow);
        });
    } else {
        console.error("Emoji table container not found");
    }
}

// Update voice logs from stored data
function updateVoiceLogs() {
    const voiceLog = document.getElementById('voiceLog');
    if (voiceLog) {
        voiceLog.innerHTML = ''; // Clear all existing logs
        Object.keys(voiceLogs).forEach(date => {
            if (Array.isArray(voiceLogs[date])) {
                // Filter out blank and erroneous entries
                voiceLogs[date] = voiceLogs[date].filter(log => log && log.trim() !== '');
                voiceLogs[date].forEach(log => {
                    const activityItem = document.createElement('div');
                    activityItem.classList.add('activity-entry');
                    activityItem.innerText = log;
                    voiceLog.appendChild(activityItem); // Append to keep order
                });
            } else {
                console.error("Deleted invalid voice log data for date: ", date);
                delete voiceLogs[date];
            }
        });
    } else {
        console.error("Voice log container not found");
    }
    saveData('voiceLogs', voiceLogs);
}

// Update location logs from stored data
function updateLocationLogs() {
    const locationLog = document.getElementById('locationLog');
    if (locationLog) {
        locationLog.innerHTML = '';
        locationLogs.forEach(log => {
            const locationItem = document.createElement('div');
            locationItem.classList.add('location-entry');
            locationItem.innerText = log;
            locationLog.appendChild(locationItem); // Append to keep order
        });
    } else {
        console.error("Location log container not found");
    }
}

// Initialize Leaflet map
let myMap;
function initMap() {
    const mapContainer = document.getElementById('mapContainer');
    if (mapContainer) {
        myMap = L.map('mapContainer').setView([51.505, -0.09], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(myMap);

        // Add markers for existing location logs
        locationLogs.forEach(log => {
            const coordinates = log.match(/-?\d+(\.\d+)?/g).map(Number);
            if (coordinates.length >= 2) {
                const latitude = coordinates[0];
                const longitude = coordinates[1];
                if (!isNaN(latitude) && !isNaN(longitude)) {
                    L.marker([latitude, longitude]).addTo(myMap)
                        .bindPopup(log)
                        .openPopup();
                }
            }
        });
    } else {
        console.error("Map container not found");
    }
}

// Initialize charts using Plotly.js
function initCharts() {
    const emojiChartContainer = document.getElementById('emojiChartContainer');
    const textChartContainer = document.getElementById('textChartContainer');
    const voiceChartContainer = document.getElementById('voiceChartContainer');

    if (emojiChartContainer) {
        // Emoji Chart
        const emojiUsageData = emojiLog.map(entry => ({
            x: [entry.mood],
            y: [entry.count],
            type: 'bar',
            text: entry.mood,
            marker: { color: 'rgba(75, 192, 192, 0.6)' },
            name: entry.mood // Add the emoji as the trace name
        }));

        const emojiLayout = {
            title: 'Emoji Usage',
            xaxis: { title: 'Emoji' },
            yaxis: { title: 'Count' }
        };

        Plotly.newPlot(emojiChartContainer, emojiUsageData, emojiLayout);
    }

    if (textChartContainer) {
        // Text Chart
        const textEntries = Object.values(activityData).flat().filter(entry => typeof entry === 'string');
        const textPosNeg = textEntries.reduce((acc, entry) => {
            if (entry.includes('good')) acc.positive++;
            if (entry.includes('bad')) acc.negative++;
            return acc;
        }, { positive: 0, negative: 0 });

        const textChartData = [{
            x: ['Positive', 'Negative'],
            y: [textPosNeg.positive, textPosNeg.negative],
            type: 'bar',
            marker: { color: ['rgba(75, 192, 192, 0.6)', 'rgba(255, 99, 132, 0.6)'] }
        }];

        Plotly.newPlot(textChartContainer, textChartData, {
            title: 'Text Entries Sentiment',
            xaxis: { title: 'Sentiment' },
            yaxis: { title: 'Count' }
        });
    }

    if (voiceChartContainer) {
        // Voice Chart
        const voiceEntries = Object.values(voiceLogs).flat().filter(entry => typeof entry === 'string');
        const voicePosNeg = voiceEntries.reduce((acc, entry) => {
            if (entry.includes('good')) acc.positive++;
            if (entry.includes('bad')) acc.negative++;
            return acc;
        }, { positive: 0, negative: 0 });

        const voiceChartData = [{
            x: ['Positive', 'Negative'],
            y: [voicePosNeg.positive, voicePosNeg.negative],
            type: 'bar',
            marker: { color: ['rgba(75, 192, 192, 0.6)', 'rgba(255, 99, 132, 0.6)'] }
        }];

        Plotly.newPlot(voiceChartContainer, voiceChartData, {
            title: 'Voice Entries Sentiment',
            xaxis: { title: 'Sentiment' },
            yaxis: { title: 'Count' }
        });
    }

    if (!emojiChartContainer || !textChartContainer || !voiceChartContainer) {
        console.error("One or more chart containers not found in the DOM");
    }
}

// Function to update charts with new data
function updateCharts() {
    // Reinitialize charts with new data
    initCharts();
}

// Ensure DOM elements exist before adding event listeners
document.addEventListener('DOMContentLoaded', (event) => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', validateForm);
    }

    const viewActivityStatsButton = document.getElementById('viewActivityStats');
    if (viewActivityStatsButton) {
        viewActivityStatsButton.addEventListener('click', () => moveToContainer('additionalFeaturesContainer'));
    }

    const feature1Next = document.getElementById('feature1Next');
    if (feature1Next) {
        feature1Next.addEventListener('click', () => moveCarousel(1));
    }

    const feature2Next = document.getElementById('feature2Next');
    if (feature2Next) {
        feature2Next.addEventListener('click', () => moveCarousel(1));
    }

    const feature3Next = document.getElementById('feature3Next');
    if (feature3Next) {
        feature3Next.addEventListener('click', () => moveCarousel(1));
    }

    const feature1Prev = document.getElementById('feature1Prev');
    if (feature1Prev) {
        feature1Prev.addEventListener('click', () => moveCarousel(-1));
    }

    const feature2Prev = document.getElementById('feature2Prev');
    if (feature2Prev) {
        feature2Prev.addEventListener('click', () => moveCarousel(-1));
    }

    const feature3Prev = document.getElementById('feature3Prev');
    if (feature3Prev) {
        feature3Prev.addEventListener('click', () => moveCarousel(-1));
    }
});

// Define moveCarousel function
function moveCarousel(direction) {
    const items = document.querySelectorAll('.carousel-item');
    let currentIndex;

    items.forEach((item, index) => {
        if (item.classList.contains('active')) {
            currentIndex = index;
            item.classList.remove('active');
            item.style.display = 'none';
        }
    });

    let newIndex = currentIndex + direction;
    if (newIndex < 0) {
        newIndex = items.length - 1;
    } else if (newIndex >= items.length) {
        newIndex = 0;
    }

    items[newIndex].classList.add('active');
    items[newIndex].style.display = 'block';
}

// Define moveToContainer function
function moveToContainer(containerId) {
    const items = document.querySelectorAll('.carousel-item');
    items.forEach((item) => {
        item.classList.remove('active');
        item.style.display = 'none';
    });

    const targetContainer = document.getElementById(containerId);
    if (targetContainer) {
        targetContainer.classList.add('active');
        targetContainer.style.display = 'block';
    } else {
        console.error(`Container with id ${containerId} not found`);
    }
}

window.onload = function () {
    setup();
    updateActivityList(); // Retrieve and display saved activities
    updateVoiceLogs(); // Retrieve and display saved voice logs
    updateLocationLogs(); // Retrieve and display saved location logs
    updateEmojiLog(); // Retrieve and display saved emoji logs
    initMap(); // Initialize Leaflet map
    initCharts(); // Initialize Plotly.js charts

    // Hide all containers except the first one when the page loads
    const items = document.querySelectorAll('.carousel-item');
    items.forEach((item, index) => {
        if (index !== 0) {
            item.classList.remove('active');
            item.style.display = 'none';
        } else {
            item.classList.add('active');
            item.style.display = 'block';
        }
    });
};

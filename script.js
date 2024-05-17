// script.js
let moodData = JSON.parse(localStorage.getItem('moodData')) || {};
let activityData = JSON.parse(localStorage.getItem('activityData')) || {};
let voiceLogs = JSON.parse(localStorage.getItem('voiceLogs')) || [];
let recognition;

function setup() {
    recognition = new webkitSpeechRecognition();
    recognition.onresult = handleSpeech;
}

function getCurrentDateTime() {
    const now = new Date();
    const date = now.toLocaleDateString();
    const time = now.toLocaleTimeString();
    return `${date} ${time}`;
}

function handleSpeech(event) {
    const result = event.results[event.results.length - 1][0].transcript;
    addActivityVoice(result);
}

function startListening() {
    if (recognition) {
        recognition.start();
    } else {
        console.error('Speech recognition not initialized');
    }
}

function updateMood(mood) {
    document.getElementById('mood').innerText = mood;
    const date = new Date().toLocaleDateString();
    if (!moodData[date]) {
        moodData[date] = [];
    }
    moodData[date].push(mood);
    saveData();
    updateStats();
}

function addActivity() {
    const activityInput = document.getElementById('activityInput');
    const activityText = activityInput.value;
    if (activityText) {
        const date = new Date().toLocaleDateString();
        if (!activityData[date]) {
            activityData[date] = [];
        }
        const activityWithTimestamp = `${getCurrentDateTime()}: ${activityText}`;
        activityData[date].push(activityWithTimestamp);
        const activityList = document.getElementById('activityList');
        const activityItem = document.createElement('div');
        activityItem.classList.add('activity-entry');
        activityItem.innerText = activityWithTimestamp;
        activityList.appendChild(activityItem);
        activityInput.value = '';
        saveData();
    }
}

function addActivityVoice(activity = null) {
    const date = new Date().toLocaleDateString();
    if (!activityData[date]) {
        activityData[date] = [];
    }
    const activityWithTimestamp = `${getCurrentDateTime()}: ${activity}`;
    activityData[date].push(activityWithTimestamp);
    voiceLogs.push(activityWithTimestamp);
    saveData();
    updateVoiceLogs();
}

function updateVoiceLogs() {
    const voiceLog = document.getElementById('voiceLog');
    voiceLog.innerHTML = '';
    voiceLogs.forEach(log => {
        const activityItem = document.createElement('div');
        activityItem.classList.add('activity-entry');
        activityItem.innerText = log;
        voiceLog.appendChild(activityItem);
    });
}

function saveData() {
    localStorage.setItem('moodData', JSON.stringify(moodData));
    localStorage.setItem('activityData', JSON.stringify(activityData));
    localStorage.setItem('voiceLogs', JSON.stringify(voiceLogs));
}

function updateStats() {
    const statsTableBody = document.getElementById('statsTableBody');
    statsTableBody.innerHTML = '';

    for (const date in moodData) {
        const moodCount = moodData[date].length;
        const activities = activityData[date] ? activityData[date].length : 0;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${date}</td>
            <td>${moodCount}</td>
            <td>${activities}</td>
        `;
        statsTableBody.appendChild(row);
    }
}

window.onload = function() {
    setup();
    updateStats();
    updateVoiceLogs();
};

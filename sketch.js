// sketch.js

function setup() {
  // Ensure noCanvas is called correctly
  let canvas = document.querySelector('canvas');
  if (canvas) {
      canvas.parentNode.removeChild(canvas);
  }

  // Initialize speech recognition if it's not already initialized
  if (typeof recognition === 'undefined') {
      recognition = new p5.SpeechRec("en-US", handleSpeech);
      recognition.continuous = true; // Continuously listen for speech
      recognition.interimResults = false; // Do not provide interim results
      recognition.start(); // Start the speech recognition engine
  }
}

function draw() {
  // No need for a canvas, using HTML elements for display
}

function handleSpeech() {
  if (recognition.resultValue) {
      const result = recognition.resultString;
      addActivityVoice(result);
  }
}

function addActivityVoice(activity) {
  const date = new Date().toLocaleDateString();
  const activityWithTimestamp = `${getCurrentDateTime()}: ${activity}`;
  voiceLogs.unshift(activityWithTimestamp); // unshift para agregar al inicio
  const voiceLog = document.getElementById('voiceLog');
  const activityItem = document.createElement('div');
  activityItem.classList.add('activity-entry');
  activityItem.innerText = activityWithTimestamp;
  voiceLog.prepend(activityItem); // prepend para que aparezca primero
  saveData();
  updateVoiceLogs();
}

function getCurrentDateTime() {
  const now = new Date();
  const date = now.toLocaleDateString();
  const time = now.toLocaleTimeString();
  return `${date} ${time}`;
}

function saveData() {
  localStorage.setItem('moodData', JSON.stringify(moodData));
  localStorage.setItem('activityData', JSON.stringify(activityData));
  localStorage.setItem('voiceLogs', JSON.stringify(voiceLogs));
  localStorage.setItem('locationLogs', JSON.stringify(locationLogs));
}

function updateVoiceLogs() {
  const voiceLog = document.getElementById('voiceLog');
  voiceLog.innerHTML = '';
  voiceLogs.forEach(log => {
      const activityItem = document.createElement('div');
      activityItem.classList.add('activity-entry');
      activityItem.innerText = log;
      voiceLog.appendChild(activityItem); // appendChild para mantener el orden
  });
}

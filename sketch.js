const recognition = new p5.SpeechRec("en-US");

let textToShow = "";

function setup() {
  createCanvas(400, 400);
  background(50);
  let button = createButton('speak');
  button.position(10, 10);
  button.mousePressed(handleButtonClick);
  console.log(recognition);
  recognition.onResult = handleSpeech;

}

function draw() {
  fill(255);
  textSize(32);
  textAlign(CENTER, CENTER);
  text(textToShow, 200, 200);
}

function handleSpeech() {
  if (recognition.resultValue == true) {
    console.log(recognition.resultString);
    textToShow = recognition.resultString

  }
}

function handleButtonClick() {
  recognition.start();
  // console.log("i think you clicked the button");
}
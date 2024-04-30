
let filenames = [
  "1F.wav", "1F_up.wav", "1G.wav", "1G_up.wav",
  "2A.wav", "2A_up.wav", "2B.wav", "2C.wav", "2C_up.wav", "2D.wav", "2D_up.wav", "2E.wav", "2F.wav", "2F_up.wav", "2G.wav", "2G_up.wav",
  "3A.wav", "3A_up.wav", "3B.wav", "3C.wav", "3C_up.wav", "3D.wav", "3D_up.wav", "3E.wav", "3F.wav", "3F_up.wav", "3G.wav", "3G_up.wav",
  "4A.wav", "4A_up.wav", "4B.wav",
  "5C.wav", "5C_up.wav", "5D.wav", "5D_up.wav", "5E.wav"
];
var sounds = [];
let video;

let myHandLandmarker;
let handLandmarks;
let myCapture;
let lastVideoTime = -1;
let leftHand = []
let rightHand = []
let wKeys = []
let bKeys = []

let splash;
let preview = true

async function preload() {
  
  for (let i = 0; i < filenames.length; i++) {
    let name = `sounds/${filenames[i]}`
    sounds.push(loadSound(name));
  }

  const mediapipe_module = await import(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.js"
  );

  HandLandmarker = mediapipe_module.HandLandmarker;
  FilesetResolver = mediapipe_module.FilesetResolver;

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.7/wasm"
  );

  myHandLandmarker = await HandLandmarker.createFromOptions(vision, {
    numHands: 2,
    runningMode: "VIDEO",
    baseOptions: {
      delegate: "GPU",
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
    },
  });

}

function setup() {
  createCanvas(800, 600);

  splash = new Splash()

  myCapture = createCapture(VIDEO);
  myCapture.size(320, 240);
  myCapture.hide();

  let startX = 60
  let startY = 100

  let wi = 0
  let bi = 0
  let offsetX = 0

  for (var i = 0; i < sounds.length; i++) {
    let sound = sounds[i]
    let x = 0;
    let y = startY;
    let w = 0
    let h = 0
    if ([1, 3, 5, 8, 10, 13, 15, 17, 20, 22, 25, 27, 29, 32, 34].includes(i)) {
      if (i == 8 || i == 13 || i == 20 || i == 25 || i == 32) {
        offsetX += 29.5
      }
      x = offsetX + 20 + startX + bi * 33;
      w = 20
      h = 95
      bi++
      bKeys.push({
        x, y, w, h, sound, playTime: 0
      })
    } else {
      x = startX + wi * 32;
      w = 30
      h = 160
      wi++;
      wKeys.push({
        x, y, w, h, sound, playTime: 0
      })
    }
  }
}

function draw() {
  background(150);

  push()
  translate(width, 0)
  scale(-1, 1)
  image(myCapture, 0, 0, width, height)
  pop()

  noStroke();

  for (let i = 0; i < wKeys.length; i++) {
    let wk = wKeys[i];
    let sound = wk.sound
    if (sound.isPlaying()) {
      fill(220);
    } else {
      fill(255);
    }
    rect(wk.x, wk.y, wk.w, wk.h);

    let list = [...leftHand, ...rightHand]
    let isActive = false;
    for (let j = 0; j < list.length; j++) {
      let hand = list[j];
      if (hand.x >= wk.x && hand.x <= wk.x + wk.w &&
        hand.y >= wk.y && hand.y <= wk.y + wk.h) {
        if (millis() - wk.playTime > 1000) {
          sound.play();
          wk.playTime = millis();
        }
        isActive = true;
      }
    }

    if (!isActive) {
      sound.stop();
    }
  }

  for (let i = 0; i < bKeys.length; i++) {
    let bk = bKeys[i];
    let sound = bk.sound
    if (sound.isPlaying()) {
      fill(100);
    } else {
      fill(0);
    }
    rect(bk.x, bk.y, bk.w, bk.h);

    let list = [...leftHand, ...rightHand]
    let isActive = false;
    for (let j = 0; j < list.length; j++) {
      let hand = list[j];
      if (hand.x >= bk.x && hand.x <= bk.x + bk.w &&
        hand.y >= bk.y && hand.y <= bk.y + bk.h) {
        if (millis() - bk.playTime > 1000) {
          sound.play();
          bk.playTime = millis();
        }
        isActive = true;
      }
    }

    if (!isActive) {
      sound.stop();
    }
  }

  predictWebcam();
  drawHandPoints();

  if (preview) {
    splash.display()
  }
}


async function predictWebcam() {
  let startTimeMs = performance.now();
  if (lastVideoTime !== myCapture.elt.currentTime) {
    if (myHandLandmarker) {
      handLandmarks = myHandLandmarker.detectForVideo(
        myCapture.elt,
        startTimeMs
      );
    }
    lastVideoTime = myCapture.elt.currentTime;
  }
}


function drawHandPoints() {
  if (handLandmarks && handLandmarks.landmarks) {
    const nHands = handLandmarks.landmarks.length;
    if (nHands > 0) {
      // Draw lines connecting the joints of the fingers
      noFill();
      stroke("black");

      strokeWeight(2.0);
      for (let h = 0; h < nHands; h++) {
        let joints = handLandmarks.landmarks[h];
        drawConnectors(joints, HANDLANDMARKER_PALM);
        drawConnectors(joints, HANDLANDMARKER_THUMB);
        drawConnectors(joints, HANDLANDMARKER_INDEX_FINGER);
        drawConnectors(joints, HANDLANDMARKER_MIDDLE_FINGER);
        drawConnectors(joints, HANDLANDMARKER_RING_FINGER);
        drawConnectors(joints, HANDLANDMARKER_PINKY);
      }

     
      strokeWeight(1.0);
      stroke("black");
      fill(25, 255, 0);

      for (let h = 0; h < nHands; h++) {
        let joints = handLandmarks.landmarks[h];
        let handednesses = handLandmarks.handednesses[h][0]
        if (handednesses.categoryName == 'Left') {
          leftHand = []
        }
        if (handednesses.categoryName == 'Right') {
          rightHand = []
        }

        for (let i = 0; i < joints.length; i++) {
          if ([4, 8, 12, 16, 20].includes(i)) {
            let px = joints[i].x;
            let py = joints[i].y;
            px = map(px, 0, 1, width, 0);
            py = map(py, 0, 1, 0, height);
            if (handednesses.categoryName == 'Left') {
              leftHand.push({ x: px, y: py })
            }
            if (handednesses.categoryName == 'Right') {
              rightHand.push({ x: px, y: py })
            }

            circle(px, py, 9);
          }
        }
      }
    }
  }
}
function drawConnectors(landmarks, connectorSet) {
  if (landmarks) {
    let nConnectors = connectorSet.length;
    for (let i = 0; i < nConnectors; i++) {
      let index0 = connectorSet[i].start;
      let index1 = connectorSet[i].end;
      let x0 = map(landmarks[index0].x, 0, 1, width, 0);
      let y0 = map(landmarks[index0].y, 0, 1, 0, height);
      let x1 = map(landmarks[index1].x, 0, 1, width, 0);
      let y1 = map(landmarks[index1].y, 0, 1, 0, height);
      line(x0, y0, x1, y1);
    }
  }
}
class Splash {
  constructor() {
    this.splashBorder = 100;
    this.title = createDiv("Virtual Key-pressed Piano");
    this.title.style("color:deeppink");
    this.title.style("font-family: Arial, Helvetica, sans-serif");
    this.title.position(this.splashBorder + 20, this.splashBorder + 20);

    this.name = createDiv("Louis Shen");
    this.name.position(this.splashBorder + 20, this.splashBorder + 60);

    this.info = createDiv(
      "Due to the current development of VR and AR, such as Apple's latest Vision Pro, I think the future trend is to electronically convert a lot of hardware, so I want to try to make a code that captures hand information through a camera and places a plane in the camera Keyboard, touch the keyboard with your hands to make corresponding sounds. <p> Enjoy, here is the link: https://editor.p5js.org/shenyifan041104/sketches/Y7XAwmIkm! <p> <a href='javascript:void(0)'>view code</a>"
    );

    this.info.position(this.splashBorder + 20, this.splashBorder + 100);
    this.info.size(
      width - this.splashBorder * 2 - 50,
      height - this.splashBorder * 2 - 50
    );
  }

  display() {
    background(255)

    fill(255);
    stroke(255, 0, 0);
    rect(
      this.splashBorder,
      this.splashBorder,
      width - this.splashBorder * 2,
      height - this.splashBorder * 2
    );
    fill(0, 0, 222);
    strokeWeight(3);

    line(
      width - this.splashBorder - 40,
      this.splashBorder + 20,
      width - this.splashBorder - 20,
      this.splashBorder + 40
    );
    line(
      width - this.splashBorder - 20,
      this.splashBorder + 20,
      width - this.splashBorder - 40,
      this.splashBorder + 40
    );
  }

  hide() {
    this.title.remove();
    this.name.remove();
    this.info.remove();
  }
}

function mousePressed() {
  if (dist(mouseX, mouseY, 158, 378) <= 30) {
    preview = false
    splash.hide()
  }
}

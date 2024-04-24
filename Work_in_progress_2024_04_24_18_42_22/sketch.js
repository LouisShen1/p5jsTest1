let splashMessage = "This is a virtual key-pressed piano modol";
let showSplash = true;
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

//highest priority
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
  textSize(32);
  textAlign(LEFT, BASELINE);

  myCapture = createCapture(VIDEO);
  myCapture.size(320, 240);
  myCapture.hide();
//key position
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
function mousePressed() {
  if (showSplash) {
    clear(); 
    showSplash = false; 
  }
}
function draw() {
  background(150);
   if (showSplash) {
    background(220);
    fill(0);
    text(splashMessage, 0, height/2);
  }
  


  push()
  translate(width, 0)
  scale(-1, 1)
  image(myCapture, 0, 0, width, height)
  pop()

  noStroke();

  
  //for achieving the color of pressing 
  //white key color
  for (let i = 0; i < wKeys.length; i++) {
    let wk = wKeys[i];
    let sound = wk.sound
    if (sound.isPlaying()) {
      fill(220);
    } else {
      fill(255);
    }
    rect(wk.x, wk.y, wk.w, wk.h);//the rectangle of the keyboard

    let list = [...leftHand, ...rightHand]
    let isActive = false;
    for (let j = 0; j < list.length; j++) {
      let hand = list[j];
      if (hand.x >= wk.x && hand.x <= wk.x + wk.w &&
        hand.y >= wk.y && hand.y <= wk.y + wk.h) {
       //triggered play
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
//black key color
for (let i = 0; i < bKeys.length; i++) {
  let bk = bKeys[i];
   let sound = bk.sound
   if (sound.isPlaying()) {
     fill(100);
  } else {
    fill(0);
  }
  rect(bk.x, bk.y, bk.w, bk.h);
//triggered play
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
}



//predict hand position
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

//create hand detective points
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

  // Draw just the joints of the hands
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
//line joinging the hand points
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
import React, { Component } from 'react';
import Amplify, { Storage } from 'aws-amplify';
import { message, Button, Icon, Alert } from 'antd';
import awsmobile from './aws-exports';
import Progress from './component/Progress';
//import BadResult from './component/BadResult';
//import GoodResult from './component/GoodResult';

import MedicalForm from './component/MedicalForm';
import './App.css';
Amplify.configure(awsmobile);
Amplify.Logger.LOG_LEVEL = 'INFO';

const APPLICATION_TIMEOUT = 8000; // In milliseconds
const UPLOAD_S3_PREFIX = "uploads";
const DOWNLOAD_S3_PREFIX = "results";

const STATUS = {
  WELCOME: "Welcome page",
  KEEP_IMAGE_USER_DECISION: "Keep image user decision",
  TAKE_SHOT: "Take shot",
  LOADING: "Loading",
  WAITING_FOR_PROCESSING: "Wait image to be processed",
  DISPLAY_GOOD_RESULT: "Display good news",
  DISPLAY_BAD_RESULT: "Display bad news",
  NO_CAMERA_DETECTED: "No camera on device",
  NO_FACE_DETECTED: "No check detected",
  IMAGE_DOWNLOADED: "Result image was downloaded by user",
  BACKEND_TIMEOUT: "Backend was too long to answer",
  FILL_FORM: "User is filling the form"
}


const CAMERA = {
  REAR: "rear cam",
  FRONT: "front cam",
  SINGLE: "there is only one cam"
}

class App extends Component {

  constructor(){
    super();
    this.waittime = 0;
    this.videoRef = React.createRef();
    this.canvasRef = React.createRef();
    this.containerRef = React.createRef();
    this.sendsound = new Audio("/sounds/send.mp3");
    this.deletesound = new Audio("/sounds/trash.mp3");
    this.shotsound = new Audio("/sounds/takeshot.mp3");
    this.processound = new Audio("/sounds/processing.mp3");
    this.processound.addEventListener('ended', function() {
        this.currentTime = 0;
        this.play();
    }, false);

    this.state = {
      stream: null,
      camera: CAMERA.SINGLE,
      fullscreen: false,
      processedImage: null,
      filePrefix: "",
      status: STATUS.WELCOME
    }
  }

  componentDidMount(){
    Storage.configure({ level: 'private' });
  }



  ignoreImage() {
    this.deletesound.play();
    this.returnToCapture();
  }

  returnToCapture() {
    message.warning('Take a clear picture of your check.', 2);
    this.setState(
    {
      stream: this.state.stream,
      camera: this.state.camera,
      fullscreen: this.state.fullscreen,
      processedImage: this.state.processedImage,
      filePrefix: this.state.filePrefix,
      status: STATUS.TAKE_SHOT
    });
  }

  uploadImage(image) {
    var filename = Date.now();
    Storage.put(UPLOAD_S3_PREFIX + '/' + filename + '.png', image, { contentType: 'image/png' })
    .then (result => {
      console.log("upload done");
      this.setState(
      {
        stream: this.state.stream,
        camera: this.state.camera,
        fullscreen: this.state.fullscreen,
        processedImage: this.state.processedImage,
        filePrefix: filename,
        status: this.state.status
      });
      this.waitForImageFromBackend();
    })
    .catch(err => console.error(err));

  }

  sendDataToBackend() {
    this.processound.play();
    this.setState(
    {
      stream: this.state.stream,
      camera: this.state.camera,
      fullscreen: this.state.fullscreen,
      processedImage: this.state.processedImage,
      filePrefix: this.state.processedImage,
      status: STATUS.WAITING_FOR_PROCESSING
    });
    this.canvasRef.current.toBlob(this.uploadImage.bind(this));
  }
  saveImage() {

    this.setState(
    {
      stream: this.state.stream,
      camera: this.state.camera,
      fullscreen: this.state.fullscreen,
      processedImage: this.state.processedImage,
      filePrefix: this.state.processedImage,
      status: STATUS.FILL_FORM
    });
  }

  takeShot() {
    this.shotsound.play()
    var context = this.canvasRef.current.getContext('2d');
    this.canvasRef.current.width = this.videoRef.current.videoWidth;
    this.canvasRef.current.height = this.videoRef.current.videoHeight;
    context.drawImage(this.videoRef.current, 0, 0, this.canvasRef.current.width, this.canvasRef.current.height);
    this.setState(
    {
      stream: this.state.stream,
      camera: this.state.camera,
      fullscreen: this.state.fullscreen,
      processedImage: this.state.processedImage,
      filePrefix: this.state.filePrefix,
      status: STATUS.KEEP_IMAGE_USER_DECISION
    });
  }

  startCapturingWebCam() {
    console.log('Check device camera capabilities');

    navigator.mediaDevices.enumerateDevices()
    .then(deviceInfos => this.gotDevices(deviceInfos))
    .catch(e => alert(`enumerateDevices() error: ${e.name}`));
  }

  gotDevices(deviceInfos) {
    var numberOfCameras = 0;
    for (var i = 0; i !== deviceInfos.length; ++i) {
      var deviceInfo = deviceInfos[i];

      var option = document.createElement('option');
      option.value = deviceInfo.deviceId;

      if (deviceInfo.kind === 'videoinput') {
        numberOfCameras++;
        console.log('Find Camera named ' + deviceInfo.label);
      }
    }

    var cameraStatus = CAMERA.SINGLE;
    var newStatus = this.state.status;
    switch(numberOfCameras) {
      case 0:
        newStatus = STATUS.NO_CAMERA_DETECTED;
        console.error('This device have no camera');
        break;
      case 1:
        cameraStatus = CAMERA.SINGLE;
        break;
      case 2:
        cameraStatus = CAMERA.FRONT;
        break;
      default:
        cameraStatus = CAMERA.FRONT;
        console.warning('Only the first two camera are used');
        break;
    }
    if(newStatus !== STATUS.NO_CAMERA_DETECTED) {
      console.log('Requesting webcam access');
      const constraints = {
        audio: false,
        video: true
      };
      navigator.mediaDevices.getUserMedia(constraints)
      .then(stream => this.displayWebcamOutput(stream))
      .catch(e => alert(`getUserMedia() error: ${e.name}`));
    }

    this.setState(
    {
      stream: this.state.stream,
      camera: cameraStatus,
      fullscreen: this.state.fullscreen,
      processedImage: this.state.processedImage,
      filePrefix: this.state.filePrefix,
      status: newStatus
    });
  }

  displayWebcamOutput(webcamStream) {
    console.log('Put stream on video HTML component');
    this.videoRef.current.srcObject = webcamStream;
    message.warning('Take a clear picture of your check.', 4);
    this.setState(
    {
      stream: webcamStream,
      camera: this.state.camera,
      fullscreen: this.state.fullscreen,
      processedImage: this.state.processedImage,
      filePrefix: this.state.filePrefix,
      status: STATUS.TAKE_SHOT
    });
  }

  canvasStyle() {
    switch (this.state.status) {
      case STATUS.KEEP_IMAGE_USER_DECISION:
      case STATUS.IMAGE_DOWNLOADED:
        return {display: "block"};
      default:
        return {display: "none"};
    }
  }
  videoStyle() {
    switch (this.state.status) {
      case STATUS.TAKE_SHOT:
        return {display: "block"};
      default:
        return {display: "none"};
    }
  }
  displayNewDiag() {
    switch (this.state.status) {
      case STATUS.DISPLAY_BAD_RESULT:
      case STATUS.DISPLAY_GOOD_RESULT:
        return true;
      default:
        return false;
    }
  }
  displayClose() {
    switch (this.state.status) {
      case STATUS.IMAGE_SENT_CONFIRMATION:
      case STATUS.IMAGE_DOWNLOADED:
      case STATUS.BACKEND_TIMEOUT:
        return true;
      default:
        return false;
    }
  }
  displayError() {
    switch (this.state.status) {
      case STATUS.NO_CAMERA_DETECTED:
      case STATUS.BACKEND_TIMEOUT:
        return true;
      default:
        return false;
    }
  }

  openFullscreen() {
    if (this.containerRef.current.requestFullscreen) {
      this.containerRef.current.requestFullscreen();
    } else if (this.containerRef.current.mozRequestFullScreen) { /* Firefox */
      this.containerRef.current.mozRequestFullScreen();
    } else if (this.videoRef.current.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
      this.containerRef.current.webkitRequestFullscreen();
    } else if (this.videoRef.current.msRequestFullscreen) { /* IE/Edge */
      this.containerRef.current.msRequestFullscreen();
    }
    this.setState(
    {
      stream: this.state.stream,
      camera: this.state.camera,
      fullscreen: true,
      processedImage: this.state.processedImage,
      filePrefix: this.state.filePrefix,
      status: this.state.status
    });
  }

  exitFullscreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) { /* Firefox */
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { /* IE/Edge */
      document.msExitFullscreen();
    }

    this.setState(
    {
      stream: this.state.stream,
      camera: this.state.camera,
      fullscreen: false,
      processedImage: this.state.processedImage,
      filePrefix: this.state.filePrefix,
      status: this.state.status
    });
  }

  changeActiveCamera() {
    console.log('Switch camera');
    const constraints = {
      audio: false,
      video: {deviceId: this.state.camera === CAMERA.FRONT ? {exact: 0} : {exact: 1}}
    };
    this.state.stream.close ();
    this.setState(
    {
      stream: null,
      camera: this.state.camera === CAMERA.FRONT ? CAMERA.REAR : CAMERA.FRONT,
      fullscreen: this.state.fullscreen,
      processedImage: this.state.processedImage,
      filePrefix: this.state.filePrefix,
      status: this.state.status
    });
    navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => this.displayWebcamOutput(stream))
    .catch(e => alert(`getUserMedia() error: ${e.name}`));
  }

  rotateImageLeft() {
    console.log('rotate image to the left');
  }
  rotateImageRight() {
    console.log('rotate image to the right');
  }
  sendByEmail() {
    console.log('Send by email');
    this.setState(
    {
      stream: this.state.stream,
      camera: this.state.camera,
      fullscreen: this.state.fullscreen,
      processedImage: this.state.processedImage,
      filePrefix: this.state.filePrefix,
      status: STATUS.IMAGE_SENT_CONFIRMATION
    });
  }
  downloadImage() {
    console.log('Download image');
    this.setState(
    {
      stream: this.state.stream,
      camera: this.state.camera,
      fullscreen: this.state.fullscreen,
      processedImage: this.state.processedImage,
      filePrefix: this.state.filePrefix,
      status: STATUS.IMAGE_DOWNLOADED
    });
    this.saveBase64AsFile(this.state.processedImage, "ReInvent-this.state-" + this.state.filePrefix + ".png");
  }

  saveBase64AsFile(base64, fileName) {
      var link = document.createElement("a");
      link.setAttribute("href", base64);
      link.setAttribute("download", fileName);
      link.click();
  }

  backendTimedOut() {
    console.log("Backend timed out");
    this.processound.pause();
    this.setState(
    {
      stream: this.state.stream,
      camera: this.state.camera,
      fullscreen: this.state.fullscreen,
      processedImage: null,
      filePrefix: "",
      status: STATUS.BACKEND_TIMEOUT
    });
  }

  fetchImage() {
    //Storage.get(UPLOAD_S3_PREFIX + '/' + this.state.filePrefix + '.json', { download: true })
    Storage.get(UPLOAD_S3_PREFIX + '/' + this.state.filePrefix + '.png-UserData.json', { download: true })
    .then (result => {
        this.gotResultFromBackend(JSON.parse(result.Body.toString('utf-8')));
    })
    .catch(err => {
      console.log("Backend haven't finish");
      console.log(err);
      this.waittime += 2000;
      if(this.waittime < APPLICATION_TIMEOUT) {
        console.log("Launch S3 get again, time = " + this.waittime);
        setTimeout(this.fetchImage.bind(this), 2000);
      } else {
        this.backendTimedOut();
      }
    });
  }
  waitForImageFromBackend() {
    console.log('Wait for image');
    this.waittime = 0;
    this.fetchImage();
  }
  gotResultFromBackend(result) {
    console.log('Got A RESULT from backend');
    this.processound.pause();

    var i;
    var gotAFace = false;
    var isSick = false;
    if (typeof result.Labels !== 'undefined' && result.Labels.length > 0) {
      for (i = 0; i < result.Labels.length; i++) {
          console.log('========= ITEM ==========');
          console.log(result.Labels[i]);
          console.log(result.Labels[i].Name);
          console.log(result.Labels[i].Confidence);
              console.log('=========================');
          if((result.Labels[i].Name === "Person") && (result.Labels[i].Confidence >= 95)) {
            gotAFace = true;
            var random = Math.random();
            console.log('random ='+ random);
            isSick = random >= 0.75;
            console.log('isSick ='+ isSick);
            break;
          }
      }
    }

    var nextStatus = STATUS.DISPLAY_GOOD_RESULT;
    if(!gotAFace) {
      nextStatus = STATUS.NO_FACE_DETECTED;
    } else {
      if(isSick) {
        nextStatus = STATUS.DISPLAY_BAD_RESULT;
      }
    }

    console.log('nextStatus ='+ nextStatus);

    this.setState(
    {
      stream: this.state.stream,
      camera: this.state.camera,
      fullscreen: this.state.fullscreen,
      processedImage: result,
      filePrefix: this.state.filePrefix,
      status: nextStatus
    });

    console.log(result);
  }

  render() {
    return (
      <div ref={this.containerRef}>
        <div className="Welcome"><img className="logo" src="aws.png" /> GFS Bank</div>
        <Progress status={this.state.status}/>

        {this.state.status === STATUS.TAKE_SHOT && <Button className="camera" type="primary" onClick={() => this.takeShot()}>Take picture</Button> }
        {this.state.status === STATUS.KEEP_IMAGE_USER_DECISION && <Button className="camera" type="primary" onClick={() => this.saveImage()}>Keep this image</Button> }
        {this.state.status === STATUS.KEEP_IMAGE_USER_DECISION && <Button className="camera" onClick={() => this.ignoreImage()}>Delete image</Button> }

        <div className="video-container">
          <video style={this.videoStyle()} ref={this.videoRef} muted autoPlay playsInline/>
          <canvas style={this.canvasStyle()} ref={this.canvasRef} />
        </div>

        {this.displayError() && <i className="material-icons deco">mood_bad</i> }
        {this.state.status === STATUS.NO_CAMERA_DETECTED && <h1>Oh no, it looks that you have no camera</h1> }
        {this.state.status === STATUS.BACKEND_TIMEOUT && <h1>Oh no, backend times out</h1> }

        {this.displayClose() && <button className="btn btn-pos-3l" onClick={() => this.returnToCapture()}><i className="material-icons">close</i></button> }

        {this.state.status === STATUS.FILL_FORM && <MedicalForm callback={() => this.sendDataToBackend()} /> }
        

        {this.state.status === STATUS.NO_FACE_DETECTED && <i className="material-icons deco_sad">mood_bad</i> }
        {this.state.status === STATUS.NO_FACE_DETECTED && <Alert className="marginleft" message="Image Failure" description="We were not able to detect your check. Please take a picture closer from the camera." type="error" showIcon /> }

        {this.state.status === STATUS.NO_FACE_DETECTED && <Button className="marginleft" type="primary" onClick={() => this.returnToCapture()}>Retry</Button> }
        {this.displayNewDiag() && <Button className="marginleft" type="primary" onClick={() => this.returnToCapture()}> Start New Deposit</Button> }

        {this.state.status === STATUS.WAITING_FOR_PROCESSING && <i className="material-icons deco rotate">hourglass_empty</i> }


        {this.state.status === STATUS.WELCOME && <Button type="primary" onClick={() => this.startCapturingWebCam()}>Start my quick Deposit</Button> }

      </div>
    );
  }
}

export default App;

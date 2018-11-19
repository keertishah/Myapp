import React, { Component } from 'react';
import { Steps, Icon } from 'antd';

const Step = Steps.Step;

const STATUS = {
  WELCOME: "Welcome page",
  KEEP_IMAGE_USER_DECISION: "Keep image user decision",
  TAKE_SHOT: "Take shot",
  LOADING: "Loading",
  WAITING_FOR_PROCESSING: "Wait image to be processed",
  DISPLAY_GOOD_RESULT: "Display good news",
  DISPLAY_BAD_RESULT: "Display bad news",
  NO_CAMERA_DETECTED: "No camera on device",
  IMAGE_DOWNLOADED: "Result image was downloaded by user",
  BACKEND_TIMEOUT: "Backend was too long to answer",
  FILL_FORM: "User is filling the form"
}

class Progress extends Component {

// process, finish

  getPhotoStatus() {
    switch (this.props.status) {
      case STATUS.WELCOME:
        return "wait";
      default:
        return "finish";
    }
  }
  getStyle() {
    switch (this.props.status) {
      case STATUS.WELCOME:
        return {display: "flex"};
      default:
        return {"display": "inline-flex", "marginRight": "20px"};
    }
  }
  getFormStatus() {
    switch (this.props.status) {
      case STATUS.WELCOME:
      case STATUS.TAKE_SHOT:
      case STATUS.KEEP_IMAGE_USER_DECISION:
        return "wait";
      default:
        return "finnish";
    }
  }
  getResultStatus() {
    switch (this.props.status) {
      case STATUS.WELCOME:
      case STATUS.TAKE_SHOT:
      case STATUS.KEEP_IMAGE_USER_DECISION:
      case STATUS.FILL_FORM:
        return "wait";
      case STATUS.WAITING_FOR_PROCESSING:
        return "process";
      default:
        return "finnish";
    }
  }

  welcomePageSteps() {
    return (
    <Steps>
      <Step status="finish" title="Deposit Checks" icon={<Icon type="smile" />} description="With our new Take Picture feature deposit check from convinence of your home" />
      <Step status={ this.getPhotoStatus() } title="Front picture" icon={<Icon type="camera" />} description="Take a picture of front of the check" />
      <Step status={ this.getFormStatus() } title="Provide check information" icon={<Icon type="form" />} description="A small check questionnaire" />
      <Step status={ this.getResultStatus() } title="Submit the deposit" icon={<Icon type="file-done" />} description="Get your check deposited in seconds" />
    </Steps>
    );
  }

  otherPagesSteps() {
    return (
    <Steps style={{"marginLeft": "25px"}}>
      <Step style={this.getStyle()} status="finish" icon={<Icon type="smile" />} />
      <Step style={this.getStyle()} status={ this.getPhotoStatus() } icon={<Icon type="camera" />} />
      <Step style={this.getStyle()} status={ this.getFormStatus() } icon={<Icon type="form" />} />
      <Step style={this.getStyle()} status={ this.getResultStatus() } icon={<Icon type="file-done" />} />
    </Steps>
    );
  }

  render() {
    if(this.props.status === STATUS.WELCOME) {
      return this.welcomePageSteps();
    } else {
      return this.otherPagesSteps();
    }
  }

}

export default Progress;

import React, { Component } from 'react';
import { Button, Slider, Form, Icon, Input, Radio, Select, DatePicker, Rate } from 'antd';
import TextArea from 'antd/lib/input/TextArea';

const FormItem = Form.Item;
const Option = Select.Option;
const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;

const condition = {
  0: {
    style: {
      color: '#f50',
    },
    label: <strong>Very Bad</strong>,
  },
  1: '',
  2: '',
  3: '',
  4: '',
  5: '',
  6: {
    style: {
      color: '#050',
    },
    label: <strong>Very Good</strong>,
  },
};

class MedicalForm extends Component {

  render() {
    //const { getFieldDecorator } = this.props.form;
    const formItemLayout = {
      labelCol: { span: 8 },
      wrapperCol: { span: 12 },
    };
    return (
      <Form>
        <FormItem
          {...formItemLayout}
          label="Pay to the order of?"
        >
          <TextArea />
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Check Amount™"
        >
          <TextArea />
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Date Check was Issued™"
        >
          <DatePicker />
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Rate the service"
        >
        <span className="bad">Bad</span> <Rate /> <span className="good">Good</span>
        </FormItem>
        <FormItem
          {...formItemLayout}
        >
          <Button onClick={() => this.props.callback()} type="primary">Submit form</Button>
        </FormItem>
      </Form>
    );
  }

}

export default MedicalForm;

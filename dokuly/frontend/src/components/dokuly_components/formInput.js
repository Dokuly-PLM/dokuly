import React, { Component, useEffect, useState } from "react";
import { Col, Row } from "react-bootstrap";

const FormInput = ({
  input = "",
  onChange = () => {},
  includeColSpacing = false,
  labelTitle = "Label",
  type = "text",
  rowClassName = "",
  feedback = () => "",
  buttonClassName = () => "form-control",
}) => {
  return (
    <Row className={rowClassName}>
      {includeColSpacing && <Col />}
      <Col>
        <label>{labelTitle}</label>
        <input
          className={buttonClassName()}
          name={labelTitle.toString().toLowerCase().replace(" ", "")}
          type={type}
          value={input}
          onChange={(e) => {
            onChange(e);
          }}
        />
        <div className="invalid-feedback">{feedback()}</div>
      </Col>
      {includeColSpacing && <Col />}
    </Row>
  );
};

export default FormInput;

import React, { useState, createRef, useEffect } from "react";
import { Col, Row } from "react-bootstrap";

const TOTPInput = ({ totpCodes, setTOTPCodes, getErrorStatus }) => {
  const refs = Array(6)
    .fill()
    .map(() => createRef());

  const handleChange = (e, index) => {
    const code = e.target.value;
    if (!isNaN(code) && code.length === 1) {
      setTOTPCodes((prevTOTP) => {
        const updatedTOTP = [...prevTOTP];
        updatedTOTP[index] = code;
        return updatedTOTP;
      });
      if (index !== 5) {
        refs[index + 1].current.focus();
      }
    } else if (code === "") {
      setTOTPCodes((prevTOTP) => {
        const updatedTOTP = [...prevTOTP];
        if (updatedTOTP[index] !== "") {
          updatedTOTP[index] = "";
          return updatedTOTP;
        }
        return prevTOTP;
      });
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && totpCodes[index] === "") {
      setTOTPCodes((prevTOTP) => {
        const updatedTOTP = [...prevTOTP];
        if (index !== 0 && updatedTOTP[index - 1] !== "") {
          updatedTOTP[index - 1] = "";
          return updatedTOTP;
        }
        return prevTOTP;
      });
      if (index !== 0) {
        refs[index - 1].current.focus();
      }
    }
  };

  useEffect(() => {
    refs[0].current.focus();
  }, []);

  useEffect(() => {
    // Check if totpCodes is an array of 6 empty strings
    if (totpCodes.length === 6 && totpCodes.every((code) => code === "")) {
      refs[0].current.focus();
    }
  }, [totpCodes]); // Re-run effect when totpCodes changes

  return (
    <Row className="mt-2">
      {totpCodes.map((code, index) => {
        return (
          <Col className="col-2 col-sm-2 col-md-2 col-lg-2 col-xl-2">
            <input
              className="form-control"
              style={{
                width: "3.5rem",
                maxWidth: "3.5rem",
                fontSize: "30px",
                maxHeight: "5.5rem",
                height: "5.5rem",
                marginRight: "-1rem",
              }}
              // biome-ignore lint/suspicious/noArrayIndexKey: No other data here, have to use index
              key={index}
              ref={refs[index]}
              type="text"
              value={code}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              maxLength="1"
            />
          </Col>
        );
      })}
      <div className="invalid-feedback">{getErrorStatus()}</div>
    </Row>
  );
};

export default TOTPInput;

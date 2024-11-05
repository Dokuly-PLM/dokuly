import React from "react";
import { Row, Col } from "react-bootstrap";
import { animated } from "react-spring";
import CopyToClipButton from "../../../dokuly_components/copyToClipButton";
import { loadingSpinner } from "../../functions/helperFunctions";

const ComponentVaultKey = ({
  loading,
  dataKey,
  title,
  onEmpty,
  springStyle,
}) => {
  return (
    <animated.div
      style={springStyle}
      className={dataKey && "card-body card rounded bg-white p-2 mt-2 w-75"}
    >
      {!loading ? (
        <Row className="align-items-center p-2">
          {dataKey && (
            <React.Fragment>
              <Col className="d-flex align-items-center justify-content-start">
                <h6 style={{ marginTop: "0.5rem" }}>
                  <b>{title}</b>
                </h6>
              </Col>
              <Col>
                <Row className="align-items-center justify-content-center">
                  <CopyToClipButton
                    text={dataKey}
                    className="btn btn-sm btn-bg-transparent ml-2 mr-2"
                  />
                  {dataKey}
                </Row>
              </Col>
            </React.Fragment>
          )}
        </Row>
      ) : (
        loadingSpinner()
      )}
      {!dataKey && !loading && onEmpty}
    </animated.div>
  );
};

export default ComponentVaultKey;

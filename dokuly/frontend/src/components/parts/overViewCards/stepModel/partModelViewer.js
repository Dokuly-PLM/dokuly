import React, { useState, useEffect, useRef } from "react";

import { fetchFileList, updateThumbnail } from "../../functions/queries";
import StepViewer from "./stepViewer";
import { Col, Row, Button, Modal } from "react-bootstrap";
import { dataURLtoFile } from "../../functions/dataURLtoFile";
import { uploadImage } from "../../../admin/functions/queries";
import { get_files } from "../../../files/functions/queries";

const PartModelViewer = (props) => {
  const [modelExists, setModelExists] = useState(false);
  const [modelIsLoading, setModelIsLoading] = useState(true);
  const [stepFileUrl, setStepFileUrl] = useState("");
  const [showModal, setShowModal] = useState(false);
  const stepViewerRef = useRef(null);

  const handleClose = () => setShowModal(false);
  const handleShow = () => setShowModal(true);

  useEffect(() => {
    // Fetch the file list from the backend
    // Replace this with the actual API call in your application

    if (props?.file_id_list !== undefined && props?.file_id_list !== null) {
      get_files({ file_ids: props?.file_id_list })
        .then((res) => {
          const stepFile = res.data.find(
            (file) =>
              (file.file_name.toLowerCase().endsWith(".stp") ||
                file.file_name.toLowerCase().endsWith(".step")) &&
              file.archived === 0,
          );
          if (stepFile) {
            // Check if stepFile is found
            setStepFileUrl(
              `${stepFile.uri}`, // Corrected the property name to 'uri'
            );
            setModelExists(true);
            setModelIsLoading(false);
          } else {
            setModelExists(false); // Set to false if no matching file is found
            setModelIsLoading(false);
          }
        })
        .catch((error) => {
          toast.error("Error fetching files:", error);
          setModelExists(false); // Set to false if no matching file is found
          setModelIsLoading(false);
        });
    }
  }, [props.file_id_list]);

  // TODO: Working thumbnail upload but capturing the image is not working
 
  const handleResetCamera = () => {
    stepViewerRef.current.resetCamera();
  };
  return (
    <React.Fragment>
      {modelExists && !modelIsLoading ? (
        <div className="card m-3 rounded" style={{ maxWidth: "60rem" }}>
          <div
            className="card-body justify-content-center align-items-center"
            style={{ minHeight: "200px" }}
          >
            <h5 className="w-100 text-center">
              <b>Part Model</b>
            </h5>
            <Row className="justify-content-center ">
              <Col className="d-flex justify-content-center">
                <div
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    overflow: "auto",
                  }}
                >
                  <Button variant="dokuly-bg-transparent" onClick={handleShow}>
                    <img
                      src="../../../static/icons/zoom-in.svg"
                      alt="zoom in"
                    />{" "}
                    Enlarge
                  </Button>
                  <Button
                    variant="dokuly-bg-transparent"
                    onClick={handleResetCamera}
                  >
                    <img src="../../../static/icons/home.svg" alt="zoom in" />{" "}
                    Reset view
                  </Button>
                </div>
              </Col>
            </Row>

            <Row className="justify-content-center ">
              <Col className="d-flex justify-content-center">
                <div
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    overflow: "auto",
                  }}
                >
                  <StepViewer
                    ref={stepViewerRef}
                    stepFileUrl={stepFileUrl}
                    windowWidth={400}
                    windowHeight={400}
                  />
                </div>
              </Col>
            </Row>
          </div>

          <Modal show={showModal} onHide={handleClose} size="xl">
            <Modal.Header>
              <Modal.Title>Part model viewer</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Row className="justify-content-center ">
                <Col className="d-flex justify-content-center">
                  <div
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      overflow: "auto",
                    }}
                  >
                    <StepViewer
                      ref={stepViewerRef}
                      stepFileUrl={stepFileUrl}
                      windowWidth={800}
                      windowHeight={800}
                    />
                  </div>
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleClose}>
                Close
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      ) : (
        <div>
          {modelIsLoading && (
            <div className="card m-3 rounded" style={{ maxWidth: "60rem" }}>
              <div
                className="card-body justify-content-center align-items-center"
                style={{ minHeight: "200px" }}
              >
                <h5 className="w-100 text-center">
                  <b>Part Model</b>
                </h5>
                <Row className="justify-content-center ">
                  <Col className="d-flex justify-content-center">
                    <div
                      style={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                        overflow: "auto",
                      }}
                    >
                      <Button
                        variant="dokuly-bg-transparent"
                        onClick={handleShow}
                      >
                        {" "}
                      </Button>
                    </div>
                  </Col>
                </Row>

                <Row className="justify-content-center ">
                  <Col className="d-flex justify-content-center">
                    <div
                      style={{
                        width: "400px",
                        height: "400px",
                        overflow: "auto",
                      }}
                    ></div>
                  </Col>
                </Row>
              </div>
            </div>
          )}
        </div>
      )}
    </React.Fragment>
  );
};

export default PartModelViewer;

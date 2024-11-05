import React, { useState, useEffect, useRef } from "react";
import CodeViewer from "./codeViewer/codeViewer";
import GCodeViewerComponent from "./codeViewer/gCodeViewer";
import StepViewer from "../parts/overViewCards/stepModel/stepViewer";
import fileTypes from "./codeViewer/fileTypes";
import { getFile } from "./filesTable/functions/queries";
import DokulyModal from "../dokuly_components/dokulyModal";
import { Modal } from "react-bootstrap";

export default function FileViewerModal({
  isOpen,
  fileUri,
  fileName,
  displayName,
  handleClose,
}) {
  const [fileContent, setFileContent] = useState(null);
  const [error, setError] = useState("");
  const [isGCodeView, setIsGCodeView] = useState(true);
  const stepViewerRef = useRef(null);

  useEffect(() => {
    if (fileUri) {
      getFile(fileUri)
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          setFileContent(url);
        })
        .catch((error) => {
          console.error("Error fetching file:", error);
          setError("Failed to load the file due to network error.");
        });
    }
  }, [fileUri]);

  if (!fileUri) return null;

  const extension = fileName?.split(".").pop().toLowerCase();
  let content;

  if (error) {
    content = <p>{error}</p>;
  } else if (
    extension === "pdf" ||
    extension === "svg" ||
    extension === "jpg" ||
    extension === "png" ||
    extension === "gif"
  ) {
    // Update JSX specifically for PDF extension
    return (
      <DokulyModal
        show={isOpen}
        onHide={handleClose}
        title="PDF Viewer"
        size="full-screen"
      >
        <iframe
          id="iframepdf-fullscreen"
          src={`${fileContent}#zoom=150`} // Set the zoom level to 150%
          width="100%"
          height="100%"
          title="pdf-fullscreen"
          style={{ border: "none" }}
        />
      </DokulyModal>
    );
  } else if (
    extension === "jpg" ||
    extension === "png" ||
    extension === "gif" ||
    extension === "svg"
  ) {
    content = (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      >
        <img
          src={fileContent}
          alt="File Content"
          style={{ maxWidth: "100%", maxHeight: "100%" }}
        />
      </div>
    );
  } // Include other file handlers like GCode, CodeViewer, StepViewer if needed  in the future

  // Fallback for other modal types
  return (
    <Modal
      size="xl"
      show={isOpen}
      onHide={handleClose}
      contentClassName="modal-content-centered"
    >
      <Modal.Header>
        <Modal.Title>{displayName || fileName}</Modal.Title>
        <button
          type="button"
          className="close"
          data-dismiss="modal"
          aria-label="Close"
          onClick={() => handleClose()}
        >
          <span aria-hidden="true">&times;</span>
        </button>
      </Modal.Header>
      <Modal.Body>{content}</Modal.Body>
    </Modal>
  );
}

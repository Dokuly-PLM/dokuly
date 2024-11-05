import React, { useState } from "react";
import { Modal, Button, Image, Row, Col } from "react-bootstrap";
import { formatCloudImageUri } from "../pcbas/functions/productionHelpers";
import { uploadThumbnail, deleteThumbnail } from "../admin/functions/queries";
import SubmitButton from "./submitButton";
import FileUpload from "./fileUpload/fileUpload";
import DeleteButton from "./deleteButton";
import DokulyImage from "./dokulyImage";
import { set } from "react-ga";

const ThumbnailDisplay = ({
  item_id,
  app = "",
  releaseState,
  thumbnailId,
  setRefresh,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showImagePreviewModal, setShowImagePreviewModal] = useState(false); // State to control large modal visibility
  const [file, setFile] = useState(null);
  const [displayName, setDisplayName] = useState("");

  if (releaseState === "Released" && !thumbnailId) return "";
  if (
    app !== "assemblies" &&
    app !== "pcbas" &&
    app !== "parts" &&
    app !== "procurement"
  )
    return "";

  const handleModalShow = () => {
    if (releaseState === "Released") {
      setShowImagePreviewModal(true); // Show large image modal if released
    } else {
      setShowModal(true); // Show editing modal otherwise
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setShowImagePreviewModal(false); // Ensure large modal also closes
    setFile(null);
    setDisplayName("");
  };

  const imageUrl = thumbnailId ? formatCloudImageUri(thumbnailId) : null;

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
    const split = selectedFile.name.split(".");
    const newName = split[0];
    setDisplayName(newName);
  };

  const onSubmit = () => {
    if (!file) return;
    if (releaseState === "Released") return;
    if (app === "") return;

    const data = new FormData();
    data.append("file", file);
    data.append("display_name", displayName);
    data.append("app", app);
    data.append("item_id", item_id);

    setShowModal(false);
    uploadThumbnail(data).then((res) => {
      if (res.status === 201) {
        setFile(null);
        setDisplayName("");
        setRefresh(true);
      }
    });
  };

  const handleDeleteThumbnail = () => {
    if (!confirm("Are you sure you want to delete this thumbnail?")) {
      return;
    }
    deleteThumbnail(app, item_id).then((res) => {
      if (res.status === 200) {
        setRefresh(true);
        setShowModal(false);
      }
    });
  };

  return (
    <div style={{ cursor: "pointer" }}>
      {imageUrl ? (
        <DokulyImage
          className="rounded"
          style={{
            maxWidth: "100px",
            maxHeight: "100px",
            objectFit: "contain", // Ensures the image scales to fit and maintain aspect ratio without stretching
            display: "block", // Ensures the image is treated as a block element, which can help with alignment
            margin: "auto", // Centers the image within its container
          }}
          src={imageUrl}
          onClick={handleModalShow}
        />
      ) : (
        // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
        <div
          className="thumbnail-placeholder"
          onClick={handleModalShow}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100px",
            height: "100px",
            border: "1px dashed #ccc",
            borderRadius: "4px",
            margin: "0 auto",
            color: "#ccc",
            fontSize: "14px",
            textAlign: "center",
            cursor: "pointer",
          }}
        >
          <div>Upload thumbnail</div>
        </div>
      )}
      {/* Edit thumbnail modal */}
      <Modal show={showModal} onHide={handleModalClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Thumbnail</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            {imageUrl && (
              <Col xs={12} md={4} className="text-center">
                <h5>Current Thumbnail</h5>
                <DokulyImage src={imageUrl} />
                <div className="d-flex justify-content-center">
                  <DeleteButton onDelete={handleDeleteThumbnail} />
                </div>
              </Col>
            )}
            <Col xs={12} md={imageUrl ? 8 : 12}>
              <h5>Upload Thumbnail</h5>
              <div className="form-group">
                <label>Display name</label>
                <input
                  className="form-control"
                  type="text"
                  name="name"
                  onChange={(e) => setDisplayName(e.target.value)}
                  value={displayName}
                />
              </div>
              <div className="form-group">
                <label>Upload file</label>
                <FileUpload
                  instructionText={
                    "Drag a file here, paste an image, or click to select a file"
                  }
                  onFileSelect={handleFileSelect}
                  file={file}
                  setFile={setFile}
                />
              </div>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleModalClose}>
            Close
          </Button>
          <SubmitButton onClick={onSubmit} disabled={!file || !displayName}>
            Submit
          </SubmitButton>
        </Modal.Footer>
      </Modal>
      {/* View Preview image modal */}
      <Modal
        contentClassName="transparent-modal-content" // new class for content
        dialogClassName="transparent-dialog" // new class for dialog
        backdropClassName="transparent-backdrop" // new class for backdrop
        show={showImagePreviewModal}
        onHide={handleModalClose}
        size="xl"
        centered
      >
        <Modal.Body className="p-0">
          <DokulyImage
            src={imageUrl}
            style={{
              maxHeight: "90vh",
              display: "block",
              margin: "auto",
              borderRadius: "4px",
              border: "1px solid #ccc", // Added a light grey border
              boxShadow: "0 4px 8px rgba(0,0,0,0.3)", // Added a subtle shadow
              cursor: "pointer", // Changes the cursor to indicate the image can be clicked
            }}
            onClick={handleModalClose}
          />
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ThumbnailDisplay;

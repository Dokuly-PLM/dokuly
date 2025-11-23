import React, { useState, useEffect, useRef } from "react";
import CodeViewer from "./codeViewer/codeViewer";
import GCodeViewerComponent from "./codeViewer/gCodeViewer";
import StepViewer from "../parts/overViewCards/stepModel/stepViewer";
import fileTypes from "./codeViewer/fileTypes";
import { getFile } from "./filesTable/functions/queries";
import DokulyModal from "../dokuly_components/dokulyModal";
import { Modal } from "react-bootstrap";
import SubmitButton from "../dokuly_components/submitButton";
import RevisionSelector from "./FileViewerModal/RevisionSelector";
import FileSelector from "./FileViewerModal/FileSelector";
import TextDiffViewer from "./FileViewerModal/TextDiffViewer";
import PdfComparisonViewer from "./FileViewerModal/PdfComparisonViewer";
import ImageComparisonViewer from "./FileViewerModal/ImageComparisonViewer";
import GenericComparisonViewer from "./FileViewerModal/GenericComparisonViewer";

// Normalize entity type to plural lowercase API endpoint format
const normalizeEntityTypeForAPI = (type) => {
  if (!type) return type;
  const lower = type.toLowerCase();
  // Map singular/capitalized forms to plural API endpoints
  const mapping = {
    "part": "parts",
    "parts": "parts",
    "pcba": "pcbas",
    "pcbas": "pcbas",
    "assembly": "assemblies",
    "assemblies": "assemblies",
    "document": "documents",
    "documents": "documents",
  };
  return mapping[lower] || lower;
};

export default function FileViewerModal({
  isOpen,
  fileUri,
  fileName,
  displayName,
  handleClose,
  parentEntityType,
  parentEntityId,
  currentFileId,
}) {
  const [fileContent, setFileContent] = useState(null);
  const [error, setError] = useState("");
  const [isGCodeView, setIsGCodeView] = useState(true);
  const stepViewerRef = useRef(null);

  // Comparison state
  const [isComparing, setIsComparing] = useState(false);
  const [selectedRevision, setSelectedRevision] = useState(null);
  const [selectedComparisonFile, setSelectedComparisonFile] = useState(null);
  const [comparisonFileContent, setComparisonFileContent] = useState(null);
  const [comparisonFileUri, setComparisonFileUri] = useState(null);
  const [comparisonError, setComparisonError] = useState("");

  // Cleanup blob URLs on unmount or when file changes
  useEffect(() => {
    return () => {
      if (fileContent && fileContent.startsWith("blob:")) {
        URL.revokeObjectURL(fileContent);
      }
      if (comparisonFileContent && comparisonFileContent.startsWith("blob:")) {
        URL.revokeObjectURL(comparisonFileContent);
      }
    };
  }, [fileContent, comparisonFileContent]);

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

  // Reset comparison state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsComparing(false);
      setSelectedRevision(null);
      setSelectedComparisonFile(null);
      setComparisonFileContent(null);
      setComparisonFileUri(null);
      setComparisonError("");
    }
  }, [isOpen]);

  // Fetch comparison file when selected
  useEffect(() => {
    if (selectedComparisonFile && isComparing) {
      const fileId = selectedComparisonFile.file_id || selectedComparisonFile.id;
      
      // Check if file_id is valid (not -1 or undefined)
      if (!fileId || fileId === -1) {
        setComparisonError("This file is a placeholder and has no actual file content to compare.");
        setComparisonFileContent(null);
        return;
      }
      
      const comparisonFileUriValue = selectedComparisonFile.view_uri || selectedComparisonFile.uri || `api/files/view/${fileId}/`;
      setComparisonFileUri(comparisonFileUriValue);
      setComparisonError("");
      getFile(comparisonFileUriValue)
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          setComparisonFileContent(url);
        })
        .catch((error) => {
          console.error("Error fetching comparison file:", error);
          setComparisonError(`Failed to load the comparison file. ${error?.response?.status === 404 ? "File not found." : ""}`);
        });
    }
  }, [selectedComparisonFile, isComparing]);

  if (!fileUri) return null;

  // Extract filename from path if fileName is a full path
  const getFileNameFromPath = (path) => {
    if (!path) return "";
    const parts = path.split(/[/\\]/);
    return parts[parts.length - 1];
  };
  
  const fileNameOnly = getFileNameFromPath(fileName);
  const extension = fileNameOnly?.split(".").pop().toLowerCase() || fileName?.split(".").pop().toLowerCase();
  const isTextFile = [
    "js", "ts", "jsx", "tsx", "py", "java", "cpp", "c", "cs", "php", "rb",
    "go", "rs", "swift", "kt", "scala", "sh", "bash", "sql", "html", "css",
    "scss", "less", "json", "xml", "yaml", "yml", "md", "txt", "log", "csv"
  ].includes(extension);
  const isPdfFile = extension === "pdf";
  const isImageFile = ["jpg", "jpeg", "png", "gif", "svg"].includes(extension);

  // Determine if comparison is enabled (need parent entity info)
  const canCompare = parentEntityType && parentEntityId && (
    isTextFile || isPdfFile || isImageFile || 
    extension === "step" || extension === "stp" || 
    extension === "gcode" || extension === "nc"
  );

  const handleCompareToggle = () => {
    setIsComparing(!isComparing);
    if (isComparing) {
      // Reset comparison state
      setSelectedRevision(null);
      setSelectedComparisonFile(null);
      setComparisonFileContent(null);
    }
  };

  const handleRevisionSelect = (revision) => {
    setSelectedRevision(revision);
    setSelectedComparisonFile(null);
    setComparisonFileContent(null);
  };

  const handleFileSelect = (file) => {
    setSelectedComparisonFile(file);
  };

  const renderComparisonView = () => {
    if (!comparisonFileContent || comparisonError) {
      return <div className="text-danger">{comparisonError || "Please select a file to compare."}</div>;
    }

    if (isTextFile) {
      return (
        <TextDiffViewer
          originalFileUri={fileUri}
          originalBlobUrl={fileContent}
          comparisonFileUri={comparisonFileUri}
          comparisonBlobUrl={comparisonFileContent}
          extension={extension}
        />
      );
    } else if (isPdfFile) {
      return (
        <PdfComparisonViewer
          originalFileUri={fileUri}
          originalBlobUrl={fileContent}
          comparisonFileUri={comparisonFileContent}
        />
      );
    } else if (isImageFile) {
      return (
        <ImageComparisonViewer
          originalFileUri={fileContent}
          comparisonFileUri={comparisonFileContent}
        />
      );
    } else {
      return (
        <GenericComparisonViewer
          originalFileUri={fileContent}
          comparisonFileUri={comparisonFileContent}
          originalFileName={fileName}
          comparisonFileName={selectedComparisonFile?.file_name || selectedComparisonFile?.display_name}
        />
      );
    }
  };

  const renderComparisonControls = () => {
    if (!canCompare) return null;

    return (
      <div className="comparison-controls p-3 border-bottom">
        <div className="d-flex align-items-center gap-2 mb-3">
          <SubmitButton
            onClick={handleCompareToggle}
            type="button"
          >
            {isComparing ? "Exit Comparison" : "Compare with Revision"}
          </SubmitButton>
        </div>
        {isComparing && (
          <div className="comparison-selection">
            {!selectedRevision ? (
              <RevisionSelector
                parentEntityType={parentEntityType}
                parentEntityId={parentEntityId}
                currentEntityId={parentEntityId}
                onRevisionSelect={handleRevisionSelect}
              />
            ) : !selectedComparisonFile ? (
              <div>
                <div className="mb-2">
                  <small className="text-muted">
                    Selected revision: {selectedRevision.formatted_revision || selectedRevision.revision}
                  </small>
                </div>
                <FileSelector
                  app={normalizeEntityTypeForAPI(parentEntityType)}
                  revisionEntityId={selectedRevision.id}
                  currentFileName={fileName}
                  currentDisplayName={displayName}
                  currentFileExtension={extension}
                  onFileSelect={handleFileSelect}
                />
              </div>
            ) : (
              <div className="mb-2">
                <small className="text-muted">
                  Comparing: {displayName || getFileNameFromPath(fileName)} vs {selectedComparisonFile.display_name || getFileNameFromPath(selectedComparisonFile.file_name || "")}
                </small>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  let content;

  if (error) {
    content = <p>{error}</p>;
  } else if (extension === "step" || extension === "stp") {
    // Handle STEP files with the StepViewer component
    return (
      <DokulyModal
        show={isOpen}
        onHide={handleClose}
        title="STEP File Viewer"
        size="full-screen"
      >
        {renderComparisonControls()}
        {isComparing && selectedComparisonFile && comparisonFileContent ? (
          <GenericComparisonViewer
            originalFileUri={fileContent}
            comparisonFileUri={comparisonFileContent}
            originalFileName={fileName}
            comparisonFileName={selectedComparisonFile?.file_name || selectedComparisonFile?.display_name}
          />
        ) : (
          <StepViewer
            ref={stepViewerRef}
            stepFileUrl={fileContent}
            windowWidth={window.innerWidth * 0.9}
            windowHeight={window.innerHeight * 0.8}
          />
        )}
      </DokulyModal>
    );
  } else if (extension === "gcode" || extension === "nc") {
    // Handle G-code files with the GCodeViewerComponent
    return (
      <DokulyModal
        show={isOpen}
        onHide={handleClose}
        title="G-Code Viewer"
        size="full-screen"
      >
        {renderComparisonControls()}
        {isComparing && selectedComparisonFile && comparisonFileContent ? (
          <GenericComparisonViewer
            originalFileUri={fileContent}
            comparisonFileUri={comparisonFileContent}
            originalFileName={fileName}
            comparisonFileName={selectedComparisonFile?.file_name || selectedComparisonFile?.display_name}
          />
        ) : (
          <GCodeViewerComponent fileUri={fileContent} />
        )}
      </DokulyModal>
    );
  } else if (isTextFile) {
    // Handle code files with the CodeViewer component or TextDiffViewer
    if (isComparing && selectedComparisonFile && comparisonFileContent) {
      return (
        <DokulyModal
          show={isOpen}
          onHide={handleClose}
          title="Text Comparison"
          size="full-screen"
        >
          <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", minHeight: "600px" }}>
            {renderComparisonControls()}
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              {renderComparisonView()}
            </div>
          </div>
        </DokulyModal>
      );
    } else {
      content = <CodeViewer extension={extension} fileUri={fileContent} />;
    }
  } else if (isPdfFile) {
    // Handle PDF files
    if (isComparing && selectedComparisonFile && comparisonFileContent) {
      return (
        <DokulyModal
          show={isOpen}
          onHide={handleClose}
          title="PDF Comparison"
          size="full-screen"
        >
          <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", minHeight: "600px" }}>
            {renderComparisonControls()}
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              {renderComparisonView()}
            </div>
          </div>
        </DokulyModal>
      );
    } else {
      return (
        <DokulyModal
          show={isOpen}
          onHide={handleClose}
          title="PDF Viewer"
          size="full-screen"
        >
          {renderComparisonControls()}
          <div style={{ 
            width: "100%", 
            height: "calc(100vh - 120px)", 
            overflow: "hidden",
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}>
            <iframe
              id="iframepdf-fullscreen"
              src={`${fileContent}#view=fitv`}
              width="100%"
              height="100%"
              title="pdf-fullscreen"
              style={{ border: "none" }}
            />
          </div>
        </DokulyModal>
      );
    }
  } else if (isImageFile) {
    // Handle image files
    if (isComparing && selectedComparisonFile && comparisonFileContent) {
      return (
        <DokulyModal
          show={isOpen}
          onHide={handleClose}
          title="Image Comparison"
          size="full-screen"
        >
          {renderComparisonControls()}
          {renderComparisonView()}
        </DokulyModal>
      );
    } else {
      content = (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "80vh",
            width: "100%",
          }}
        >
          <img
            src={fileContent}
            alt="File Content"
            style={{ 
              maxWidth: "100%", 
              maxHeight: "100%",
              objectFit: "contain",
              width: "auto",
              height: "auto"
            }}
          />
        </div>
      );
    }
  }

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
        {renderComparisonControls()}
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

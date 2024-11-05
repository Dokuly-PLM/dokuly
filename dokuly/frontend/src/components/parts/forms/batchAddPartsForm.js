import React, { useState } from "react";
import FileUpload from "../../dokuly_components/fileUpload/fileUpload";
import SubmitButton from "../../dokuly_components/submitButton";
import { Row } from "react-bootstrap";
import { unzip } from "unzipit";
import { event } from "react-ga";

const BatchAddPartsForm = (props) => {
  const [zipFile, setZipFile] = useState(null);

  const onFileSelect = (file) => {
    if (file?.name.endsWith(".zip")) {
      setZipFile(file);
    } else {
      alert("Only .zip files are allowed.");
    }
  };

  const onSubmit = async () => {
    if (!zipFile) {
      alert("Please select a file first.");
      return;
    }

    const parts = [];
    const documents = [];
    const partBatches = [];
    const documentBatches = [];
    let currentPartBatch = { size: 0, parts: [] };
    let currentDocumentBatch = { size: 0, documents: [] };

    try {
      const { entries } = await unzip(zipFile);
      for (const [name, entry] of Object.entries(entries)) {
        const pathParts = name.split("/");
        if (
          entry.isDirectory &&
          pathParts.length === 3 &&
          pathParts[2] === ""
        ) {
          const partName = pathParts[1];
          const displayName = partName.split(" ")[1] || partName.split("-")[1];
          const partNumber = partName.match(/\d+/)[0];

          const part = {
            name: partName,
            displayName: displayName,
            partNumber: partNumber,
            partFiles: [],
          };
          parts.push(part);

          // Add part to the current batch
          currentPartBatch.parts.push(part);
          const partSizeEstimate = 1024; // 1 KB for JSON metadata as a placeholder
          currentPartBatch.size += partSizeEstimate;
          if (currentPartBatch.size > 300 * 1024 * 1024) {
            partBatches.push(currentPartBatch);
            currentPartBatch = { size: 0, parts: [] };
          }
        } else if (
          !entry.isDirectory &&
          pathParts.length === 3 &&
          pathParts[2] !== ""
        ) {
          const partName = pathParts[1];
          const fileName = pathParts[2];
          const fileData = await entry.blob();
          const fileSize = fileData.size;
          const partIndex = parts.findIndex((p) => p.name === partName);

          if (partIndex !== -1) {
            const document = {
              fileName: fileName,
              fileSize: fileSize,
              partNumber: parts[partIndex].partNumber,
            };

            if (fileName.endsWith(".doc") || fileName.endsWith(".docx")) {
              documents.push(document);
              if (currentDocumentBatch.size + fileSize > 300 * 1024 * 1024) {
                documentBatches.push(currentDocumentBatch);
                currentDocumentBatch = { size: 0, documents: [] };
              }
              currentDocumentBatch.documents.push(document);
              currentDocumentBatch.size += fileSize;
            } else {
              parts[partIndex].partFiles.push(fileName);
            }
          }
        }
      }

      // Add the last batches if they have any content
      if (currentPartBatch.size > 0) {
        partBatches.push(currentPartBatch);
      }
      if (currentDocumentBatch.size > 0) {
        documentBatches.push(currentDocumentBatch);
      }
    } catch (error) {
      console.error("Error unzipping file:", error);
      alert("Error processing the file.");
    }
  };

  const onCancel = () => {
    setZipFile(null);
    if (props.onHide) {
      props.onHide();
    }
  };

  return (
    <div>
      <h5>Warning! Max file size for single file in zip file is 300 MB</h5>
      <FileUpload
        instructionText={"Select a ZIP file containing parts to upload"}
        onFileSelect={onFileSelect}
        file={zipFile}
        setFile={setZipFile}
      />
      <Row>
        <SubmitButton
          className="mt-3 ml-3 mr-2 mb-2 btn dokuly-bg-primary"
          onClick={onSubmit}
        >
          Submit
        </SubmitButton>
        <SubmitButton
          className="mt-3 mb-2 btn dokuly-bg-danger"
          onClick={onCancel}
        >
          Cancel
        </SubmitButton>
      </Row>
    </div>
  );
};

export default BatchAddPartsForm;

import React, { useEffect, useState } from "react";
import { connectFileToObject, connectFilesToObject } from "./functions/queries";
import {
  uploadFileCreateNewFileEntity,
  uploadFilesCreateNewFilesEntities,
} from "../../files/functions/queries";
import SubmitButton from "../../dokuly_components/submitButton";
import FileUpload from "../../dokuly_components/fileUpload/fileUpload";
import { Form, Row, ListGroup, Button } from "react-bootstrap";
import { isNull } from "../../dokuly_components/funcitons/logicChecks";

/**
 * A modal for adding generic files to a db entity
 *
 * @param {*} props must contain dbObjDomain, dbObj, dbObjIdName and setRefresh().
 *
 * @param {boolean} [props.checkForGerberUpload] - Determines if the checkbox should be displayed. Optional.
 * @param {boolean} [props.gerberUpload] - Indicates whether the Gerber file upload is enabled. Optional.
 * @param {Function} [props.setGerberUpload] - Function to handle changes to the Gerber file upload state. Optional.
 * @returns Generic File modal form.
 */
const GenericFileForm = (props) => {
  const [is_uploading, setIsUploading] = useState(false);
  const [display_name, setDisplayName] = useState("");
  const [files, setFiles] = useState([]);

  const openModal = () => {
    $("#genericFileModal").modal("show");
  };

  const closeFileModal = () => {
    $("#genericFileModal").modal("hide");
  };

  const handleFileUpload = (selectedFiles) => {
    // Wrap single file in array if it's not already
    const newFiles = Array.isArray(selectedFiles)
      ? selectedFiles
      : [selectedFiles];

    // Check for duplicates
    const uniqueNewFiles = newFiles.filter(
      (newFile) =>
        !files.some((f) => f.name === newFile.name && f.size === newFile.size),
    );

    if (uniqueNewFiles.length === 0) return;

    const updatedFiles = [...files, ...uniqueNewFiles];
    setFiles(updatedFiles);

    // If it's the first file and display_name is empty, set it
    if (updatedFiles.length === 1 && display_name === "") {
      const firstFile = updatedFiles[0];
      const lastDotIndex = firstFile.name.lastIndexOf(".");
      const extension = lastDotIndex !== -1 ? firstFile.name.substring(lastDotIndex + 1) : "";
      const nameWithoutExtension = lastDotIndex !== -1 
        ? firstFile.name.substring(0, lastDotIndex)
        : firstFile.name;

      // Check if its a zip file, ask if it is a gerber file
      if (extension === "zip" && props?.checkForGerberUpload) {
        if (confirm("Is this Gerber files?")) {
          if (props.setGerberUpload) {
            props.setGerberUpload(true);
            const newName = "Gerber Files";
            setDisplayName(newName);
            return;
          }
        }
      }
      setDisplayName(nameWithoutExtension);
    }
  };

  const removeFile = (index) => {
    const updatedFiles = [...files];
    updatedFiles.splice(index, 1);
    setFiles(updatedFiles);
    if (updatedFiles.length === 0) {
      setDisplayName("");
    }
  };

  const clearAllFiles = () => {
    setFiles([]);
    setDisplayName("");
  };

  const handleGerberUploadChange = (event) => {
    if (props.setGerberUpload) {
      props.setGerberUpload(event);
    }
  };

  const onSubmit = () => {
    if (files.length === 0) return;

    if (props?.setLoading) {
      props.setLoading(true);
    }

    if (files.length === 1) {
      const data = new FormData();
      data.append("file", files[0]);
      data.append("display_name", display_name);

      closeFileModal();
      uploadFileCreateNewFileEntity(data).then((res) => {
        if (res.status === 201) {
          const connectData = props?.checkForGerberUpload
            ? { gerber: props?.gerberUpload }
            : {};
          connectFileToObject(
            props?.app,
            props.objectId,
            res.data.id,
            connectData,
            props?.gerberUpload,
          )
            .then((res2) => {
              setIsUploading(false);
              setDisplayName("");
              setFiles([]);
            })
            .finally(() => {
              if (props?.checkForGerberUpload) {
                props.setGerberUpload(false);
              }
              if (props?.handleRefresh) {
                props.handleRefresh();
              } else {
                props.setRefresh(true);
              }
              if (props?.setLoading) {
                props.setLoading(false);
              }
            });
        }
      });
    } else {
      // Multi-file upload
      const data = new FormData();
      for (const file of files) {
        data.append("files", file);
      }
      for (const file of files) {
        const lastDotIndex = file.name.lastIndexOf(".");
        const nameWithoutExtension = lastDotIndex !== -1 
          ? file.name.substring(0, lastDotIndex)
          : file.name;
        data.append("display_names", nameWithoutExtension);
      }

      closeFileModal();
      uploadFilesCreateNewFilesEntities(data).then((res) => {
        if (res.status === 201) {
          const fileIds = res.data.map((f) => f.id);
          connectFilesToObject(
            props?.app,
            props.objectId,
            fileIds,
            props?.gerberUpload,
          )
            .then((res2) => {
              setIsUploading(false);
              setDisplayName("");
              setFiles([]);
            })
            .finally(() => {
              if (props?.checkForGerberUpload) {
                props.setGerberUpload(false);
              }
              if (props?.handleRefresh) {
                props.handleRefresh();
              } else {
                props.setRefresh(true);
              }
              if (props?.setLoading) {
                props.setLoading(false);
              }
            });
        }
      });
    }
  };

  return (
    <div>
      <button
        className="btn btn-sm dokuly-btn-transparent mt-1 ml-1"
        type="button"
        onClick={() => openModal()}
      >
        <img
          className="icon-dark"
          src="../../static/icons/file-upload.svg"
          alt="icon"
        />
        <span className="btn-text">Upload</span>
      </button>

      {/* <!-- Modal --> */}
      <div
        className="modal fade"
        role="dialog"
        id="genericFileModal"
        tabIndex="-1"
        aria-labelledby="genericFileModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <React.Fragment>
              <div className="modal-header">
                <h5 className="modal-title" id="genericFileModalLabel">
                  Upload files
                </h5>
                <button
                  type="button"
                  className="close"
                  data-dismiss="modal"
                  aria-label="Close"
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <div className="container">
                  {files.length <= 1 && (
                    <div className="form-group">
                      <label>Display name</label>
                      <input
                        className="form-control"
                        type="text"
                        name="name"
                        onChange={(e) => setDisplayName(e.target.value)}
                        value={display_name}
                        placeholder={
                          files.length === 1
                            ? files[0].name
                            : "Enter display name"
                        }
                      />
                    </div>
                  )}
                  <div className="form-group">
                    <label>Upload files</label>
                    <FileUpload
                      onFileSelect={handleFileUpload}
                      multiple={true}
                    />
                  </div>

                  {files.length > 0 && (
                    <div className="form-group">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <label className="mb-0">
                          Selected Files ({files.length})
                        </label>
                        <Button
                          variant="link"
                          size="sm"
                          className="text-danger p-0"
                          onClick={clearAllFiles}
                        >
                          Clear All
                        </Button>
                      </div>
                      <ListGroup className="selected-files-list">
                        {files.map((f, index) => (
                          <ListGroup.Item
                            key={`${f.name}-${index}`}
                            className="d-flex justify-content-between align-items-center py-2"
                          >
                            <span className="text-truncate mr-2" title={f.name}>
                              {f.name}
                            </span>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              className="px-2 py-0"
                              onClick={() => removeFile(index)}
                            >
                              &times;
                            </Button>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    </div>
                  )}

                  {props?.checkForGerberUpload &&
                    !isNull(props?.gerberUpload) &&
                    !isNull(props?.setGerberUpload) && (
                      <Form.Group
                        className="form-group"
                        controlId="formBasicCheckbox"
                      >
                        <Form.Check
                          className="dokuly-checkbox"
                          type="checkbox"
                          label="Use Gerber Render?"
                          checked={props?.gerberUpload}
                          onChange={handleGerberUploadChange}
                        />
                      </Form.Group>
                    )}
                  <div className="row mb-2">
                    <SubmitButton
                      disabledTooltip={"Select files to upload"}
                      onClick={onSubmit}
                      disabled={
                        files.length === 0 ||
                        (files.length === 1 && display_name === "")
                      }
                      type="button"
                      className="btn dokuly-btn-primary ml-2 "
                    >
                      Submit
                    </SubmitButton>
                  </div>
                </div>
              </div>
            </React.Fragment>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenericFileForm;

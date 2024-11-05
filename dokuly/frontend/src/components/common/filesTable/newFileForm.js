import React, { useEffect, useState } from "react";
import { connectFileToObject } from "./functions/queries";
import { uploadFileCreateNewFileEntity } from "../../files/functions/queries";
import SubmitButton from "../../dokuly_components/submitButton";
import FileUpload from "../../dokuly_components/fileUpload/fileUpload";
import { Form, Row } from "react-bootstrap";
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
  const [file, setFile] = useState(null);

  const openModal = () => {
    $("#genericFileModal").modal("show");
  };

  const closeFileModal = () => {
    $("#genericFileModal").modal("hide");
  };

  const handleFileUpload = (file) => {
    setFile(file);
    const split = file.name.split(".");
    // Check if its a zip file, ask if it is a gerber file
    if (split[split.length - 1] === "zip" && props?.checkForGerberUpload) {
      if (confirm("Is this Gerber files?")) {
        if (props.setGerberUpload) {
          props.setGerberUpload(true);
          const newName = "Gerber Files";
          setDisplayName(newName);
          return;
        }
      }
    }
    const newName = split[0];
    setDisplayName(newName);
  };

  const handleGerberUploadChange = (event) => {
    if (props.setGerberUpload) {
      props.setGerberUpload(event);
    }
  };

  const onSubmit = () => {
    const data = new FormData();
    // Fields used by the view.
    data.append("file", file);
    data.append("display_name", display_name);

    closeFileModal();
    uploadFileCreateNewFileEntity(data).then((res) => {
      if (res.status === 201) {
        const data = props?.checkForGerberUpload
          ? { gerber: props?.gerberUpload }
          : {};
        connectFileToObject(
          props?.app,
          props.objectId,
          res.data.id,
          data,
          props?.gerberUpload,
        )
          .then((res2) => {
            setIsUploading(false);
            setDisplayName("");
            setFile(null);
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
                  Upload file
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
                  <div className="form-group">
                    <label>Display name</label>
                    <input
                      className="form-control"
                      type="text"
                      name="name"
                      onChange={(e) => setDisplayName(e.target.value)}
                      value={display_name}
                    />
                  </div>
                  <div className="form-group">
                    <label>Upload file</label>
                    <FileUpload
                      onFileSelect={handleFileUpload}
                      file={file}
                      setFile={setFile}
                    />
                  </div>
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
                      disabledTooltip={"Select a file to upload"}
                      onClick={() => {
                        if (props?.setLoading) {
                          props.setLoading(true);
                        }
                        onSubmit();
                      }}
                      disabled={display_name === "" || file === null}
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

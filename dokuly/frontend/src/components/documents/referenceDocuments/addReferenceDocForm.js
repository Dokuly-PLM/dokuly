import React, { useState, useEffect } from "react";
import Select from "react-select";

import { addReference } from "../functions/queries";
import { getLatestDocumentRevisions } from "../functions/queries";

/**
 * # Reference documents Addition Form
 *
 *
 * Using a common selection module allows reuse, and implementation of morea advanced search functions.
 *
 * @param {*} props must contain one of the following props 'asm_id', 'part_id' or 'pcba_id'.
 * @returns a UI button that opens a reference docuemtnt modal.
 *
 * ## Exampleselect
 *
 * ```js
 *
 * ```
 */
export const DocumentSearchSelector = (props) => {
  // Creates empty array of document.
  const [documents, setDocuments] = useState([]);
  const [refresh, setRefresh] = useState(false);
  // const [searchData, setSearchData] = useState(null);

  const [reference_document_id, setReferenceDocumentId] = useState({
    key: "",
    value: "",
    label: "",
  });
  const [is_specification, setIsSpecificaiton] = useState(false);

  // This runs once.
  useEffect(() => {
    getLatestDocumentRevisions().then((res) => {
      if (res.status === 200) {
        if (res.data.length !== 0) {
          setDocuments(
            res.data?.map((document) => {
              return {
                label: `${document?.full_doc_number} - ${document?.title}`,
                value: document.id,
                key: document.id,
              };
            })
          );
        }
      }
    });
  }, []);

  // Fecth ID for one of the supported modules.
  // The back-end view processes the data based on which of these fields are populated.
  const [asm_id, setAsmId] = useState(
    props.asm_id !== null && props.asm_id !== undefined ? props.asm_id : null
  );
  const [part_id, setPartId] = useState(
    props.part_id !== null && props.part_id !== undefined ? props.part_id : null
  );
  const [pcba_id, setPcbaId] = useState(
    props.pcba_id !== null && props.pcba_id !== undefined ? props.pcba_id : null
  );

  const addReferenceDoc = () => {
    // Is specification should be default false when the form is opened.
    setIsSpecificaiton(false);
    $("#addReferenceDocumentModal").modal("show");
  };

  function onSubmit() {
    $("#addReferenceDocumentModal").modal("hide");

    let data = {
      // Fields used by the view.
      asm_id: asm_id,
      part_id: part_id,
      pcba_id: pcba_id,
      // Reference document to add.
      reference_document_id: reference_document_id.key,
      is_specification: is_specification,
    };
    // Push data to the database
    addReference(data).then((res) => {
      if (res.status === 201) {
        props?.setRefresh(true);
      }
    });

    props.setRefresh(true);
  }

  return (
    <div>
      <div>
        <button
          type="button"
          className="btn btn-bg-transparent mt-2 mb-2 mr-2"
          onClick={() => addReferenceDoc()}
        >
          <div className="row">
            <img
              className="icon-dark"
              src="../../static/icons/file-plus.svg"
              alt="icon"
            />
            <span className="btn-text">Add reference document</span>
          </div>
        </button>
      </div>

      {/* <!-- Modal --> */}
      <div
        className="modal fade"
        id="addReferenceDocumentModal"
        tabIndex="-1"
        role="dialog"
        aria-hidden="true"
      >
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Add reference document</h5>
              <button
                type="button"
                className="close"
                data-dismiss="modal"
                aria-label="Close"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>

            {/* Form inputs below */}

            <div className="modal-body">
              <div className="form-group">
                <label>Document</label>
                <Select
                  name="part"
                  placeholder="Select Document"
                  value={reference_document_id}
                  options={documents}
                  onChange={(e) => setReferenceDocumentId(e)}
                  style={{ marginLeft: "0.5rem" }}
                />
              </div>

              <div>
                <div className="form-group">
                  <label htmlFor="is_specification">
                    <input
                      type="checkbox"
                      checked={is_specification}
                      onChange={() => setIsSpecificaiton(!is_specification)}
                    ></input>{" "}
                    Is specification
                  </label>
                </div>
                <small className="text-muted">
                  Specifications are the documents that define how the target
                  object shall be designed, manufactured, used etc.
                </small>
              </div>
              <div className="form-group">
                <button
                  type="submit"
                  className="btn dokuly-bg-primary "
                  onClick={() => {
                    onSubmit();
                  }}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

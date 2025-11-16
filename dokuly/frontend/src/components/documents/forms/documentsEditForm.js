import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { toast } from "react-toastify";
import { updateDoc, archiveDocument } from "../functions/queries";
import { fetchProtectionLevels } from "../../admin/functions/queries";
import ReleaseStateTimeline from "../../dokuly_components/releaseStateTimeline/ReleaseStateTimeline";
import FileUpload from "../../dokuly_components/fileUpload/fileUpload";
import DokulyModal from "../../dokuly_components/dokulyModal";

const DocumentEditForm = (props) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [summary, setSummary] = useState("");
  const [front_page, setFrontPage] = useState(true);
  const [revision_table, setRevisionTable] = useState(false);
  const [shared_document_link, setSharedDocumentLink] = useState(null);
  const [release_state, setReleaseState] = useState("");
  const [is_approved_for_release, setIsApprovedForRelease] = useState(false);
  const [file, setFile] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [protectionLevels, setProtectionLevels] = useState([]);
  const [selected_protection_level_id, setSelectedProtectionLevelId] = useState("");

  useEffect(() => {
    setTitle(props.document?.title);
    setDescription(props.document?.description);

    setSummary(
      props.document?.summary !== (null || "null")
        ? props.document?.summary
        : "",
    );
    if (props.document.front_page != null)
      setFrontPage(props.document?.front_page);
    if (props.document.revision_table != null)
      setRevisionTable(props.document?.revision_table);
    setSharedDocumentLink(props.document?.shared_document_link);
    setReleaseState(props.document?.release_state);
    setSelectedProtectionLevelId(props.document?.protection_level || "");
  }, [props.document]);

  useEffect(() => {
    fetchProtectionLevels().then((res) => {
      if (res.status === 200) {
        setProtectionLevels(res.data);
      }
    });
  }, []);

  const tooltip = (
    <Tooltip id="tooltip" className="dokuly-tooltip">
      The document can only be reviewed if it has been set to the review state.
    </Tooltip>
  );

  const launchForm = () => {
    setFile(null);
    setShowModal(true);
  };

  function onSubmit() {
    setShowModal(false);
    const data = new FormData();
    data.append("title", title);
    data.append("description", description);
    data.append("summary", summary);
    data.append("front_page", front_page);
    data.append("revision_table", revision_table);
    data.append("shared_document_link", shared_document_link);
    data.append("release_state", release_state);
    data.append("is_approved_for_release", is_approved_for_release);
    if (selected_protection_level_id) {
      data.append("protection_level", selected_protection_level_id);
    }

    // Sort file by file extension.
    if (file != null) {
      if (
        file.name.toLowerCase().includes(".docx") ||
        file.name.toLowerCase().includes(".pptx") ||
        file.name.toLowerCase().includes(".pptm") ||
        file.name.toLowerCase().includes(".xlsx") ||
        file.name.toLowerCase().includes(".csv") ||
        file.name.toLowerCase().includes(".txt") ||
        file.name.toLowerCase().includes(".key") ||
        file.name.toLowerCase().includes(".pages") ||
        file.name.toLowerCase().includes(".numbers") ||
        file.name.toLowerCase().includes(".odt") ||
        file.name.toLowerCase().includes(".xml") ||
        file.name.toLowerCase().includes(".md") ||
        file.name.toLowerCase().includes(".svg")
      ) {
        data.append("document_file", file, file.name);
      } else if (file.name.toLowerCase().includes(".pdf")) {
        data.append("pdf_raw", file, file.name);
      } else if (file.name.toLowerCase().includes(".zip")) {
        data.append("zip_file", file, file.name);
      }
    }

    // Push data to the database
    toast.info("Processing document information...");
    updateDoc(props.document?.id, data).then((res) => {
      if (res.status === 200) {
        toast.success("Document updated!");
        if (props?.setRefresh !== undefined) {
          props?.setRefresh(true);
        }
      }
    });
  }

  function archiveDoc() {
    if (!confirm("Are you sure you want to delete this document?")) {
      return;
    }

    // Push data to the database
    archiveDocument(props.document?.id).then((res) => {
      if (res.status === 200) {
        setShowModal(false);
        navigate("/documents/");
      }
    });
  }

  return (
    <React.Fragment>
      <div style={{ margin: "1rem" }}>
        {props.document?.release_state !== "Released" && (
          <button
            type="button"
            className="btn btn-bg-transparent"
            onClick={launchForm}
          >
            <div className="row">
              <img
                className="icon-dark"
                src="../../static/icons/edit.svg"
                alt="icon"
              />
              <span className="btn-text">Edit</span>
            </div>
          </button>
        )}

        <DokulyModal
          show={showModal}
          onHide={() => setShowModal(false)}
          title="Edit document"
        >
          <div className="form-group">
            <label>Title</label>
            <input
              className="form-control"
              type="text"
              name="title"
              onChange={(e) => {
                if (e.target.value.length > 1000) {
                  alert("Max length 1000");
                  return;
                }
                setTitle(e.target.value);
              }}
              value={title}
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              className="form-control"
              type="text"
              name="description"
              onChange={(e) => {
                if (e.target.value.length > 1000) {
                  alert("Max length 1000");
                  return;
                }
                setDescription(e.target.value);
              }}
              value={description}
            />
          </div>

          <div className="form-group">
            <label>Protection Level</label>
            <select
              className="form-control"
              name="protection_level"
              value={selected_protection_level_id}
              onChange={(e) => {
                setSelectedProtectionLevelId(e.target.value);
              }}
            >
              <option value="">Select protection level</option>
              {protectionLevels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Summary</label>
            <textarea
              className="form-control"
              type="text"
              name="summary"
              onChange={(e) => {
                if (e.target.value.length > 2000) {
                  alert("Max length 2000");
                  return;
                }
                setSummary(e.target.value);
              }}
              value={summary}
            />
          </div>

          <div className="form-group">
            <label>Upload file</label>
            <FileUpload onFileSelect={setFile} file={file} setFile={setFile} />
          </div>

          <div className="form-group">
            <label>Shared document link</label>
            <input
              className="form-control"
              type="text"
              name="shared_document_link"
              onChange={(e) => {
                setSharedDocumentLink(e.target.value);
              }}
              value={shared_document_link}
              id="shared_document_link"
            />
          </div>

          <ReleaseStateTimeline
            releaseState={release_state}
            setReleaseState={setReleaseState}
            is_approved_for_release={is_approved_for_release}
            setIsApprovedForRelease={setIsApprovedForRelease}
            quality_assurance={props?.document?.quality_assurance}
          />

          <div className="form-group">
            <div className="input-group m-3">
              <input
                className="form-check-input dokuly-checkbox"
                name="front_page"
                type="checkbox"
                onChange={(e) => {
                  setFrontPage(!front_page);
                }}
                checked={front_page}
              />
              <label className="form-check-label" htmlFor="front_page">
                Generate PDF front page
              </label>
            </div>

            <div className="input-group m-3">
              <input
                className="form-check-input dokuly-checkbox"
                name="revision_table"
                type="checkbox"
                onChange={(e) => {
                  setRevisionTable(!revision_table);
                }}
                checked={revision_table}
              />
              <label className="form-check-label" htmlFor="revision_table">
                Add PDF revision table
              </label>
            </div>
          </div>

          <div className="form-group">
            <button
              onClick={() => onSubmit()}
              className="btn dokuly-bg-primary"
              type="button"
            >
              Submit
            </button>

            <button
              className={"btn btn-bg-transparent ml-2"}
              type="button"
              data-placement="top"
              title={"archive_document"}
              onClick={archiveDoc}
            >
              <div className="row">
                <img
                  className="icon-dark"
                  src="../../static/icons/trash.svg"
                  alt="Archive Icon"
                />
                <span className="btn-text">Delete</span>
              </div>
            </button>
          </div>
        </DokulyModal>
      </div>
    </React.Fragment>
  );
};

export default DocumentEditForm;

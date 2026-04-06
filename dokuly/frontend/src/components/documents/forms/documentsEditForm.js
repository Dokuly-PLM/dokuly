import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import { updateDoc, archiveDocument } from "../functions/queries";
import { fetchProtectionLevels } from "../../admin/functions/queries";
import DokulyModal from "../../dokuly_components/dokulyModal";
import { FormField, SectionDivider, EditFormRightPanel } from "../../dokuly_components/dokulyForm/formComponents";

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
  const [showModal, setShowModal] = useState(false);
  const [protectionLevels, setProtectionLevels] = useState([]);
  const [selected_protection_level_id, setSelectedProtectionLevelId] = useState("");
  const [rulesStatus, setRulesStatus] = useState(null);
  const [rulesOverride, setRulesOverride] = useState(false);

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

  const launchForm = () => {
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

    // File uploads are now handled through the DocumentFilesTable component
    // using the generic file upload system

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
          size="lg"
        >
          <div className="d-flex" style={{ gap: "24px" }}>
            {/* -- Left column: fields -- */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <FormField label="Title" required>
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
              </FormField>

              <FormField label="Description" hint={`${(description || "").length}/1000`}>
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
                  rows={2}
                />
              </FormField>

              <FormField label="Protection Level">
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
              </FormField>

              <FormField label="Summary" hint={`${(summary || "").length}/2000`}>
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
                  rows={3}
                />
              </FormField>

              <SectionDivider label="PDF Options" />

              <label className="d-flex align-items-center mb-2" style={{ gap: "6px", fontSize: "0.8125rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={front_page}
                  onChange={() => setFrontPage(!front_page)}
                />
                Generate PDF front page
              </label>

              <label className="d-flex align-items-center mb-2" style={{ gap: "6px", fontSize: "0.8125rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={revision_table}
                  onChange={() => setRevisionTable(!revision_table)}
                />
                Add PDF revision table
              </label>
            </div>

            {/* -- Right column: state, rules, submit, delete -- */}
            <EditFormRightPanel
              releaseState={release_state}
              setReleaseState={setReleaseState}
              isApprovedForRelease={is_approved_for_release}
              setIsApprovedForRelease={setIsApprovedForRelease}
              rulesItemType="document"
              rulesItemId={props.document?.id}
              rulesProjectId={props.document?.project}
              onRulesStatusChange={setRulesStatus}
              setRulesOverride={setRulesOverride}
              submitDisabled={
                title === "" ||
                (release_state === "Released" &&
                  rulesStatus &&
                  !rulesStatus.all_rules_passed &&
                  !rulesOverride)
              }
              submitDisabledTooltip={
                title === ""
                  ? "Title is required"
                  : "Rules must be satisfied or overridden before releasing"
              }
              onSubmit={() => onSubmit()}
              onDelete={archiveDoc}
              deleteLabel="Delete document"
            />
          </div>
        </DokulyModal>
      </div>
    </React.Fragment>
  );
};

export default DocumentEditForm;

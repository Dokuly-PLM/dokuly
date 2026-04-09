import React, { useState, useEffect, useCallback } from "react";
import { fetchFileList } from "../functions/queries";
import GenericFileForm from "../../common/filesTable/newFileForm";
import { deleteFile } from "../../files/functions/queries";
import { loadingSpinner } from "../../admin/functions/helperFunctions";
import FileViewerModal from "../../common/FileViewerModal";
import DokulyTable from "../../dokuly_components/dokulyTable/dokulyTable";
import { getFile } from "../../common/filesTable/functions/queries";
import { downloadFileAsBlobForATags } from "../../common/filesTable/filesTable";
import EditableTableCell from "../../dokuly_components/editableTableCell/editableTableCell";
import DeleteButton from "../../dokuly_components/deleteButton";
import { toast } from "react-toastify";
import { Row, Col } from "react-bootstrap";
import DokulyCard from "../../dokuly_components/dokulyCard";
import CardTitle from "../../dokuly_components/cardTitle";
import axios from "axios";
import { tokenConfig } from "../../../configs/auth";
import { openOnlyOfficeEditor } from "../../common/OnlyOfficeEditor";
import { openStepViewer } from "../../common/StepViewerPage";

const OFFICE_EXTENSIONS = ["docx", "xlsx", "pptx", "doc", "xls", "ppt", "odt", "ods", "odp"];
const STEP_EXTENSIONS = ["step", "stp"];

export const DocumentFilesTable = (props) => {
  const [fileList, setFileList] = useState([]);
  const [refresh, setRefresh] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFileUri, setSelectedFileUri] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState(null);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [revisionLocked, setRevisionLocked] = useState(true);
  const [loading, setLoading] = useState(true);
  const [document, setDocument] = useState(null);
  const [fileLocks, setFileLocks] = useState({});

  useEffect(() => {
    if (props.db_item !== null && props.db_item !== undefined) {
      setDocument(props.db_item);
      setRevisionLocked(props.db_item.release_state === "Released");
    }
  }, [props.db_item]);

  // Listen for refresh messages from the editor tab (e.g., after PDF generation)
  useEffect(() => {
    let channel;
    try {
      channel = new BroadcastChannel("dokuly_file_updates");
      channel.onmessage = (event) => {
        if (event.data?.type === "pdf_generated") {
          setRefresh(true);
          if (props.setRefresh) props.setRefresh(true);
        }
      };
    } catch (e) {
      // BroadcastChannel not supported
    }
    return () => {
      if (channel) channel.close();
    };
  }, []);

  const fetchLockStatuses = useCallback(async (files) => {
    const officeFiles = files.filter((f) => {
      const ext = (f.file_name || "").split(".").pop().toLowerCase();
      return OFFICE_EXTENSIONS.includes(ext);
    });
    if (officeFiles.length === 0) return;

    const locks = {};
    await Promise.all(
      officeFiles.map(async (f) => {
        const fid = f.file_id || f.id;
        if (!fid) return;
        try {
          const res = await axios.get(
            `api/files/onlyoffice/lock-status/${fid}/`,
            tokenConfig()
          );
          if (res.data?.locked) {
            locks[fid] = res.data;
          }
        } catch {
          // Ignore errors for lock status
        }
      })
    );
    setFileLocks(locks);
  }, []);

  const handleUnlockFile = useCallback(async (fileId) => {
    try {
      await axios.post(
        `api/files/onlyoffice/unlock/${fileId}/`,
        {},
        tokenConfig()
      );
      toast.success("File unlocked");
      setFileLocks((prev) => {
        const next = { ...prev };
        delete next[fileId];
        return next;
      });
    } catch {
      toast.error("Failed to unlock file");
    }
  }, []);

  const handleRowDoubleClick = (rowIndex, row) => {
    // For special document files, use the uri directly
    if (row.type === "SHARED_DOC_LINK") {
      window.open(row.uri, "_blank");
      return;
    }

    const ext = (row.file_name || "").split(".").pop().toLowerCase();

    // For Office files, open in a new tab with OnlyOffice editor
    if (OFFICE_EXTENSIONS.includes(ext) && (row.file_id || row.id)) {
      openOnlyOfficeEditor(row.file_id || row.id);
      return;
    }

    // For STEP/STP files, open in the professional 3D viewer
    if (STEP_EXTENSIONS.includes(ext) && (row.file_id || row.id)) {
      openStepViewer(row.file_id || row.id);
      return;
    }

    // For other files, open the viewer modal
    const viewUri = row.uri.includes("/download/file/")
      ? row.uri.replace("/download/file/", "/view/")
      : row.uri;
    setSelectedFileUri(viewUri);
    setSelectedFileName(row.file_name);
    setSelectedFileId(row.file_id || row.id);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSaveDisplayName = async (fileId, newDisplayName) => {
    try {
      const response = await axios.patch(`/api/files/${fileId}/`, {
        display_name: newDisplayName
      }, tokenConfig());
      
      if (response.status === 200) {
        // Update local state
        setFileList(prevFiles => 
          prevFiles.map(file => {
            const currentFileId = file.file_id || file.id;
            return currentFileId === fileId 
              ? { ...file, title: newDisplayName, display_name: newDisplayName }
              : file
          })
        );
        
        // Trigger parent refresh
        handleRefresh();
      }
    } catch (error) {
      console.error("Error updating display name:", error);
      throw new Error("Failed to update display name");
    }
  };

  const handleRefresh = () => {
    if (props.setRefresh) {
      props.setRefresh(true);
    }
    setRefresh(true);
  };

  useEffect(() => {
    if ((props.db_item?.id !== null && props.db_item?.id !== undefined) || refresh) {
      setLoading(true);
      fetchFileList(props.db_item?.id)
        .then((res) => {
          if (res.status === 200) {
            setFileList(res.data);
            fetchLockStatuses(res.data);
          }
        })
        .catch((error) => {
          toast.error("Error fetching files");
          console.error("Error fetching files:", error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
    if (refresh) {
      if (props.setRefresh) {
        props.setRefresh(true);
      }
      setRefresh(false);
    }
  }, [props.db_item?.id, refresh, props.refresh]);

  const handleDownload = (row) => {
    downloadFileAsBlobForATags(row.uri, row.file_name);
  };

  const handleDelete = (row) => {
    if (!window.confirm("Are you sure you want to delete this file?")) {
      return;
    }

    // Check if file has a file_id (all deletable files should have this)
    if (!row.file_id) {
      toast.info("This file type cannot be deleted from here");
      return;
    }

    setLoading(true);

    // All files (GENERIC, PDF_RAW, PDF) use the same deletion path through File table
    deleteFile(row.file_id)
      .then((res) => {
        if (res.status === 200) {
          toast.success("File deleted successfully");
          handleRefresh();
        }
      })
      .catch((error) => {
        console.error("Failed to delete file:", error);
        toast.error("Failed to delete file");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const isOfficeFileRow = (row) => {
    const ext = (row.file_name || "").split(".").pop().toLowerCase();
    return OFFICE_EXTENSIONS.includes(ext);
  };

  const rowActionsFormatter = (row) => {
    const fileId = row.file_id || row.id;
    const lockData = fileId ? fileLocks[fileId] : null;
    const isOffice = isOfficeFileRow(row);
    const ext = (row.file_name || "").split(".").pop().toLowerCase();

    return (
      <div className="d-flex align-items-center gap-3 justify-content-end">
        {lockData && (
          lockData.is_owner ? (
            // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
            <img
              onClick={() => handleUnlockFile(fileId)}
              width="22px"
              src="../../static/icons/lock.svg"
              alt="Locked by you"
              title="Locked by you - click to unlock"
              style={{ cursor: "pointer", opacity: 0.7 }}
            />
          ) : (
            <img
              width="22px"
              src="../../static/icons/lock.svg"
              alt="Locked"
              title={`Being edited by ${lockData.locked_by_name}`}
              style={{ opacity: 0.4 }}
            />
          )
        )}
        {isOffice && row.type === "GENERIC" && (
          <button
            type="button"
            className="btn btn-sm dokuly-btn-primary"
            style={{ fontSize: "0.8rem", fontWeight: 600, padding: "3px 14px", whiteSpace: "nowrap" }}
            onClick={() => openOnlyOfficeEditor(fileId)}
            title={revisionLocked ? "View a readonly version" : "Open in document editor"}
          >
            {revisionLocked ? "View" : "Edit"}
          </button>
        )}
        {STEP_EXTENSIONS.includes(ext) && row.type === "GENERIC" && !revisionLocked && (
          <button
            type="button"
            className="btn btn-sm dokuly-btn-primary"
            style={{ fontSize: "0.8rem", fontWeight: 600, padding: "3px 14px", whiteSpace: "nowrap" }}
            onClick={() => openStepViewer(fileId)}
            title="Open in 3D viewer"
          >
            View 3D
          </button>
        )}
        {row.type === "SHARED_DOC_LINK" && (
          // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
          <img
            onClick={() => window.open(row.uri, "_blank")}
            width="22px"
            src="../../static/icons/link.svg"
            alt="Open link"
            title="Open shared link"
            style={{ cursor: "pointer" }}
          />
        )}
        {row.file_name && row.type !== "SHARED_DOC_LINK" && (
          // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
          <img
            onClick={() => handleDownload(row)}
            width="22px"
            src="../../static/icons/file-download.svg"
            alt="Download"
            title="Download file"
            style={{ cursor: "pointer" }}
          />
        )}
        {!revisionLocked && row.type === "GENERIC" && (
          <DeleteButton
            onDelete={() => handleDelete(row)}
            buttonText=""
            fontSize="14px"
            iconWidth="22px"
            className="btn-transparent"
            noFlexClass={true}
            style={{ marginTop: "0", padding: "0", border: "none" }}
          />
        )}
      </div>
    );
  };

  const columns = [
    {
      key: "title",
      header: "File",
      sort: true,
      formatter: (row) => {
        const isEditable = !revisionLocked && row.type === "GENERIC";
        const fileId = row.file_id || row.id;

        return (
          <div>
            <EditableTableCell
              value={row.title || row.display_name || ""}
              isEditable={isEditable}
              onSave={(newValue) => handleSaveDisplayName(fileId, newValue)}
              placeholder="Display name"
              allowEmpty={false}
              successMessage="Display name updated successfully"
            />
            {row.file_name && (
              <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                {row.file_name}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "uri",
      header: "",
      sort: false,
      maxWidth: "220px",
      formatter: rowActionsFormatter,
    },
  ];

  const workingFiles = fileList.filter((f) => f.type === "GENERIC");
  const pdfPrintFile = fileList.find((f) => f.type === "PDF");
  const pdfSourceFile = fileList.find((f) => f.type === "PDF_RAW");

  const handleDeletePdf = useCallback(async (pdfType) => {
    const label = pdfType === "print" ? "PDF Print" : "PDF Source";
    if (!window.confirm(`Are you sure you want to delete the ${label}?`)) return;
    try {
      await axios.delete(
        `api/files/onlyoffice/delete-pdf/${props.db_item?.id}/${pdfType}/`,
        tokenConfig()
      );
      toast.success(`${label} deleted`);
      handleRefresh();
    } catch {
      toast.error(`Failed to delete ${label}`);
    }
  }, [props.db_item?.id]);

  return (
    <React.Fragment>
      <DokulyCard
        isCollapsed={!fileList || fileList.length === 0}
        expandText={"Add files"}
        isHidden={
          (!fileList || fileList.length === 0) &&
          props.db_item?.release_state === "Released"
        }
        hiddenText={"No files have been uploaded for this item."}
      >
        <Row>
          <Col>
            <CardTitle titleText={"Files"} />
          </Col>
          <Col>
            {props.db_item?.release_state !== "Released" && (
              <GenericFileForm
                app={"documents"}
                objectId={props.db_item?.id}
                setRefresh={setRefresh}
                handleRefresh={handleRefresh}
                setLoading={setLoading}
              />
            )}
          </Col>
        </Row>
        <div className="row">
          <div className="col">
            {loading ? (
              loadingSpinner()
            ) : workingFiles.length > 0 ? (
              <DokulyTable
                data={workingFiles}
                columns={columns}
                onRowDoubleClick={handleRowDoubleClick}
                showCsvDownload={false}
                showSearch={workingFiles.length > 5}
                showPagination={false}
              />
            ) : (
              <p className="text-muted ps-1">No working files uploaded yet.</p>
            )}
          </div>
        </div>
        <div className="row">
          <div className="col">
            <p className="text-muted">
              <small>
                <b>Double-click</b> a row to view the file. Use the <b>Edit</b> button to open Office files in the editor.
              </small>
            </p>
          </div>
        </div>

        {(pdfPrintFile || pdfSourceFile) && (
          <>
            <hr className="dokuly-divider" />
            <span className="dokuly-section-label">Generated PDFs</span>

            {pdfPrintFile && (
              <div className="d-flex align-items-center justify-content-between px-1 py-2">
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 500 }}>
                    {pdfPrintFile.title}
                  </div>
                  <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                    {pdfPrintFile.file_name}
                  </div>
                </div>
                <div className="d-flex align-items-center gap-3">
                  {/* biome-ignore lint/a11y/useKeyWithClickEvents: download */}
                  <img
                    onClick={() => handleDownload(pdfPrintFile)}
                    width="22px"
                    src="../../static/icons/file-download.svg"
                    alt="Download"
                    title="Download PDF Print"
                    style={{ cursor: "pointer" }}
                  />
                  {!revisionLocked && (
                    <DeleteButton
                      onDelete={() => handleDeletePdf("print")}
                      buttonText=""
                      fontSize="14px"
                      iconWidth="22px"
                      className="btn-transparent"
                      noFlexClass={true}
                      style={{ marginTop: "0", padding: "0", border: "none" }}
                    />
                  )}
                </div>
              </div>
            )}

            {pdfSourceFile && (
              <div className="d-flex align-items-center justify-content-between px-1 py-2">
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 500 }}>
                    {pdfSourceFile.title}
                  </div>
                  <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                    {pdfSourceFile.file_name}
                  </div>
                </div>
                <div className="d-flex align-items-center gap-3">
                  {/* biome-ignore lint/a11y/useKeyWithClickEvents: download */}
                  <img
                    onClick={() => handleDownload(pdfSourceFile)}
                    width="22px"
                    src="../../static/icons/file-download.svg"
                    alt="Download"
                    title="Download PDF Source"
                    style={{ cursor: "pointer" }}
                  />
                  {!revisionLocked && (
                    <DeleteButton
                      onDelete={() => handleDeletePdf("source")}
                      buttonText=""
                      fontSize="14px"
                      iconWidth="22px"
                      className="btn-transparent"
                      noFlexClass={true}
                      style={{ marginTop: "0", padding: "0", border: "none" }}
                    />
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </DokulyCard>

      <FileViewerModal
        isOpen={isModalOpen}
        fileUri={selectedFileUri}
        fileName={selectedFileName}
        handleClose={handleCloseModal}
        parentEntityType="documents"
        parentEntityId={props.db_item?.id}
        currentFileId={selectedFileId}
      />
    </React.Fragment>
  );
};

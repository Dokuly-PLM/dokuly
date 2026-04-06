import React, { useState, useEffect } from "react";

import { fetchFileList, removeGerberFile } from "../../functions/queries";
import GenericFileForm from "../../../common/filesTable/newFileForm";
import { deleteFile } from "../../../files/functions/queries";

import { loadingSpinner } from "../../../admin/functions/helperFunctions";

import FileViewerModal from "../../../common/FileViewerModal";
import DokulyTable from "../../../dokuly_components/dokulyTable/dokulyTable";
import { getFile } from "../../../common/filesTable/functions/queries";
import EditableTableCell from "../../../dokuly_components/editableTableCell/editableTableCell";
import { toast } from "react-toastify";
import { Form, Row, Col } from "react-bootstrap";
import DokulyFormSection from "../../../dokuly_components/dokulyForm/dokulyFormSection";
import DokulyCard from "../../../dokuly_components/dokulyCard";
import CardTitle from "../../../dokuly_components/cardTitle";
import axios from "axios";
import moment from "moment";
import { tokenConfig } from "../../../../configs/auth";

const CATEGORY_DISPLAY = { design: "Design", production: "Production", other: "Other" };

const InlineCategorySelect = ({ value, onSave }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (!isEditing) return;
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsEditing(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isEditing]);

  if (isEditing) {
    return (
      <div ref={ref} style={{ minWidth: "4rem" }}>
        <select
          value={value}
          onChange={(e) => {
            onSave(e.target.value);
            setIsEditing(false);
          }}
          autoFocus
          style={{ width: "100%" }}
        >
          <option value="design">Design</option>
          <option value="production">Production</option>
          <option value="other">Other</option>
        </select>
      </div>
    );
  }

  return (
    <div
      className="w-100 bom-editable-field"
      onClick={() => setIsEditing(true)}
      style={{ minHeight: "1.5em", display: "flex", alignItems: "center", minWidth: "4rem" }}
    >
      <span>{CATEGORY_DISPLAY[value] || "Design"}</span>
      <img
        src="../../static/icons/edit.svg"
        alt="edit"
        className="icon-dark bom-edit-icon"
      />
    </div>
  );
};

export const PcbaFilesTable = (props) => {
  const [fileList, setFileList] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const [modalFileType, setModalFileType] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFileUri, setSelectedFileUri] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState(null);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [revisionLocked, setRevisionLocked] = useState(true);
  const [gerberUpload, setGerberUpload] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pcba, setPcba] = useState(null);

  const [showFileName, setShowFileName] = useState(false);

  useEffect(() => {
    if (props.pcba !== null && props.pcba !== undefined) {
      setPcba(props.pcba);
      setRevisionLocked(props.pcba.release_state === "Released");
    }
  }, [props.pcba]);

  const handleRowDoubleClick = (rowIndex, row) => {
    setSelectedFileUri(row.view_uri);
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
          prevFiles.map(file => 
            file.id === fileId || file.file_id === fileId
              ? { ...file, display_name: newDisplayName, title: newDisplayName } 
              : file
          )
        );
        
        // Trigger parent refresh
        handleRefresh();
      }
    } catch (error) {
      console.error("Error updating display name:", error);
      throw new Error("Failed to update display name");
    }
  };

  const showModal = (fileTypeArg) => {
    setModalFileType(fileTypeArg);
    $("#uploadFileModal").modal("show");
  };

  const handleRefresh = () => {
    props.setRefresh(true);
    setRefresh(true);
  };

  useEffect(() => {
    if ((props.pcba_id !== null && props.pcba_id !== undefined) || refresh) {
      fetchFileList(props.pcba_id)
        .then((res) => {
          if (res.status === 200) {
            const allFiles = res.data;

            const filteredFiles = allFiles.filter(
              (file) => file.is_archived === false
            );
            setFileList(filteredFiles);
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }
    if (refresh) {
      props.setRefresh(true);
      setRefresh(false);
    }
  }, [props.pcba_id, refresh]);

  const handleSaveFileCategory = async (fileId, newCategory) => {
    try {
      const response = await axios.patch(`/api/files/${fileId}/`, {
        file_category: newCategory
      }, tokenConfig());

      if (response.status === 200) {
        setFileList(prevFiles =>
          prevFiles.map(file =>
            (file.id === fileId || file.file_id === fileId)
              ? { ...file, file_category: newCategory }
              : file
          )
        );
        toast.success("Category updated");
      }
    } catch (error) {
      console.error("Error updating file category:", error);
      toast.error("Failed to update category");
    }
  };

  const handleDownloadZip = (category = null) => {
    const categoryParam = category ? `?category=${category}` : "";
    const url = `api/files/download/zip/pcbas/${props.pcba_id}/${categoryParam}`;
    const label = category || "all";
    axios.get(url, { ...tokenConfig(), responseType: "blob" })
      .then((res) => {
        const blob = new Blob([res.data], { type: "application/zip" });
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute("download", `pcbas_${props.pcba_id}_${label}_files.zip`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(link.href);
      })
      .catch((error) => {
        if (error.response?.status === 404) {
          toast.info(`No ${label} files found`);
        } else {
          toast.error("Failed to download files");
        }
      });
  };

  const hasProductionFiles = fileList.some(f => f.file_category === "production");

  const handleShowFileName = (value) => {
    setShowFileName(value);
  };

  const handleDownload = (row) => {
    getFile(row.uri)
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.setAttribute("download", row.file_name);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .catch((error) => {
        console.error("Failed to download file:", error);
      });
  };

  const rowDownloadFormatter = (row) => {
    return (
      <Row style={{ marginTop: "-0.5rem" }}>
        {row.file_name && (
          // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
          <img
            onClick={() => handleDownload(row)}
            width="25px"
            src="../../static/icons/file-download.svg"
            alt="Download"
            title="Download file"
          />
        )}
        {["AD", "MFG", "GBR", "SCH"].includes(row.type) && !revisionLocked && (
          <button
            className="btn btn-default"
            onClick={() => showModal(row.type)}
            type="button"
          >
            <img
              width="25px"
              src="../../static/icons/file-upload.svg"
              alt="Upload"
            />
          </button>
        )}
        {!revisionLocked && (
          <button
            type="button"
            className="btn btn-default"
            onClick={() => {
              setLoading(true);
              if (!confirm("Are you sure you want to delete this file?")) {
                return;
              }
              deleteFile(row.file_id)
                .then((res) => {
                  if (row.title === "Gerber Files") {
                    removeGerberFile(props.pcba_id)
                      .then((res) => {
                        if (res.status === 204) {
                          toast.success("Gerber Render removed successfully");
                        }
                      })
                      .finally(() => {
                        // Wait for request to finish before refreshing
                        handleRefresh();
                      });
                  }
                })
                .finally(() => {
                  if (row.title !== "Gerber Files") {
                    // Only need this refresh for non-Gerber files
                    handleRefresh();
                  }
                });
            }}
          >
            <img width="25px" src="../../static/icons/trash.svg" alt="Trash" />
          </button>
        )}
      </Row>
    );
  };

  const columns = [
    {
      key: "title",
      header: "Title",
      sort: true,
      formatter: (row) => {
        const isEditable = !revisionLocked;
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
            {row.created_at && (
              <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                {moment(row.created_at).format("MMM D, YYYY [at] HH:mm")}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "file_category",
      header: "Category",
      formatter: (row) => {
        // Special PCBA file types (AD, MFG, GBR, SCH) don't have file_category
        if (["AD", "MFG", "GBR", "SCH"].includes(row.type)) {
          return <span className="text-muted">{"\u2014"}</span>;
        }
        if (revisionLocked) {
          return <span>{CATEGORY_DISPLAY[row.file_category] || "Design"}</span>;
        }
        return (
          <InlineCategorySelect
            value={row.file_category || "design"}
            onSave={(newValue) => handleSaveFileCategory(row.file_id || row.id, newValue)}
          />
        );
      },
    },
    ...(showFileName
      ? [
          {
            key: "file_name",
            header: "File name",
            sort: true,
          },
        ]
      : []),
    {
      key: "uri",
      header: "",
      sort: false,
      formatter: rowDownloadFormatter,
    },
  ];

  const defaultSorted = [
    {
      key: "row_number",
      order: "desc",
    },
  ];

  return (
    <React.Fragment>
      <DokulyCard
        isCollapsed={!fileList || fileList.length === 0}
        expandText={"Add files"}
        isHidden={
          (!fileList || fileList.length === 0) &&
          props.pcba?.release_state === "Released"
        }
        hiddenText={"No files have been uploaded for this item."}
      >
        <Row>
          <Col>
            <CardTitle titleText={"Files"} />
          </Col>
          <Col className="d-flex align-items-center justify-content-end">
            {props.pcba?.release_state !== "Released" && (
              <GenericFileForm
                app={"pcbas"}
                objectId={props?.pcba_id}
                setRefresh={setRefresh}
                checkForGerberUpload
                gerberUpload={gerberUpload}
                setGerberUpload={setGerberUpload}
                handleRefresh={handleRefresh}
                setLoading={setLoading}
              />
            )}
            {fileList.length > 0 && (
              <button
                className="btn btn-sm btn-bg-transparent"
                type="button"
                onClick={() => handleDownloadZip()}
                title="Download all files as ZIP"
                style={{ fontWeight: 600 }}
              >
                <img
                  className="icon-dark mr-1"
                  src="../../static/icons/file-download.svg"
                  alt="icon"
                  width="14px"
                  style={{ verticalAlign: "text-bottom" }}
                />
                Download ZIP
              </button>
            )}
            {hasProductionFiles && (
              <button
                className="btn btn-sm btn-bg-transparent"
                type="button"
                onClick={() => handleDownloadZip("production")}
                title="Download production files as ZIP"
                style={{ fontWeight: 600 }}
              >
                <img
                  className="icon-dark mr-1"
                  src="../../static/icons/file-download.svg"
                  alt="icon"
                  width="14px"
                  style={{ verticalAlign: "text-bottom" }}
                />
                Production ZIP
              </button>
            )}
          </Col>
        </Row>
        <div className="row">
          <div className="col">
            {fileList?.length <= 1 && loading ? (
              loadingSpinner()
            ) : (
              <DokulyTable
                key={showFileName ? "showFileName" : "hideFileName"}
                data={fileList}
                columns={columns}
                onRowDoubleClick={handleRowDoubleClick}
                defaultSorted={defaultSorted}
                showCsvDownload={false}
                showSearch={true}
                renderChildrenNextToSearch={
                  <DokulyFormSection
                    as="check"
                    label="Show File Name"
                    value={showFileName}
                    onChange={handleShowFileName}
                    className="dokuly-checkbox mt-2"
                  />
                }
              />
            )}
          </div>
        </div>
      </DokulyCard>

      <FileViewerModal
        isOpen={isModalOpen}
        fileUri={selectedFileUri}
        fileName={selectedFileName}
        handleClose={handleCloseModal}
        parentEntityType="pcbas"
        parentEntityId={props.pcba_id}
        currentFileId={selectedFileId}
      />
    </React.Fragment>
  );
};

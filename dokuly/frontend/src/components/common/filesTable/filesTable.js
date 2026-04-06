import React, { useState, useEffect } from "react";
import { Col, Row } from "react-bootstrap";

import GenericFileForm from "./newFileForm";
import { deleteFile, get_files } from "../../files/functions/queries";
import FileViewerModal from "../FileViewerModal";
import DokulyTable from "../../dokuly_components/dokulyTable/dokulyTable";
import { getFile } from "./functions/queries";
import DokulyCard from "../../dokuly_components/dokulyCard";
import CardTitle from "../../dokuly_components/cardTitle";
import EditableTableCell from "../../dokuly_components/editableTableCell/editableTableCell";
import { toast } from "react-toastify";
import axios from "axios";
import { tokenConfig } from "../../../configs/auth";

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

export const downloadFileAsBlobForATags = (fileUri, fileName) => {
  if (!fileUri) {
    return;
  }
  getFile(fileUri)
    .then((res) => {
      const url = window.URL.createObjectURL(res);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName); // Use actual filename from backend
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link); // Clean up after triggering the download
      window.URL.revokeObjectURL(url);
    })
    .catch((error) => {
      if (error.response) {
        switch (error.response.status) {
          case 403:
            toast.error("You do not have permission to view this file.");
            break;
          case 401:
            toast.error("Your session has expired. Please log in again.");
            break;
          default:
            toast.error("Failed to load the file.");
        }
      } else {
        toast.error("Failed to load the file with a network error.");
      }
    });
};

export const FilesTable = (props, { release_state }) => {
  // Creates empty array for the reference document table.
  const [file_list, setFileList] = useState([]);

  const objectId = props?.objectId;
  const app = props?.app;
  const setRefresh = props.setRefresh;


  //___________________________________________________________________________________________________
  // File viewer.

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFileUri, setSelectedFileUri] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState(null);
  const [selectedDisplayName, setSelectedDisplayName] = useState(null);
  const [selectedFileId, setSelectedFileId] = useState(null);

  // New handler for the row double-click event
  const handleRowDoubleClick = (rowIndex) => {
    const row = file_list[rowIndex];
    const fileViewUri = `api/files/view/${row.id}/`;
    setSelectedFileUri(fileViewUri);
    setSelectedFileName(row.file_name);
    setSelectedDisplayName(row?.display_name);
    setSelectedFileId(row.id);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  //___________________________________________________________________________________________________
  // Function to handle saving display_name
  const handleSaveDisplayName = async (fileId, newDisplayName) => {
    try {
      const response = await axios.patch(`/api/files/${fileId}/`, {
        display_name: newDisplayName
      }, tokenConfig());
      
      if (response.status === 200) {
        // Update local state
        setFileList(prevFiles => 
          prevFiles.map(file => 
            file.id === fileId 
              ? { ...file, display_name: newDisplayName }
              : file
          )
        );
        
        // Trigger parent refresh if available 
        if (setRefresh) {
          setRefresh(true);
        }
      }
    } catch (error) {
      console.error("Error updating display name:", error);
      throw new Error("Failed to update display name");
    }
  };

  //___________________________________________________________________________________________________
  // Function to handle saving file_category
  const handleSaveFileCategory = async (fileId, newCategory) => {
    try {
      const response = await axios.patch(`/api/files/${fileId}/`, {
        file_category: newCategory
      }, tokenConfig());

      if (response.status === 200) {
        setFileList(prevFiles =>
          prevFiles.map(file =>
            file.id === fileId
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

  //___________________________________________________________________________________________________
  // Download files as ZIP — optional category filter
  const handleDownloadZip = (category = null) => {
    const categoryParam = category ? `?category=${category}` : "";
    const url = `api/files/download/zip/${app}/${objectId}/${categoryParam}`;
    const label = category || "all";
    axios.get(url, { ...tokenConfig(), responseType: "blob" })
      .then((res) => {
        const blob = new Blob([res.data], { type: "application/zip" });
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute("download", `${app}_${objectId}_${label}_files.zip`);
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

  // Recursive assembly production ZIP (includes BOM children)
  const handleDownloadAssemblyProductionZip = () => {
    const url = `api/files/download/assembly_production_zip/${objectId}/`;
    axios.get(url, { ...tokenConfig(), responseType: "blob" })
      .then((res) => {
        const blob = new Blob([res.data], { type: "application/zip" });
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute("download", `assembly_${objectId}_production_files.zip`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(link.href);
      })
      .catch((error) => {
        if (error.response?.status === 404) {
          toast.info("No production files found in assembly or BOM");
        } else {
          toast.error("Failed to download production files");
        }
      });
  };

  const hasProductionFiles = file_list.some(f => f.file_category === "production");

  //___________________________________________________________________________________________________

  useEffect(() => {
    if (props.file_id_list !== null && props.file_id_list !== undefined) {
      // This function filters out archived files from the file list.
      const filterOutArchivedFiles = (files) => {
        return files.filter((file) => file.archived !== 1);
      };
      
      get_files({ file_ids: props.file_id_list })
        .then((res) => {
          const unarchivedFiles = filterOutArchivedFiles(res.data); // Filter out archived files.
          setFileList(unarchivedFiles); // Set the file list with non-archived files.
        })
        .catch((error) => {
          toast.error("Error fetching files:", error);
        });
    }
  }, [props.file_id_list]);

  const rowDownloadFormatter = (row) => {
    return (
      <span>
        {
          // Download button
          row.file_name !== "" ? (
            <a
              // biome-ignore lint/a11y/useValidAnchor: Not using btn here.
              onClick={() => downloadFileAsBlobForATags(row.uri, row.file_name)}
            >
              <img
                width="25px"
                src="../../static/icons/file-download.svg"
                alt="icon"
              />
            </a>
          ) : (
            ""
          )
        }

        {props?.release_state !== "Released" && (
          <button
            className="btn btn-default"
            type="button"
            onClick={() => {
              if (
                window.confirm("Are you sure you want to delete this file?")
              ) {
                deleteFile(row.id)
                  .then((res) => {
                    if (res.status === 200) {
                      props.setRefresh(true);
                    }
                  })
                  .catch((error) => {
                    console.error("Archive operation failed:", error);
                  });
              }
            }}
          >
            <img width="25px" src="../../static/icons/trash.svg" alt="icon" />
          </button>
        )}
      </span>
    );
  };

  // Table columns.
  const columns = [
    {
      key: "display_name",
      header: "Title",
      formatter: (row) => {
        const isEditable = props?.release_state !== "Released";
        
        return (
          <EditableTableCell
            value={row.display_name || ""}
            isEditable={isEditable}
            onSave={(newValue) => handleSaveDisplayName(row.id, newValue)}
            placeholder="Display name"
            allowEmpty={false}
            successMessage="Display name updated successfully"
          />
        );
      },
    },

    {
      key: "file_category",
      header: "Category",
      formatter: (row) => {
        const isEditable = props?.release_state !== "Released";
        const displayMap = { design: "Design", production: "Production", other: "Other" };
        if (!isEditable) {
          return <span>{displayMap[row.file_category] || "Design"}</span>;
        }
        return (
          <InlineCategorySelect
            value={row.file_category || "design"}
            onSave={(newValue) => handleSaveFileCategory(row.id, newValue)}
          />
        );
      },
    },
    {
      key: "file_type",
      header: "File Type",
      formatter: (row) => {
        const fileExtenstion = row.file_name.split(".").pop();
        return <span>{fileExtenstion}</span>;
      },
    },
    {
      key: "id",
      header: "",
      formatter: rowDownloadFormatter,
    },
  ];

  return (
    <Col className="p-0" style={{ marginRight: "2rem" }}>
      <DokulyCard
        isCollapsed={!file_list || file_list.length === 0}
        expandText={"Add files"}
        isHidden={
          (!file_list || file_list.length === 0) &&
          props?.release_state === "Released"
        }
        hiddenText={"No files have been uploaded for this item."}
      >
        <Row>
          <Col>
            <CardTitle titleText={"Files"} />
          </Col>
          <Col className="d-flex align-items-center justify-content-end">
            {props?.release_state !== "Released" && (
              <GenericFileForm
                app={app}
                objectId={objectId}
                setRefresh={setRefresh}
              />
            )}
            {file_list.length > 0 && (
              <button
                className="btn btn-sm btn-bg-transparent"
                type="button"
                onClick={() => handleDownloadZip()}
                title="Download all files attached to this item as a single ZIP"
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
                title="Download only files categorized as Production"
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
            {app === "Assembly" && (
              <button
                className="btn btn-sm btn-bg-transparent"
                type="button"
                onClick={handleDownloadAssemblyProductionZip}
                title="Download production files from this assembly and all parts, PCBAs, and sub-assemblies in the BOM"
                style={{ fontWeight: 600 }}
              >
                <img
                  className="icon-dark mr-1"
                  src="../../static/icons/file-download.svg"
                  alt="icon"
                  width="14px"
                  style={{ verticalAlign: "text-bottom" }}
                />
                BOM Production ZIP
              </button>
            )}
          </Col>
        </Row>

        <div className="row">
          <div className="col">
            <div>
              <div>
                {" "}
                <DokulyTable
                  data={file_list}
                  columns={columns}
                  showCsvDownload={false}
                  showPagination={false}
                  showSearch={false}
                  onRowClick={() => {}} // Provide empty function to prevent errors
                  onRowDoubleClick={handleRowDoubleClick}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col">
            <p className="text-muted mb-1">
              <small>
                <b>Double-click</b> a row to view the file.
              </small>
            </p>
            {(file_list.length > 0 || app === "Assembly") && (
              <p className="text-muted mb-0">
                <small>
                  <b>Download ZIP</b> downloads all files.
                  {hasProductionFiles && <> <b>Production ZIP</b> downloads only production files.</>}
                  {app === "Assembly" && <> <b>BOM Production ZIP</b> includes production files from all parts and sub-assemblies in the BOM.</>}
                </small>
              </p>
            )}
          </div>
        </div>
      </DokulyCard>

      <FileViewerModal
        isOpen={isModalOpen}
        fileUri={selectedFileUri}
        fileName={selectedFileName}
        displayName={selectedDisplayName}
        handleClose={handleCloseModal}
        parentEntityType={app}
        parentEntityId={objectId}
        currentFileId={selectedFileId}
      />
    </Col>
  );
};

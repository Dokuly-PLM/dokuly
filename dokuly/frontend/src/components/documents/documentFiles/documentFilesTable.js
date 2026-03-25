import React, { useState, useEffect } from "react";
import { fetchFileList } from "../functions/queries";
import GenericFileForm from "../../common/filesTable/newFileForm";
import { deleteFile } from "../../files/functions/queries";
import { loadingSpinner } from "../../admin/functions/helperFunctions";
import FileViewerModal from "../../common/FileViewerModal";
import DokulyTable from "../../dokuly_components/dokulyTable/dokulyTable";
import { getFile } from "../../common/filesTable/functions/queries";
import { toast } from "react-toastify";
import { Row, Col } from "react-bootstrap";
import DokulyCard from "../../dokuly_components/dokulyCard";
import CardTitle from "../../dokuly_components/cardTitle";

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

  useEffect(() => {
    if (props.db_item !== null && props.db_item !== undefined) {
      setDocument(props.db_item);
      setRevisionLocked(props.db_item.release_state === "Released");
    }
  }, [props.db_item]);

  const handleRowDoubleClick = (rowIndex, row) => {
    // For special document files, use the uri directly
    if (row.type === "SHARED_DOC_LINK") {
      window.open(row.uri, "_blank");
      return;
    }
    
    // For other files, open the viewer modal
    const viewUri = row.uri.includes("/download/")
      ? row.uri.replace("/download/", "/view/")
      : row.uri;
    setSelectedFileUri(viewUri);
    setSelectedFileName(row.file_name);
    setSelectedFileId(row.file_id || row.id);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
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
        toast.error("Failed to download file");
      });
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

  const rowActionsFormatter = (row) => {
    return (
      <Row style={{ marginTop: "-0.5rem" }}>
        {row.file_name && row.type !== "SHARED_DOC_LINK" && (
          // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
          <img
            onClick={() => handleDownload(row)}
            width="25px"
            src="../../static/icons/file-download.svg"
            alt="Download"
            title="Download file"
            style={{ cursor: "pointer" }}
          />
        )}
        {row.type === "SHARED_DOC_LINK" && (
          // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
          <img
            onClick={() => window.open(row.uri, "_blank")}
            width="25px"
            src="../../static/icons/link.svg"
            alt="Open link"
            title="Open shared link"
            style={{ cursor: "pointer" }}
          />
        )}
        {!revisionLocked && (row.type === "GENERIC" || row.type === "PDF_RAW" || row.type === "PDF") && (
          <button
            type="button"
            className="btn btn-default"
            onClick={() => handleDelete(row)}
          >
            <img width="25px" src="../../static/icons/trash.svg" alt="Delete" />
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
    },
    {
      key: "file_name",
      header: "File name",
      sort: true,
    },
    {
      key: "uri",
      header: "",
      sort: false,
      formatter: rowActionsFormatter,
    },
  ];

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
            ) : (
              <DokulyTable
                data={fileList}
                columns={columns}
                onRowDoubleClick={handleRowDoubleClick}
                showCsvDownload={false}
                showSearch={true}
              />
            )}
          </div>
        </div>
        <div className="row">
          <div className="col">
            <p className="text-muted">
              <small>
                <b>Double-click</b> a row to view the file.
              </small>
            </p>
          </div>
        </div>
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

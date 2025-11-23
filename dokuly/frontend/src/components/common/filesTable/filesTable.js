import React, { useState, useEffect } from "react";
import { Col, Row } from "react-bootstrap";

import GenericFileForm from "./newFileForm";
import { deleteFile, get_files } from "../../files/functions/queries";
import FileViewerModal from "../FileViewerModal";
import DokulyTable from "../../dokuly_components/dokulyTable/dokulyTable";
import { getFile } from "./functions/queries";
import DokulyCard from "../../dokuly_components/dokulyCard";
import CardTitle from "../../dokuly_components/cardTitle";
import { toast } from "react-toastify";

export const downloadFileAsBlobForATags = (fileUri, fileName) => {
  if (!fileUri) {
    return;
  }
  getFile(fileUri)
    .then((res) => {
      const url = window.URL.createObjectURL(res);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName); // Use row.file_name as the filename
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
          <Col>
            {release_state !== "Released" && (
              <GenericFileForm
                app={app}
                objectId={objectId}
                setRefresh={setRefresh}
              />
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
        displayName={selectedDisplayName}
        handleClose={handleCloseModal}
        parentEntityType={app}
        parentEntityId={objectId}
        currentFileId={selectedFileId}
      />
    </Col>
  );
};

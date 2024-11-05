import React, { useState, useEffect } from "react";

import { fetchFileList, removeGerberFile } from "../../functions/queries";
import GenericFileForm from "../../../common/filesTable/newFileForm";
import { deleteFile } from "../../../files/functions/queries";

import { loadingSpinner } from "../../../admin/functions/helperFunctions";

import FileViewerModal from "../../../common/FileViewerModal";
import DokulyTable from "../../../dokuly_components/dokulyTable/dokulyTable";
import { getFile } from "../../../common/filesTable/functions/queries";
import { toast } from "react-toastify";
import { Form, Row } from "react-bootstrap";
import DokulyFormSection from "../../../dokuly_components/dokulyForm/dokulyFormSection";

export const PcbaFilesTable = (props) => {
  const [fileList, setFileList] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const [modalFileType, setModalFileType] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFileUri, setSelectedFileUri] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState(null);
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
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
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
        {(!revisionLocked || row.type === "Generic") && (
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
      <div className="card-body m-3 card rounded">
        <div className="row">
          <div className="col col-8">
            <h5>
              <b>Files</b>
            </h5>
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
          </div>
        </div>
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
      </div>

      <FileViewerModal
        isOpen={isModalOpen}
        fileUri={selectedFileUri}
        fileName={selectedFileName}
        handleClose={handleCloseModal}
      />
    </React.Fragment>
  );
};

import React, { useState, useEffect } from "react";
import { uploadFile, fetchFileList } from "../functions/queries";
import DokulyTable from "../../dokuly_components/dokulyTable/dokulyTable";
import { getFile } from "../../common/filesTable/functions/queries";
import { loadingSpinner } from "../../admin/functions/helperFunctions";
/**
 * Files table.
 * Displays the files attached to an object, abstracting away the particular db fields.
 *
 * @param {*} props must contain db_item
 * @returns Button with modal for uploading Extra files.
 */
export const FilesTable = (props) => {
  // Creates empty array for the reference document table.
  const [file_list, setFileList] = useState([]);
  const [refresh, setRefresh] = useState(false);

  const [file_type, setFileType] = useState(
    file_type !== null && props.file_type !== undefined ? props.file_type : null
  );

  const [modal_file_type, setModalFileType] = useState(null);

  useEffect(() => {
    if (props.file_type !== null && props.file_type !== undefined) {
      setFileType(props.file_type);
    }
  }, [props.file_type]);

  const [db_item, setDbItem] = useState(
    props.db_item !== null && props.db_item !== undefined ? props.db_item : null
  );

  useEffect(() => {
    if (props.db_item !== null && props.db_item !== undefined) {
      setDbItem(props.db_item);
    }
  }, [props.db_item]);

  // Const telling whether the db_item is in a locked state (Released) or not.
  const [revision_locked, setRevisionLocked] = useState(true);

  useEffect(() => {
    if (db_item != null && db_item !== undefined) {
      db_item.release_state === "Released"
        ? setRevisionLocked(true)
        : setRevisionLocked(false);
    }
  }, [db_item]);

  const [file, setFile] = useState(null);

  const handleFileUpload = ({ target }) => {
    setFile(target.files[0]);
  };

  const showModal = (file_type_arg) => {
    setFile(null);
    setModalFileType(file_type_arg);
    $("#uploadFileModal").modal("show");
  };

  const onSubmit = () => {
    $("#uploadFileModal").modal("hide");

    const data = new FormData();
    // Fields used by the view.
    data.append("id", props.db_item?.id);
    data.append("file", file);
    data.append("file_type", modal_file_type);

    // Push file to DB
    uploadFile(data);
    setRefresh(true);
  };

  useEffect(() => {
    if (props?.refresh === true) {
      setRefresh(true);
    }
    if (refresh === true) {
      setRefresh(false);
    }
    if (props.db_item?.id !== null && props.db_item?.id !== undefined) {
      fetchFileList(props.db_item?.id).then((res) => {
        setFileList(res.data);
      });
    }
  }, [props.db_item.id, props.refresh, refresh]);

  // Formatter implemneting custom icons for each file type.
  const iconFormatter = (cell, row) => {
    let iconPath = "";
    switch (row.type) {
      case "SOURCE":
        iconPath = "../../static/icons/file-text.svg";
        break;
      case "PDF_RAW":
        iconPath = "../../static/icons/file-text.svg";
        break;
      case "PDF":
        iconPath = "../../static/icons/file-text.svg";
        break;
      case "SHARED_DOC_LINK":
        iconPath = "../../static/icons/file-text.svg";
        break;
      default:
        iconPath = "../../static/icons/zip_folder.svg";
    }
    return (
      <span>
        <img
          style={{ marginLeft: "0.5rem" }}
          width="25px"
          src={iconPath}
          alt="icon"
        />
      </span>
    );
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
        document.body.removeChild(link); // Clean up by removing the link after triggering the download
      })
      .catch((error) => {
        console.error("Failed to download file:", error);
      });
  };

  const rowDownloadFormatter = (row) => {
    return (
      <span>
        {row.type === "SHARED_DOC_LINK" ? (
          <a href={row.uri} download>
            <img width="25px" src="../../static/icons/link.svg" alt="icon" />
          </a>
        ) : // Download button
        row.file_name !== "" ? (
          // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
          <img
            onClick={() => handleDownload(row)}
            width="25px"
            src="../../static/icons/file-download.svg"
            alt="icon"
          />
        ) : (
          ""
        )}
        {
          // TODO add file upload within the table.
          // It is deactivated due to a srange bug where the uploaded file is
          /*row.type == "SOURCE" || row.type == "PDF_RAW"*/ false ? (
            revision_locked ? (
              ""
            ) : (
              <button
                type="button"
                className="btn btn-default"
                onClick={() => showModal(row.type)}
                //data-toggle="modal"
                //data-target="#uploadFileModal"
              >
                <img
                  width="25px"
                  src="../../static/icons/file-upload.svg"
                  alt="icon"
                  //className="icon-tabler"
                />
              </button>
            )
          ) : (
            ""
          )
        }
      </span>
    );
  };

  // Table columns.
  const columns = [
    /* 
    {
      dataField: "type",
      text: " ",
      formatter: iconFormatter,
    },*/
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
    // Upload/Download column
    {
      key: "uri",
      header: "",
      sort: false,
      formatter: rowDownloadFormatter,
    },
  ];

  return (
    <React.Fragment>
      <div className="card-body m-3 card rounded">
        <div className="row">
          <div className="col">
            <h5>
              <b>Files</b>
            </h5>
          </div>
        </div>
        <div className="row">
          <div className="col">
            {props?.loading ? (
              loadingSpinner()
            ) : (
              <DokulyTable
                data={file_list}
                columns={columns}
                showCsvDownload={false}
                showPagination={false}
                showSearch={false}
              />
            )}
          </div>
        </div>
      </div>

      {/* <!-- Modal --> */}
      <div
        className="modal fade"
        role="dialog"
        id="uploadFileModal"
        tabIndex="-1"
        aria-labelledby="uploadFileModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="uploadFileModalLabel">
                Upload {modal_file_type} file
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
              <div>
                <label>Upload file</label>
                <div className="custom-file mb-3">
                  <input
                    value={""}
                    type="file"
                    className="custom-file-input"
                    id="customFile"
                    name="db_item_file"
                    onChange={handleFileUpload}
                    style={{ display: "none" }}
                  />
                  <label className="custom-file-label" htmlFor="customFile">
                    {file ? file.name : "Select file"}
                  </label>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-danger"
                data-dismiss="modal"
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-info"
                onClick={() => onSubmit()}
              >
                Upload file
              </button>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

import axios from "axios";
import moment from "moment";
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useSpring, animated, config } from "react-spring";
import { tokenConfig } from "../../configs/auth";
import { formatServerURL } from "../common/functions";
import { formatNewServerUrl } from "./functions/productionHelpers";
import {
  newProdFile,
  fetchFilesQ,
  createProdFileConnection,
  uploadFile,
  fetchSingleFile,
} from "./functions/queries";

const ProductionFiles = (props) => {
  // URL logic
  let locationSplit = window.location.href.toString().split("/");
  let currentAssemblyID = locationSplit[locationSplit.length - 1];
  let pcbaID = locationSplit[locationSplit.length - 3];

  // States
  const [refresh, setRefresh] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewOlderFiles, setViewOlderFiles] = useState(false);
  const [file, setFile] = useState(null);
  const [selectedSoftware, setSelectedSoftware] = useState(
    props.selectedSoftware !== null && props.selectedSoftware !== undefined
      ? props.selectedSoftware
      : -1
  );
  const [internal, setInternal] = useState(1);
  const [gitLink, setGitLink] = useState("");
  const [softwareName, setSoftwareName] = useState("");
  const [softwareV, setSoftwareV] = useState("");
  const [comment, setComment] = useState("");
  const [softwarePlatform, setSoftwarePlatform] = useState("Github");
  const [softwareCommitHash, setSoftwareCommitHash] = useState("");
  const [files, setFiles] = useState(
    props.files !== null && props.files !== undefined ? props.files : []
  );
  const [display_name, setDisplayName] = useState("");
  const [production, setProduction] = useState(props.production);
  const [fileToView, setFileToView] = useState({});

  const fade = useSpring({ opacity: open ? 1 : 0, config: config.slow });

  const fadeReverse = useSpring({ opacity: open ? 0 : 1, config: config.slow });

  const submit = () => {
    let currentName = "";
    if (
      display_name == null ||
      display_name == undefined ||
      display_name == "" ||
      display_name.length == 0
    ) {
      currentName = file?.name;
    } else {
      currentName = display_name;
    }
    if (internal == 1 || internal == "1") {
      if (
        gitLink == "" ||
        gitLink == null ||
        gitLink == undefined ||
        gitLink.length == 0
      ) {
        toast.error("Enter a valid GitHub link");
        return;
      }
    } else {
      if (
        softwareName == "" ||
        softwareName == null ||
        softwareName == undefined ||
        softwareName.length == 0
      ) {
        toast.error("Enter a valid software name");
        return;
      }
      if (
        softwareV == "" ||
        softwareV == null ||
        softwareV == undefined ||
        softwareV.length == 0
      ) {
        toast.error("Enter a valid software version");
        return;
      }
      if (
        softwareCommitHash == "" ||
        softwareCommitHash == null ||
        softwareCommitHash == undefined ||
        softwareCommitHash.length == 0
      ) {
        toast.error("Enter a valid commit hash");
        return;
      }
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("display_name", currentName);
    formData.append("name", file.name);
    uploadFile(formData).then((res) => {
      let software_array = "";
      if (internal == 1 || internal == "1") {
        software_array = {
          gitLink: gitLink,
          softwareV: softwareV,
          file_id: res.data.id,
          internal: internal,
          comment: comment,
          file_display_name: display_name,
          update_timestamp: moment().format("YYYY-MM-DD, H:mm:ss"),
        };
      } else {
        software_array = {
          softwareV: softwareV,
          softwarePlatform: softwarePlatform,
          softwareCommitHash: softwareCommitHash,
          softwareName: softwareName,
          file_id: res.data.id,
          comment: comment,
          internal: internal,
          file_display_name: display_name,
          update_timestamp: moment().format("YYYY-MM-DD, H:mm:ss"),
        };
      }
      const putData = {
        fileData: res.data,
        software_array: JSON.stringify(software_array),
        internal_software: internal,
      };
      let prodId = -1;
      if (production?.id !== null && production?.id !== undefined) {
        prodId = production?.id;
      } else {
        prodId = currentAssemblyID;
      }
      createProdFileConnection(prodId, putData)
        .then((res) => {
          const childRes = {
            newData: true,
            filesData: res.data?.files,
            prodData: res.data?.prod,
          };
          props.childToParent(childRes);
          setFiles(res.data?.files);
        })
        .finally(() => {
          setOpen(false);
          resetStates();
          setRefresh(true);
        });
    });
  };

  const resetStates = () => {
    setGitLink("");
    setComment("");
    setDisplayName("");
    setFile(null);
    setSoftwareCommitHash("");
    setSoftwareName("");
    setSoftwarePlatform("Github");
    setSoftwareV("");
  };

  useEffect(() => {
    if (
      props?.selectedSoftware !== null &&
      props?.selectedSoftware !== undefined
    ) {
      if (selectedSoftware !== props?.selectedSoftware) {
        setSelectedSoftware(props.selectedSoftware);
      }
    }
    if (props?.files !== null && props?.files !== undefined) {
      if (files !== props?.files) {
        setFiles(props.files);
      }
    }
    if (files == null) {
      if (production !== null && production !== undefined) {
        fetchFilesQ(production.id, "Production")
          .then((res) => {
            setFiles(res.data);
          })
          .finally(() => {
            setLoading(false);
          });
      }
    } else {
      setLoading(false);
    }
    if (refresh) {
    }
    setRefresh(false);
  }, [props, refresh]);

  if (loading) {
    return (
      <div className="d-flex m-5 dokuly-primary justify-content-center">
        <div className="spinner-border" role="status"></div>
      </div>
    );
  }

  if (open) {
    return (
      <div
        className="card-body bg-white m-2 card rounded shadow"
        style={{ width: "40rem" }}
      >
        <animated.div style={fade}>
          <div className="row">
            <div className="col-md-auto">
              <a>
                <b>Upload New File</b>
              </a>
            </div>
            <div className="col-md-auto">
              <div className="row">
                <button
                  className="btn btn-info btn-sm"
                  onClick={() => {
                    submit();
                  }}
                >
                  Submit
                </button>
                <button
                  className="btn btn-danger btn-sm ml-2"
                  onClick={() => {
                    setOpen(false);
                    resetStates();
                    setRefresh(true);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
          <div className="form-group" style={{ marginTop: "1rem" }}>
            <div className="custom-file mb-3">
              <input
                className="custom-file-input"
                id="customFile"
                type="file"
                name="document_file"
                onChange={(e) => setFile(e.target.files[0])}
              />
              <label className="custom-file-label" htmlFor="customFile">
                {file?.name !== undefined
                  ? file?.name
                  : "Upload ELF / Software part files here"}
              </label>
            </div>
          </div>
          <div className="form-group">
            <input
              className="form-control"
              type="text"
              placeholder="Enter a file display name..."
              onChange={(e) => {
                if (e.target.value.length > 50) {
                  toast.error("Max 50 characters for display name");
                  return;
                }
                setDisplayName(e.target.value);
              }}
            />
          </div>
          <div className="form-group">
            <select
              className="form-control"
              name="release_state"
              value={internal}
              onChange={(e) => {
                setInternal(e.target.value);
                setRefresh(true);
              }}
            >
              <option value={1} selected>
                Internal
              </option>
              <option value={0}>External</option>
            </select>
          </div>
          {internal === 1 || internal === "1" ? (
            <div>
              <div className="form-group">
                <label>Git link</label>
                <input
                  className="form-control"
                  type="text"
                  name="gitlink"
                  value={gitLink}
                  onChange={(e) => {
                    setGitLink(e.target.value);
                    setRefresh(true);
                  }}
                />
              </div>
              <div className="form-group">
                <label>Release version</label>
                <input
                  className="form-control"
                  type="text"
                  name="hash"
                  value={softwareV}
                  onChange={(e) => setSoftwareV(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div>
              <div className="form-group">
                <select
                  className="form-control"
                  name="platform"
                  value={softwarePlatform}
                  onChange={(e) => {
                    setSoftwarePlatform(e.target.value);
                  }}
                >
                  <option value={"Github"} selected>
                    Github
                  </option>
                  <option value={"Gitlab"}>Gitlab</option>
                  <option value={"Gitea"}>Gitea</option>
                  <option value={"Bit-Bucket"}>Bit-Bucket</option>
                  <option value={"Other"}>Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Software name</label>
                <input
                  className="form-control"
                  type="text"
                  name="name"
                  value={softwareName}
                  onChange={(e) => setSoftwareName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Commit hash</label>
                <input
                  className="form-control"
                  type="text"
                  name="hash"
                  value={softwareCommitHash}
                  onChange={(e) => setSoftwareCommitHash(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Release version</label>
                <input
                  className="form-control"
                  type="text"
                  name="hash"
                  value={softwareV}
                  onChange={(e) => setSoftwareV(e.target.value)}
                />
              </div>
            </div>
          )}
          <div className="form-group">
            <label>Comments</label>
            <textarea
              className="form-control"
              type="text"
              name="description"
              onChange={(e) => setComment(e.target.value)}
              value={comment}
            />
          </div>
        </animated.div>
      </div>
    );
  }

  return (
    <div
      className="card-body bg-white m-2 card rounded shadow"
      style={{ width: "40rem" }}
    >
      <animated.div style={fadeReverse}>
        <div className="row">
          <div className="col-md-auto">
            <a>
              <b>Software Configuration Files</b>
            </a>
          </div>
          <div className="col-md-auto">
            <button
              className="btn btn-info btn-sm"
              onClick={() => {
                setOpen(true);
                setRefresh(true);
              }}
            >
              <img
                src="../../static/icons/plus.svg"
                className="icon-tabler"
                alt="icon"
              />
            </button>
          </div>
        </div>
        <div>
          {files !== null && files !== undefined && files?.length !== 0 ? (
            <ul className="list-group list-group-flush">
              {files.map((file, index) => {
                if (!viewOlderFiles) {
                  if (file.active !== 1) {
                    return;
                  }
                }
                if (file !== null) {
                  return (
                    <li className="list-group-item" key={index}>
                      <div className="row">
                        <div className="col">
                          <a href={file.uri} download>
                            <img
                              className="icon-tabler-dark"
                              width="25px"
                              src="../../static/icons/file-download.svg"
                              alt="icon"
                            />{" "}
                            {file?.display_name !== "" &&
                            file?.display_name !== null &&
                            file?.display_name !== undefined
                              ? file.display_name
                              : file
                                  .toString()
                                  .split("/")
                                  [file.split("/").length - 1].slice(0, 30)
                                  .replace("%20", " ")}
                          </a>
                        </div>
                        <div className="col-md-auto">
                          {selectedSoftware?.id !== null &&
                          selectedSoftware?.id !== undefined &&
                          selectedSoftware?.id === file?.id ? (
                            <img
                              data-toggle="tooltip"
                              data-placement="right"
                              title="Selected software part"
                              src="../../../static/icons/check.svg"
                              style={{
                                filter:
                                  "invert(81%) sepia(36%) saturate(4745%) hue-rotate(93deg) brightness(106%) contrast(101%)",
                              }}
                              className="ml-1"
                              width="30px"
                              height="30px"
                            />
                          ) : (
                            <button
                              className="btn btn-sm btn-info"
                              onClick={() => {
                                setSelectedSoftware(file);
                                const childRes = {
                                  newSelected: true,
                                  data: file,
                                };
                                props.childToParent(childRes);
                                setRefresh(true);
                              }}
                            >
                              Select Software
                            </button>
                          )}
                        </div>
                        <div className="col-md-auto">
                          <button
                            className="btn btn-sm btn-secondary"
                            style={{ marginRight: "1rem" }}
                            disabled
                          >
                            Replace File
                          </button>
                        </div>
                        <div className="col-md-auto">
                          {file?.download_count !== undefined &&
                            file?.download_count !== null && (
                              <a>Download count: {file?.download_count}</a>
                            )}
                        </div>
                      </div>
                    </li>
                  );
                }
              })}
            </ul>
          ) : (
            <a>No files found</a>
          )}
        </div>
      </animated.div>
    </div>
  );
};

export default ProductionFiles;

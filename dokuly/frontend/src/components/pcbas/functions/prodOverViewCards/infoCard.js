import moment from "moment";
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useSpring, animated, config } from "react-spring";
import { editSoftwareInfo, fetchSingleProd } from "../queries";
import { getHistoryDataFromProps } from "../productionHelpers";

const InfoCard = (props) => {
  // URL logic
  let locationSplit = window.location.href.toString().split("/");
  let currentAssemblyID = locationSplit[locationSplit.length - 1];
  let pcbaID = locationSplit[locationSplit.length - 3];

  const fade = useSpring({
    opacity: props.formOpen ? 0 : 1,
    config: config.molasses,
  });

  const [refresh, setRefresh] = useState(false);
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState(1);
  const [replaceEntry, setReplaceEntry] = useState({ id: -1 });
  const [dataIndex, setDataIndex] = useState(-1);
  const [gitLink, setGitLink] = useState("");
  const [softwareName, setSoftwareName] = useState("");
  const [softwareV, setSoftwareV] = useState("");
  const [comment, setComment] = useState("");
  const [softwarePlatform, setSoftwarePlatform] = useState("Github");
  const [softwareCommitHash, setSoftwareCommitHash] = useState("");
  const [display_name, setDisplayName] = useState("");
  const [loading, setLoading] = useState(
    props.prod !== null && props.prod !== undefined ? false : true,
  );
  const [prodDetailed, setProdDetailed] = useState(
    props.prod !== null && props.prod !== undefined ? props.prod : null,
  );
  const [historyDetailed, setHistoryDetailed] = useState(
    props.history !== null && props.history !== undefined
      ? props.history
      : null,
  );

  const getData = (valName) => {
    if (valName === "sub_production") {
      return prodDetailed[`${valName}`] ? "Yes" : "No";
    }
    if (valName === "internal") {
      if (
        prodDetailed[`${valName}`] == 1 ||
        prodDetailed[`${valName}`] == "1"
      ) {
        return "Yes";
      }
      return "No";
    }
    return prodDetailed[`${valName}`];
  };

  const submit = () => {
    if (getHistoryData("internal") === "Yes") {
      if (
        getHistoryData("softwareV") === softwareV &&
        getHistoryData("gitLink") === gitLink &&
        getData("display_name") === display_name &&
        getHistoryData("comment") === comment
      ) {
        toast.error(
          "Nothing has been updated, change a field before submitting",
        );
        return;
      }
    } else {
      if (
        getHistoryData("softwarePlatform") === softwarePlatform &&
        getHistoryData("softwareCommitHash") === softwareCommitHash &&
        getHistoryData("softwareName") === softwareName &&
        getData("display_name") == display_name
      ) {
        toast.error(
          "Nothing has been updated, change a field before submitting",
        );
        return;
      }
    }
    let software_array = "";
    if (internal == 1 || internal == "1") {
      software_array = {
        gitLink: gitLink,
        softwareV: softwareV,
        file_id: prodDetailed.id,
        internal: internal,
        comment: comment.trimLeft().trimRight(),
        file_display_name: display_name,
        update_timestamp: moment().format("YYYY-MM-DD, H:mm:ss"),
      };
    } else {
      software_array = {
        softwareV: softwareV,
        softwarePlatform: softwarePlatform,
        softwareCommitHash: softwareCommitHash,
        softwareName: softwareName,
        file_id: prodDetailed.id,
        internal: internal,
        comment: comment.trimLeft().trimRight(),
        file_display_name: display_name,
        update_timestamp: moment().format("YYYY-MM-DD, H:mm:ss"),
      };
    }
    const data = {
      software_array: JSON.stringify(software_array),
      display_name: display_name,
    };
    editSoftwareInfo(currentAssemblyID, prodDetailed.id, data)
      .then((res) => {
        const childRes = {
          newFile: true,
          fileData: res.data.file,
          prodData: res.data.prod,
          filesData: res.data.files,
        };
        setHistoryDetailed(res.data?.prod?.software_history);
        setProdDetailed(res.data.file);
        props.childToParent(childRes);
      })
      .finally(() => {
        setOpen(false);
        setRefresh(true);
      });
  };

  const handleOpen = (value) => {
    setOpen(value);
    setDisplayName(getData("display_name"));
    if (props.usesHistoryEntries) {
      setComment(getHistoryData("comment"));
      let internalCheck = getHistoryData("internal");
      setInternal(internalCheck === "Yes" ? 1 : 0);
      setSoftwareV(getHistoryData("softwareV"));
      if (getHistoryData("internal") === "Yes") {
        setGitLink(getHistoryData("gitLink"));
      } else {
        setSoftwareName(getHistoryData("softwareName"));
        setSoftwarePlatform(getHistoryData("softwarePlatform"));
        setSoftwareCommitHash(getHistoryData("softwareCommitHash"));
      }
    }
  };

  const checkSameObject = (parsed1, parsed2) => {
    if (parsed1 == parsed2) {
      return false;
    }
    return true;
  };

  const getEntries = () => {
    let entries = [];
    if (historyDetailed?.length > 0) {
      for (let i = 0; i < historyDetailed?.length; i++) {
        if (prodDetailed?.uri !== null && prodDetailed?.uri !== undefined) {
          let parsed = JSON.parse(historyDetailed[i]);
          if (parseInt(parsed?.file_id) === parseInt(prodDetailed?.id)) {
            entries.push(parsed);
          }
        }
      }
    }
    if (entries.length > 0) {
      return entries;
    }
    return -1;
  };

  const getHistoryData = (valName) => {
    let currentEntires = getEntries();
    if (currentEntires !== -1) {
      let lastEntry = currentEntires[currentEntires.length - 1];
      if (valName === "internal") {
        if (lastEntry[`${valName}`] == 1 || lastEntry[`${valName}`] == "1") {
          return "Yes";
        }
        return "No";
      }
    }
    let newestIndex = 0;
    if (
      dataIndex !== -1 &&
      dataIndex < historyDetailed.length &&
      historyDetailed.length > 1
    ) {
      let parsed = JSON.parse(historyDetailed[dataIndex]);
      if (prodDetailed?.uri !== null && prodDetailed?.uri !== undefined) {
        if (prodDetailed?.id === parsed.file_id) {
          if (valName === "internal") {
            if (parsed[`${valName}`] == 1 || parsed[`${valName}`] == "1") {
              return "Yes";
            }
            return "No";
          }
          return parsed[`${valName}`];
        }
      }
    }
    if (historyDetailed?.length > 0) {
      while (true) {
        let foundNew = false;
        for (let i = 0; i < historyDetailed.length; i++) {
          let parsed1 = JSON.parse(historyDetailed[i]);
          let parsed2 = JSON.parse(historyDetailed[newestIndex]);
          if (
            prodDetailed?.id === parsed1.file_id &&
            prodDetailed?.id === parsed2.file_id
          ) {
            if (prodDetailed?.uri !== null && prodDetailed?.uri !== undefined) {
              if (checkSameObject(parsed1, parsed2)) {
                let timestamp1 = moment(
                  parsed1?.update_timestamp.split(",")[0],
                );
                let timestamp2 = moment(
                  parsed2?.update_timestamp.split(",")[0],
                );
                let hourstamp1 = parsed1?.update_timestamp
                  .split(",")[1]
                  .trimLeft();
                let hourstamp2 = parsed2?.update_timestamp
                  .split(",")[1]
                  .trimLeft();
                let diff = timestamp1.diff(timestamp2);
                if (diff > 0) {
                  newestIndex = i;
                  setDataIndex(newestIndex);
                  foundNew = true;
                }
                if (diff == 0) {
                  let hours1 = parseInt(hourstamp1.split(":")[0]);
                  let hours2 = parseInt(hourstamp2.split(":")[0]);
                  let minutes1 = parseInt(hourstamp1.split(":")[1]);
                  let minutes2 = parseInt(hourstamp2.split(":")[1]);
                  let seconds1 = parseInt(hourstamp1.split(":")[2]);
                  let seconds2 = parseInt(hourstamp2.split(":")[2]);
                  if (hours1 > hours2) {
                    newestIndex = i;
                    setDataIndex(newestIndex);
                    foundNew = true;
                  }
                  if (hours1 == hours2) {
                    if (minutes1 > minutes2) {
                      newestIndex = i;
                      setDataIndex(newestIndex);
                      foundNew = true;
                    }
                    if (minutes1 == minutes2) {
                      if (seconds1 > seconds2) {
                        newestIndex = i;
                        setDataIndex(newestIndex);
                        foundNew = true;
                      }
                    }
                  }
                }
              }
            }
          }
        }
        if (!foundNew) {
          break;
        }
      }
    }

    if (historyDetailed?.length > 0) {
      for (let i = 0; i < historyDetailed.length; i++) {
        let parsed = JSON.parse(historyDetailed[i]);
        if (prodDetailed?.uri !== null && prodDetailed?.uri !== undefined) {
          if (prodDetailed?.id === parsed.file_id) {
            if (valName === "internal") {
              if (parsed[`${valName}`] == 1 || parsed[`${valName}`] == "1") {
                return "Yes";
              }
              return "No";
            }
            return parsed[`${valName}`];
          }
        }
      }
    }
    return "";
  };

  useEffect(() => {
    if (props?.history !== null && props?.history !== undefined) {
      setDataIndex(-1);
      setHistoryDetailed(props.history);
    }
    if (props?.prod !== null && props?.prod !== undefined) {
      if (props?.prod?.id !== prodDetailed?.id) {
        setDataIndex(-1);
        setProdDetailed(props?.prodDetailed);
        let newInternal = getHistoryData("internal");
        setInternal(newInternal);
      }
    }

    if (props.prod !== null && props.prod !== undefined) {
      setProdDetailed(props.prod);
    }
  }, [props, refresh]);

  if (loading) {
    return (
      <div
        style={{ margin: "5rem" }}
        className="d-flex m-5 dokuly-primary justify-content-center"
      >
        <div className="spinner-border" role="status"></div>
      </div>
    );
  }

  if (props?.usesHistoryEntries) {
    if (historyDetailed == null) {
      return (
        <div
          className="card-body bg-white m-2 card rounded shadow"
          style={{ width: "40rem" }}
        >
          <a>No data</a>
        </div>
      );
    }
  }

  if (
    prodDetailed == -1 ||
    prodDetailed == null ||
    prodDetailed == {} ||
    prodDetailed.length == 0
  ) {
    return (
      <div
        className="card-body bg-white m-2 card rounded shadow"
        style={{ width: "40rem" }}
      >
        <a className="ml-2">
          {props.usesHistoryEntries
            ? "No Software File Object Selected."
            : "No data."}
        </a>
      </div>
    );
  }

  if (open) {
    return (
      <div
        className="card-body bg-white m-2 card rounded shadow"
        style={{ width: "40rem" }}
      >
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
                  setRefresh(true);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
        <div className="form-group" style={{ marginTop: "1rem" }}>
          <input
            className="form-control"
            type="text"
            placeholder="Enter a display name (Optional)"
            value={display_name}
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
      </div>
    );
  }

  return (
    <div
      className="card-body bg-white m-2 card rounded shadow"
      style={{ width: "40rem" }}
    >
      <animated.div
        style={props.formOpen !== undefined ? fade : { width: "40rem" }}
      >
        <div className="row">
          <div className="col">
            <h5>
              <b>{props?.title}</b>
            </h5>
          </div>
          <div className="col-md-auto">
            {props?.editable && (
              <button
                className="btn btn-sm btn-info"
                onClick={() => {
                  handleOpen(true);
                }}
              >
                <img
                  className="icon-tabler"
                  src="../../../../static/icons/edit.svg"
                  width="30px"
                  height="30px"
                />
              </button>
            )}
          </div>
        </div>
        <ul className="list-group list-group-flush">
          {props.nameCol1 !== null && props.nameCol1 !== undefined && (
            <li className="list-group-item">
              <div className="row">
                <div className="col">
                  <b>{props.nameCol1}:</b>
                </div>
                <div className="col">{getData(props.colVal1)}</div>
              </div>
            </li>
          )}
          {props.nameCol2 !== null && props.nameCol2 !== undefined && (
            <li className="list-group-item">
              <div className="row">
                <div className="col">
                  <b>{props.nameCol2}:</b>
                </div>
                <div className="col">{getData(props.colVal2)}</div>
              </div>
            </li>
          )}
          {props.nameCol3 !== null && props.nameCol3 !== undefined && (
            <li className="list-group-item">
              <div className="row">
                <div className="col">
                  <b>{props.nameCol3}:</b>
                </div>
                <div className="col">{getData(props.colVal3)}</div>
              </div>
            </li>
          )}
          {props.nameCol4 !== null && props.nameCol4 !== undefined && (
            <li className="list-group-item">
              <div className="row">
                <div className="col">
                  <b>{props.nameCol4}:</b>
                </div>
                <div className="col">{getData(props.colVal4)}</div>
              </div>
            </li>
          )}
          {props.nameCol5 !== null && props.nameCol5 !== undefined && (
            <li className="list-group-item">
              <div className="row">
                <div className="col">
                  <b>{props.nameCol5}:</b>
                </div>
                <div className="col">{getData(props.colVal5)}</div>
              </div>
            </li>
          )}
          {props.nameCol6 !== null &&
            props.nameCol6 !== undefined &&
            props.colVal6 &&
            props.colVal6 && (
              <li className="list-group-item">
                <div className="row">
                  <div className="col">
                    <b>{props.nameCol6}:</b>
                  </div>
                  <div className="col">{props.colVal6?.name}</div>
                </div>
              </li>
            )}
          {props.historyEntry1 !== null &&
            props.historyEntry1 !== undefined && (
              <li className="list-group-item">
                <div className="row">
                  <div className="col">
                    <b>{props.historyEntry1}:</b>
                  </div>
                  <div className="col">{getHistoryData(props.hisVal1)}</div>
                </div>
              </li>
            )}
          {props?.usesHistoryEntries && getHistoryData("internal") === "Yes" ? (
            <div>
              {props.historyEntry2 !== null &&
                props.historyEntry2 !== undefined && (
                  <li className="list-group-item">
                    <div className="row">
                      <div className="col">
                        <b>{props.historyEntry2}:</b>
                      </div>
                      <div className="col">{getHistoryData(props.hisVal2)}</div>
                    </div>
                  </li>
                )}
            </div>
          ) : (
            ""
          )}
          {props.historyEntry3 !== null &&
            props.historyEntry3 !== undefined && (
              <li className="list-group-item">
                <div className="row">
                  <div className="col">
                    <b>{props.historyEntry3}:</b>
                  </div>
                  <div className="col">{getHistoryData(props.hisVal3)}</div>
                </div>
              </li>
            )}
          {getHistoryData("internal") === "No" ? (
            <div>
              {props.internalEntry1 !== null &&
                props.internalEntry1 !== undefined && (
                  <li className="list-group-item">
                    <div className="row">
                      <div className="col">
                        <b>{props.internalEntry1}:</b>
                      </div>
                      <div className="col">{getHistoryData(props.intVal1)}</div>
                    </div>
                  </li>
                )}
              {props.internalEntry2 !== null &&
                props.internalEntry2 !== undefined && (
                  <li className="list-group-item">
                    <div className="row">
                      <div className="col">
                        <b>{props.internalEntry2}:</b>
                      </div>
                      <div className="col">{getHistoryData(props.intVal2)}</div>
                    </div>
                  </li>
                )}
              {props.internalEntry3 !== null &&
                props.internalEntry3 !== undefined && (
                  <li className="list-group-item">
                    <div className="row">
                      <div className="col">
                        <b>{props.internalEntry3}:</b>
                      </div>
                      <div className="col">{getHistoryData(props.intVal3)}</div>
                    </div>
                  </li>
                )}
            </div>
          ) : (
            ""
          )}
          {props.historyEntry4 !== null &&
            props.historyEntry4 !== undefined && (
              <li className="list-group-item">
                <div className="row">
                  <div className="col">
                    <b>{props.historyEntry4}:</b>
                  </div>
                  <div className="col">{getHistoryData(props.hisVal4)}</div>
                </div>
              </li>
            )}
        </ul>
      </animated.div>
    </div>
  );
};

export default InfoCard;

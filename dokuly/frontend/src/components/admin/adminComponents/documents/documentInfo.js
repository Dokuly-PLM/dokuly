import moment from "moment";
import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useSpring, animated, config } from "react-spring";
import {
  checkDocumentNumber,
  fadeIn1C,
  fadeIn2C,
  fadeIn3C,
  fadeIn4C,
} from "../../functions/helperFunctions";
import { editDocumentInfo } from "../../functions/queries";
import { toast } from "react-toastify";

const DocumentInfo = (props) => {
  const [refresh, setRefresh] = useState(false);
  const [inLineEdit, setInlineEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [document_number, setDocumentNumber] = useState("");
  const [rerender, setRerender] = useState(0);
  const [document_type, setDocumentType] = useState("");
  const [resetSpring, setResetSpring] = useState(true);
  const [state, setState] = useState("");
  const [fullDN, setFullDN] = useState("");
  const [prefixId, setPrefixId] = useState("");
  const [selectedDocument, setSelectedDocument] = useState(
    props.selectedDocument !== null && props.selectedDocument !== undefined
      ? props.selectedDocument
      : {},
  );
  const [prefixes, setPrefixes] = useState(
    props?.prefixes !== null && props?.prefixes !== undefined
      ? props.prefixes
      : null,
  );
  const [documents, setDocuments] = useState(
    props?.documents !== null && props?.documents !== undefined
      ? props.documents
      : [],
  );

  const submit = () => {
    if (state === "" || state === null || state === undefined) {
      toast.error("Cannot submit without a state");
      return;
    }
    let preId = -1;
    if (prefixId?.id !== null && prefixId?.id !== undefined) {
      preId = prefixId.id;
    } else if (document_type?.id !== null && document_type?.id !== undefined) {
      preId = document_type.id;
    } else {
      preId = prefixId;
    }
    let data = {};
    const dupCheck = checkDocumentNumber(selectedDocument, fullDN, documents);
    data = {
      autoGenNum:
        document_type?.prefix !== selectedDocument?.document_type?.prefix,
      duplicate_num: dupCheck ? 0 : 1,
      release_state: state,
      document_type: document_type?.prefix,
      prefix_id: preId,
      last_updated: moment().format("YYYY-MM-DD HH:mm"),
    };

    editDocumentInfo(selectedDocument?.id, data).then((res) => {
      setSelectedDocument(res.data.newDocument);
      setDocuments(res.data.documents);
      const childRes = {
        newDocument: res.data.newDocument,
        documents: res.data.documents,
        newData: true,
      };
      props.childToParent(childRes);
    });
    setInlineEdit(false);
    setResetSpring(true);
    setRefresh(true);
  };

  const findPrefix = (id) => {
    if (props?.prefixes !== null && props?.prefixes !== undefined) {
      if (props?.prefixes.length <= 0) {
        return { display_name: "No Prefix", id: -1 };
      }
      for (let i = 0; i < props.prefixes.length; i++) {
        if (props.prefixes[i].id === id) {
          return props.prefixes[i];
        }
      }
    }
    return { display_name: "No Prefix Data", id: -1 };
  };

  const loadStates = (data, props) => {
    if (data !== null) {
      if (data !== undefined) {
        if (data?.id !== undefined) {
          setSelectedDocument(data);
          setDocuments(props.documents);
          setDocumentNumber(data.document_number);
          setState(data.release_state);
          setFullDN(data?.full_doc_number);
          setPrefixId(data?.prefix_id);
          setDocumentType(findPrefix(data?.prefix_id));
        }
      }
    }
  };

  useEffect(() => {
    if (refresh === 0 && rerender === 0) {
      loadStates(props.selectedDocument, props);
    }
    if (props?.prefixes !== null && props?.prefixes !== undefined) {
      setPrefixes(props.prefixes);
    }
    if (refresh === 1) {
      setLoading(false);
    }
    if (rerender === 1) {
      setLoading(false);
    }
    setRefresh(0);
  }, [props, refresh, rerender]);

  const fadeIn1 = useSpring(fadeIn1C(resetSpring));

  const fadeIn2 = useSpring(fadeIn2C(resetSpring));

  const fadeIn3 = useSpring(fadeIn3C(resetSpring));

  const fadeIn4 = useSpring(fadeIn4C(resetSpring));

  if (
    selectedDocument == null ||
    selectedDocument === undefined ||
    selectedDocument?.id == null ||
    selectedDocument?.id === undefined
  ) {
    return (
      <div className="card-body bg-white m-3 card rounded">
        No document selected
      </div>
    );
  }

  if (inLineEdit) {
    return (
      <div className="card-body bg-white m-3 card rounded">
        <animated.div style={fadeIn1}>
          <div className="row" style={{ marginBottom: "0.5rem" }}>
            <div className="col-sm-4">
              <h5>
                <b>Edit Information</b>
              </h5>
            </div>
            <div className="col-md-auto">
              <button
                type="button"
                className="btn btn-sm dokuly-bg-primary"
                onClick={() => {
                  submit();
                }}
              >
                Save Changes
              </button>
            </div>
            <div className="col-md-auto">
              <button
                type="button"
                className="btn btn-sm btn-danger"
                onClick={() => {
                  setResetSpring(true);
                  setInlineEdit(false);
                  setRefresh(true);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </animated.div>
        <animated.div style={fadeIn4}>
          <div className="form-group">
            <div className="row">
              <div className="col">
                <label>
                  {`Current document type: ${document_type.prefix}`}
                </label>
                {prefixes !== undefined &&
                prefixes !== null &&
                prefixes?.length === 1 ? (
                  <div>
                    {`Prefix available:${prefixes[0].display_name}`}
                    <button type="button" className="btn btn-sm btn-info">
                      Use Prefix
                    </button>
                  </div>
                ) : (
                  <select
                    className="form-control"
                    placeholder="Select Contact"
                    value={prefixId}
                    onChange={(e) => {
                      setPrefixId(e.target.value);
                    }}
                  >
                    {prefixes !== undefined &&
                      prefixes !== null &&
                      prefixes?.length !== 0 &&
                      prefixes
                        .sort((a, b) => {
                          if (a.display_name < b.display_name) {
                            return -1;
                          }
                          if (a.display_name > b.display_name) {
                            return 1;
                          }
                          return 0;
                        })
                        .map((prefix, index) => {
                          return (
                            // biome-ignore lint/a11y/useKeyWithClickEvents: Dont need buttons here
                            <option
                              key={prefix.id}
                              value={prefix.id}
                              onClick={() => {
                                const currentDocumentType =
                                  document_type.prefix.toString();
                                const fDnSuffix = fullDN.substring(
                                  currentDocumentType.length,
                                  fullDN.length,
                                );
                                setFullDN(prefix.prefix + fDnSuffix);
                                setDocumentType(prefix);
                              }}
                            >
                              {prefix.display_name} - {prefix.prefix}
                            </option>
                          );
                        })}
                  </select>
                )}
                {document_type?.description !== null && (
                  <small>Type Description: {document_type.description}</small>
                )}
              </div>
              <div className="col">
                <label>Release state*</label>
                <select
                  className="form-control"
                  placeholder="Select Contact"
                  value={state}
                  onChange={(e) => {
                    setState(e.target.value);
                  }}
                >
                  <option value={"Draft"}>Draft</option>
                  <option value={"Review"}>Review</option>
                  <option value={"Approved For Release"}>
                    Approved For Release
                  </option>
                  <option value={"Released"}>Released</option>
                </select>
              </div>
            </div>
          </div>
        </animated.div>
        <animated.div style={fadeIn4}>
          <small style={{ color: "grey" }}>*required field</small>
        </animated.div>
      </div>
    );
  }

  return (
    <div className="card-body bg-white m-3 card rounded">
      <animated.div style={fadeIn1}>
        <div className="row" style={{ marginBottom: "0.5rem" }}>
          <div className="col-sm-4">
            <h5>
              <b>Document Management</b>
            </h5>
          </div>
          <div className="col-md-auto">
            <button
              type="button"
              className="btn btn-sm btn-info"
              onClick={() => {
                setInlineEdit(true);
                loadStates(props.selectedDocument, props);
                setRefresh(true);
                setResetSpring(false);
              }}
            >
              <img
                className="icon-tabler"
                src="../../static/icons/edit.svg"
                alt="edit"
              />
            </button>
          </div>
        </div>
      </animated.div>
      <animated.div style={fadeIn1}>
        <div className="row">
          <div className="col-sm-4">
            <b>Title:</b>
          </div>
          <div className="col-sm-4">{selectedDocument?.title}</div>
        </div>
      </animated.div>
      <animated.div style={fadeIn2}>
        <div className="row">
          <div className="col-sm-4">
            <b>Document Number:</b>
          </div>
          <div className="col-sm-4">{document_number}</div>
        </div>
      </animated.div>
      <animated.div style={fadeIn2}>
        <div className="row">
          <div className="col-sm-4">
            <b>State:</b>
          </div>
          <div className="col-sm-4">{state}</div>
        </div>
      </animated.div>
      <animated.div style={fadeIn2}>
        <div className="row">
          <div className="col-sm-4">
            <b>Last updated:</b>
          </div>
          <div className="col-sm-4">
            {moment(selectedDocument?.last_updated).format("HH:mm - D.M.Y")}
          </div>
        </div>
      </animated.div>
      <animated.div style={fadeIn2}>
        <div className="row">
          <div className="col-sm-4">
            <b>Created by:</b>
          </div>
          <div className="col-sm-4">
            <NavLink to={"/employees"}>
              {props?.users?.map((profile) => {
                if (profile.id === selectedDocument.created_by) {
                  return `${profile.first_name} ${profile.last_name}`;
                }
              })}
            </NavLink>
          </div>
        </div>
      </animated.div>
      <animated.div style={fadeIn3}>
        <div className="row">
          <div className="col-sm-4">
            <b>Quality Assurance:</b>
          </div>
          <div className="col-sm-4">
            <NavLink to={"/employees"}>
              {/* biome-ignore lint/a11y/useValidAnchor: A tag here only for style */}
              <a>
                {props.users.map((profile) => {
                  if (profile?.id === selectedDocument?.quality_assurance) {
                    return (
                      <b>{`${profile?.first_name} ${profile?.last_name}`}</b>
                    );
                  }
                })}
              </a>
            </NavLink>
          </div>
        </div>
      </animated.div>
      <animated.div style={fadeIn3}>
        <div className="row">
          <div className="col-sm-4">
            <b>Description:</b>
          </div>
          <div className="col-sm-4">{selectedDocument?.description}</div>
        </div>
      </animated.div>
      <animated.div style={fadeIn4}>
        <div className="row">
          <div className="col-sm-4">
            <b>Full Document Number:</b>
          </div>
          <div className="col-sm-4">
            {selectedDocument?.full_doc_number !== null &&
            selectedDocument?.full_doc_number !== undefined
              ? selectedDocument?.full_doc_number
              : "Not auto generated"}
          </div>
        </div>
      </animated.div>
      <animated.div style={fadeIn4}>
        <div className="row">
          <div className="col-sm-4">
            <b>Document Type:</b>
          </div>
          <div className="col-sm-4">
            {document_type?.prefix}
            <div>
              {document_type?.description !== null && (
                <small>Type Description: {document_type.description}</small>
              )}
            </div>
          </div>
        </div>
      </animated.div>
    </div>
  );
};

export default DocumentInfo;

import React, { useState, useEffect } from "react";
import { useSpring, animated, config } from "react-spring";
import { basicSkeletonLoaderInfoCard } from "../../admin/functions/helperFunctions";
import { newAsmRevision } from "../functions/queries";
import { useNavigate } from "react-router-dom";

/**
 * Component for revising a ASM entity.
 * @param {any} props - Any data passed to the component
 * @returns {<HTMLDivElement>} - The Revision Card Function Component.
 *
* @example
    // import the component
    import AsmNewRevision from 'somePathTo/AsmNewrevision.js'
    // Call on the component in a return (render) function
    ...
    // Use the props to pass any data to the component from its parent component
    <div>
        <AsmNewRevision any_props={props} />
    </div>
 */
const AsmNewRevision = (props) => {
  const navigate = useNavigate();

  // Generic refresh state. Used for rerendering DOM if no other states are updated.
  const [refresh, setRefresh] = useState(false);
  // Component states
  const [inLineForm, setInLineForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copyPrev, setCopyPrev] = useState(true);
  const [copyBom, setCopyBom] = useState(true);
  const [description, setDescription] = useState("");
  const [newAsm, setNewAsm] = useState({});
  const [loading2, setLoading2] = useState(false);

  useEffect(() => {
    if (props.asm !== undefined && props.asm != null) {
      setDescription(props.asm?.description);
      setLoading(false);
    }
  }, [props.asm]);

  const submit = () => {
    setLoading2(true);
    const data = {
      copyPrev: copyPrev ? 1 : 0,
      copyBom: copyBom ? 1 : 0,
      copyDocs: 0,
      description: description,
    };
    newAsmRevision(props.asm?.id, data).then((res) => {
      setNewAsm(res.data);
      if (res.status === 201) {
        // Navigate to new assembly.
        setLoading2(false);
        setTimeout(() => {
          navigate(`/assemblies/${res.data.id}`);
        }, 1000); // Wait 1 second before redirecting to prevent rc.
      }
    });
    setInLineForm(false);
  };

  const checkRevisable = (is_latest_revision, state) => {
    if (is_latest_revision && state === "Released") {
      return "Create a new revision for this ASM Object.";
    }
    if (!is_latest_revision) {
      return "Cannot create a new revision, a newer revision already exists.";
    }
    if (state !== "Released") {
      return `Cannot create a new revision, Assembly ${props.asm?.part_number} is not released yet!
      \nCurrent state: ${props.asm?.release_state}`;
    }
  };

  const spring = useSpring({
    loop: true,
    to: [
      { opacity: 1, color: "#A9A9A9" }, // Dark gray
      { opacity: 0.1, color: "gray" },
    ],
    from: { opacity: 0.1, color: "#D3D3D3" }, // Light gray
  });

  const fade = useSpring({ opacity: inLineForm ? 1 : 0, config: config.slow });

  const fadeReverse = useSpring({
    opacity: inLineForm ? 0 : 1,
    config: config.slow,
  });

  if (loading || loading2) {
    return basicSkeletonLoaderInfoCard(1, spring);
  }

  if (inLineForm) {
    return (
      <div className="container card-body bg-white m-3 card rounded shadow">
        <div style={{ marginLeft: "1rem" }}>
          <animated.div style={fade}>
            <div className="row mt-2 mb-2">
              <button
                className="btn dokuly-bg-primary"
                onClick={() => {
                  submit();
                }}
              >
                Submit
              </button>
              <button
                className="btn btn-danger btn-sm ml-2"
                onClick={() => {
                  setInLineForm(false);
                }}
              >
                Cancel
              </button>
            </div>
            <div className="row">
              <div style={{ marginLeft: "2rem" }}>
                <input
                  className="dokuly-checkbox"
                  type="checkbox"
                  checked={copyPrev}
                  id="flexCheckDefault"
                  onChange={(e) => {
                    setCopyPrev(e.target.checked);
                    setRefresh(true);
                  }}
                />
                <label className="form-check-label" htmlFor="flexCheckDefault">
                  Copy Information to New Revision
                </label>
              </div>
              <div style={{ marginLeft: "2rem" }}>
                <input
                  className="dokuly-checkbox"
                  type="checkbox"
                  checked={copyBom}
                  id="flexCheckDefault"
                  onChange={(e) => {
                    setCopyBom(e.target.checked);
                    setRefresh(true);
                  }}
                />
                <label className="form-check-label" htmlFor="flexCheckDefault">
                  Copy BOM
                </label>
              </div>
            </div>
            <div className="container" style={{ marginTop: "1rem" }}>
              <div className="form-group">
                <label>Description*</label>
                <textarea
                  className="form-control"
                  type="text"
                  name="title"
                  disabled={copyPrev}
                  onChange={(e) => {
                    if (e.target.value.length > 500) {
                      alert("Max length 500");
                      return;
                    }
                    setDescription(e.target.value);
                  }}
                  value={description}
                />
              </div>
              <div>
                <h6 style={{ color: "grey" }}>*required field</h6>
              </div>
            </div>
          </animated.div>
        </div>
      </div>
    );
  }

  return (
    <div className="ml-3 my-1">
      <animated.div style={fadeReverse}>
        <div className="row">
          {props?.asm?.is_latest_revision &&
          props?.asm?.release_state === "Released" ? (
            <button
              className={
                props?.asm?.is_latest_revision &&
                props?.asm?.release_state === "Released"
                  ? "btn btn-bg-transparent ml-2 mr-2"
                  : "btn btn-bg-transparent ml-2 mr-2"
              }
              style={
                props?.asm?.is_latest_revision &&
                props?.asm?.release_state === "Released"
                  ? { cursor: "pointer" }
                  : { cursor: "not-allowed" }
              }
              disabled={
                props?.asm?.is_latest_revision &&
                props?.asm?.release_state === "Released"
                  ? false
                  : true
              }
              data-toggle="tooltip"
              data-placement="top"
              title={checkRevisable(
                props?.asm?.is_latest_revision,
                props?.asm?.release_state
              )}
              onClick={() => {
                setInLineForm(true);
              }}
            >
              <div className="row">
                <img
                  className="icon-dark"
                  src="../../static/icons/circle-plus.svg"
                  alt="icon"
                />
                <span className="btn-text">Revision</span>
              </div>
            </button>
          ) : (
            ""
          )}
        </div>
      </animated.div>
    </div>
  );
};

export default AsmNewRevision;

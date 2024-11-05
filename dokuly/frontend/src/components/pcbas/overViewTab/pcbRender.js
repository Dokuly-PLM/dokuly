import React, { useEffect, useState, useCallback } from "react";
import { updatePcbLayers } from "../functions/queries";
import { Modal, Button } from "react-bootstrap";
import DokulyImage from "../../dokuly_components/dokulyImage";
import DokulyCard from "../../dokuly_components/dokulyCard";

/**
 *
 * @param {*} props Props must contain the pcb_renders field.
 * @returns
 */
export function PcbRenderViewer(props) {
  if (!props.pcba) {
    return null;
  }

  const [pcb_layers, setPcbLayers] = useState(props.pcba?.pcb_layers ?? {});
  const [zip_content, setZipContent] = useState(
    pcb_layers["zip content"] ?? [],
  );
  const [imageTimestamps, setImageTimestamps] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [currentImage, setCurrentImage] = useState(null);
  const [newPcbUploaded, setNewPcbUploaded] = useState(false);

  useEffect(() => {
    setPcbLayers(props.pcba?.pcb_layers ?? {});
    setZipContent(pcb_layers["zip content"] ?? []);
    const initialTimestamps = {
      [props.pcba?.pcb_renders[0]]: Date.now(),
      [props.pcba?.pcb_renders[1]]: Date.now(),
    };
    setImageTimestamps(initialTimestamps);
    setNewPcbUploaded(true);
  }, [props.pcba]);

  const sorted_zip_content = zip_content ? zip_content.sort() : [];

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const zoomImage = (factor) => {
    setZoomLevel((prevZoom) => prevZoom * factor);
  };

  const toggleEdit = () => {
    if (!isEditing) {
      props?.setRefresh(true);
    }
    setIsEditing(!isEditing);
  };

  function onSubmit() {
    setIsEditing(false);
    updatePcbLayers(props?.pcba.id, pcb_layers)
      .then((res) => {
        setImageTimestamps((prev) => ({
          ...prev,
          [props.pcba?.pcb_renders[0]]: Date.now(),
          [props.pcba?.pcb_renders[1]]: Date.now(),
        }));
      })
      .finally(() => {
        props?.setRefresh(true);
      });
  }

  const autoSuggest = useCallback(
    (layerKey) => {
      const suggestions = {
        "copper top": ["copper_top", "copper_top_l1", "F.Cu", "Top Copper"],
        "copper bot": [
          "copper_bot",
          "copper_bottom_l4",
          "B.Cu",
          "Bottom Copper",
        ],
        "soldermask top": [
          "soldermask_top",
          "soldermask_top",
          "F.Mask",
          "Top Soldermask",
        ],
        "soldermask bot": [
          "soldermask_bottom",
          "soldermask_bottom",
          "B.Mask",
          "Bottom Soldermask",
        ],
        "silkscreen top": [
          "silkscreen_top",
          "silkscreen_top",
          "F.SilkS",
          "Top Silkscreen",
        ],
        "silkscreen bot": [
          "silkscreen_bottom",
          "silkscreen_bottom",
          "B.SilkS",
          "Bottom Silkscreen",
        ],
        "solder paste top": [
          "solderpaste_top",
          "solderpaste_top",
          "F.Paste",
          "Top Solderpaste",
        ],
        "solder paste bot": [
          "solderpaste_bottom",
          "solderpaste_bottom",
          "B.Paste",
          "Bottom Solderpaste",
        ],
        "board outline": ["outline", "profile", "Edge.Cuts", "Board Outline"],
        drill: ["drill", "drill_1_16", "PTH", "Non-PTH", "Drill"],
      };

      const matches = suggestions[layerKey];
      if (matches) {
        for (const filename of sorted_zip_content) {
          if (matches.some((key) => filename.toLowerCase().includes(key))) {
            return filename;
          }
        }
      }
      return "";
    },
    [sorted_zip_content],
  );

  useEffect(() => {
    if (newPcbUploaded) {
      const updatedLayers = { ...pcb_layers };
      Object.keys(updatedLayers).forEach((layerKey) => {
        if (!updatedLayers[layerKey]) {
          const suggestedFile = autoSuggest(layerKey);
          if (suggestedFile) {
            updatedLayers[layerKey] = suggestedFile;
          }
        }
      });
      setPcbLayers(updatedLayers);
      setNewPcbUploaded(false);
    }
  }, [newPcbUploaded, autoSuggest]);

  const renderLayerDropdown = (label, layerKey) => {
    return (
      <div className="form-group row mb-3">
        <label className="col-sm-4 col-form-label">{label}:</label>
        <div className="col-sm-8">
          <select
            className="form-control"
            value={pcb_layers[layerKey]?.toString() ?? ""}
            onChange={(e) =>
              setPcbLayers({ ...pcb_layers, [layerKey]: e.target.value })
            }
          >
            <option value="">Select a file</option>
            {sorted_zip_content.map((filename, index) => (
              <option key={index} value={filename}>
                {filename}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  };

  return props.pcba?.pcb_renders != null &&
    props.pcba?.pcb_renders !== undefined &&
    props.pcba?.pcb_renders[0] !== undefined ? (
    <DokulyCard>
      {(props?.pcba.release_state !== "Released" && (
        <div className="d-flex justify-content-end align-items-center mb-3">
          <div className="form-check form-switch me-3">
            <input
              className="dokuly-checkbox"
              type="checkbox"
              checked={isEditing}
              onChange={toggleEdit}
            />
            <label className="form-check-label">Edit PCB layers</label>
          </div>
        </div>
      )) ||
        (Object.entries(props.pcba.pcb_layers).some(
          ([key, value]) => key !== "zip content" && !value,
        ) && (
          <div className="d-flex justify-content-end align-items-center mb-3">
            <div className="form-check form-switch me-3">
              <input
                className="dokuly-checkbox"
                type="checkbox"
                checked={isEditing}
                onChange={toggleEdit}
              />
              <label className="form-check-label">Edit PCB layers</label>
            </div>
          </div>
        ))}

      {isEditing ? (
        <div>
          <div>
            {renderLayerDropdown("Copper Top", "copper top")}
            {renderLayerDropdown("Copper Bottom", "copper bot")}
            {renderLayerDropdown("Soldermask Top", "soldermask top")}
            {renderLayerDropdown("Soldermask Bottom", "soldermask bot")}
            {renderLayerDropdown("Silkscreen Top", "silkscreen top")}
            {renderLayerDropdown("Silkscreen Bottom", "silkscreen bot")}
            {renderLayerDropdown("Solder Paste Top", "solder paste top")}
            {renderLayerDropdown("Solder Paste Bottom", "solder paste bot")}
            {renderLayerDropdown("Board Outline", "board outline")}
            {renderLayerDropdown("Drill", "drill")}

            <div className="form-group">
              <button
                type="button"
                onClick={() => {
                  onSubmit();
                }}
                className="btn dokuly-bg-primary "
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="row mb-2">
          <div className="mx-auto">
            <div className="container">
              <div className="row">
                <div className="col-sm" style={{ cursor: "zoom-in" }}>
                  <DokulyImage
                    src={`api/files/download/file/${
                      props.pcba?.pcb_renders[0]
                    }?t=${imageTimestamps[props.pcba?.pcb_renders[0]]}`}
                    className="img-fluid"
                    alt="Top Gerber Image"
                    onClick={() => {
                      setCurrentImage(props.pcba?.pcb_renders[0]);
                      toggleModal();
                    }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = ""; // set default image to no image
                    }}
                  />
                </div>

                <div className="col-sm" style={{ cursor: "zoom-in" }}>
                  <DokulyImage
                    src={`api/files/download/file/${
                      props.pcba?.pcb_renders[1]
                    }?t=${imageTimestamps[props.pcba?.pcb_renders[1]]}`}
                    className="img-fluid"
                    alt="Bottom Gerber Image"
                    onClick={() => {
                      setCurrentImage(props.pcba?.pcb_renders[1]);
                      toggleModal();
                    }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = ""; // set default image to no image
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          <Modal show={isModalOpen} onHide={toggleModal} centered size="xl">
            <Modal.Header>
              <Modal.Title>
                <button
                  type="button"
                  className="btn btn-sm btn-bg-transparent"
                  onClick={() => zoomImage(1.1)}
                >
                  <div className="row">
                    <img
                      className="icon-dark"
                      src="../../static/icons/zoom-in.svg"
                      alt="icon"
                    />
                  </div>
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-bg-transparent"
                  onClick={() => zoomImage(0.9)}
                >
                  <div className="row">
                    <img
                      className="icon-dark"
                      src="../../static/icons/zoom-out.svg"
                      alt="icon"
                    />
                  </div>
                </button>
              </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ maxHeight: "90vh", overflow: "scroll" }}>
              <div
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: "top left",
                }}
              >
                <DokulyImage
                  src={`api/files/download/file/${currentImage}?t=${imageTimestamps[currentImage]}`}
                  alt="Gerber Image"
                  style={{ width: "100%" }}
                />
              </div>
            </Modal.Body>
          </Modal>
        </div>
      )}
    </DokulyCard>
  ) : (
    ""
  );
}

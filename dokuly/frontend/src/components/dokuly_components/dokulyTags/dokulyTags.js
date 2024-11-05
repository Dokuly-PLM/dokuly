import React, { useState, useEffect, useRef } from "react";
import Select, { components, createFilter } from "react-select";
import AddButton from "../AddButton";
import EditButton from "../editButton";
import useProjectTags from "../../common/hooks/useProjectTags";
import { toast } from "react-toastify";
import DokulyFormSection from "../dokulyForm/dokulyFormSection";
import { Col, Row } from "react-bootstrap";
import CancelButton from "../cancelButton";
import ColorPicker from "../dokulyForm/colorPicker";
import EditTagsForm from "./editTagsForm";
import SubmitButton from "../submitButton";

export const TagOption = (props) => (
  <components.Option {...props}>
    <div
      className="badge badge-info"
      style={{
        padding: "5px 10px",
        height: "20px",
        borderRadius: "20px",
        minHeight: "20px",
        margin: "5px",
        fontSize: "12px",
        cursor: "pointer",
        position: "relative",
        backgroundColor: props.data.color ?? "#155216",
      }}
    >
      {props.data.label}
    </div>
  </components.Option>
);

export const getRandomColor = () => {
  return `#${Math.floor(Math.random() * 16777215)
    .toString(16)
    .padStart(6, "0")}`;
};

export const generateRandomColorWithContrast = () => {
  let bestColor = "#155216";
  let bestContrast = 0;
  let color;
  let contrastWithWhite;
  let contrastWithBlack;

  // Max 20 tries to find a color with contrast ratio >= 7
  for (let i = 0; i < 20; i++) {
    color = getRandomColor();
    const toHex = 16;
    const r = Number.parseInt(color.slice(1, 3), toHex);
    const g = Number.parseInt(color.slice(3, 5), toHex);
    const b = Number.parseInt(color.slice(5, 7), toHex);

    const luminance = getLuminance(r, g, b);
    contrastWithWhite = getContrastRatio(
      luminance,
      getLuminance(255, 255, 255)
    );
    contrastWithBlack = getContrastRatio(luminance, getLuminance(0, 0, 0));

    // Keep track of the best color found
    const maxContrast = Math.max(contrastWithWhite, contrastWithBlack);
    if (maxContrast > bestContrast) {
      bestContrast = maxContrast;
      bestColor = color;
    }

    // If a valid color with contrast ratio >= 7 is found, return it
    if (contrastWithWhite >= 7 || contrastWithBlack >= 7) {
      return color;
    }
  }

  return bestColor;
};

// Function to calculate the relative luminance of an RGB color
export const getLuminance = (r, g, b) => {
  // Constants for luminance calculation
  const SRGB_THRESHOLD = 0.03928;
  const SRGB_SCALE = 12.92;
  const SRGB_OFFSET = 0.055;
  const SRGB_EXPONENT = 2.4;

  // Constants for luminance weights
  const RED_LUMINANCE_WEIGHT = 0.2126;
  const GREEN_LUMINANCE_WEIGHT = 0.7152;
  const BLUE_LUMINANCE_WEIGHT = 0.0722;

  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= SRGB_THRESHOLD
      ? v / SRGB_SCALE
      : // biome-ignore lint/style/useExponentiationOperator: <explanation>
        Math.pow((v + SRGB_OFFSET) / (1 + SRGB_OFFSET), SRGB_EXPONENT);
  });

  return (
    a[0] * RED_LUMINANCE_WEIGHT +
    a[1] * GREEN_LUMINANCE_WEIGHT +
    a[2] * BLUE_LUMINANCE_WEIGHT
  );
};

export const getContrastRatio = (lum1, lum2) => {
  // Constants for contrast ratio calculation
  const CONTRAST_OFFSET = 0.05;

  return (
    (Math.max(lum1, lum2) + CONTRAST_OFFSET) /
    (Math.min(lum1, lum2) + CONTRAST_OFFSET)
  );
};

// Function to calculate the contrast ratio between a hex color and black/white
export const getBestTextColor = (hexColor) => {
  const toHex = 16;
  // Convert hex to RGB
  const r = Number.parseInt(hexColor.slice(1, 3), toHex);
  const g = Number.parseInt(hexColor.slice(3, 5), toHex);
  const b = Number.parseInt(hexColor.slice(5, 7), toHex);

  // Calculate the luminance of the tag color
  const tagLuminance = getLuminance(r, g, b);
  // Luminance of white and black
  const whiteLuminance = getLuminance(255, 255, 255);
  const blackLuminance = getLuminance(0, 0, 0);

  // Calculate contrast ratios
  const whiteContrast = getContrastRatio(tagLuminance, whiteLuminance);
  const blackContrast = getContrastRatio(tagLuminance, blackLuminance);

  // The highest contrast ratio is the most readable text color
  // E.g. for color #155216, whiteContrast = 2.25, blackContrast = 9.33
  // Black text is more readable on this color

  // Choose the color with the higher contrast ratio
  return whiteContrast >= blackContrast ? "#ffffff" : "#000000";
};

export const Tag = ({ tag, onRemove, style = { cursor: "pointer" } }) => {
  // Determine the best text color for the given tag color
  const textColor = getBestTextColor(tag?.color ?? "#155216");

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
    <div
      className={"badge badge-info"}
      style={{
        minHeight: "20px",
        height: "20px",
        padding: "5px 10px",
        borderRadius: "20px",
        display: "flex",
        textAlign: "center",
        justifyContent: "center",
        alignItems: "center",
        margin: "5px",
        fontSize: "12px",
        cursor: "pointer",
        position: "relative",
        color: textColor,
        backgroundColor: tag?.color ?? "#155216",
        ...style,
      }}
      onClick={() => {
        onRemove(tag);
      }}
    >
      {tag.name}
    </div>
  );
};

const parseTag = (tag) => {
  const formattedTag = {
    label: tag.name,
    value: tag.id,
    color: tag.color,
  };
  return formattedTag;
};

const DokulyTags = ({
  tags: initialTags = [],
  onChange,
  project = { id: -1 },
  readOnly = false,
  setRefresh = () => {},
  closeEditModeOnSubmit = false,
  hideEditButton = false,
}) => {
  const [tags, setTags] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [selectOptions, setSelectOptions] = useState([]);
  const [newTagColor, setNewTagColor] = useState("#155216");
  const [showModal, setShowModal] = useState(false);

  const [projectTags, fetchAndCacheTags, loadingProjectTags] = useProjectTags({
    projectId: project?.id ?? -1,
    readonly: readOnly,
  });

  const selectRef = useRef(null); // Create a ref for the Select component

  useEffect(() => {
    setTags(initialTags);
  }, [initialTags]);

  useEffect(() => {
    if (projectTags && !loadingProjectTags) {
      // Filter out tags that are already present in the `tags` state
      const filteredOptions = projectTags.filter(
        (projectTag) => !tags.some((tag) => tag.id === projectTag.id)
      );
      setSelectOptions(filteredOptions.map(parseTag));
    }
  }, [projectTags, loadingProjectTags, tags]); // Added `tags` to the dependency array

  useEffect(() => {
    if (editMode && selectRef.current) {
      selectRef.current.focus();
    }
  }, [editMode]);

  const handleAddTag = (input, newTagColor, isNewTag = false) => {
    const randomColor = generateRandomColorWithContrast(); // New random color
    const newTag = {
      id: isNewTag ? -1 : input.value,
      name: isNewTag ? input : input.name ?? input.label ?? "No Name",
      color: isNewTag ? randomColor : input?.color ?? "#155216",
    };

    if (tags.find((t) => t.name === newTag.name)) {
      toast.error(`The tag "${newTag.name}" is already added.`);
      return;
    }
    const newTags = [...tags, newTag];
    setTags(newTags);
    onChange(newTags);
    if (closeEditModeOnSubmit) {
      setEditMode(false);
    }
    setInputValue("");
  };

  const handleRemoveTag = (tagToRemove) => {
    const newTags = tags.filter((tag) => tag.id !== tagToRemove.id);
    setTags(newTags);
    onChange(newTags);
  };

  const handleInputChange = (value) => {
    setInputValue(value);
  };

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      inputValue &&
      inputValue !== "" &&
      !checkIfTagExists()
    ) {
      handleAddTag(inputValue, newTagColor, true);
      setNewTagColor("#155216");
      setInputValue("");
    }
  };

  const handleCreateNewTag = (e) => {
    if (!inputValue) {
      toast.error("Please enter a tag name.");
      return;
    }
    handleAddTag(inputValue, newTagColor, true);
    setNewTagColor("#155216");
    setInputValue("");
  };

  const customStyles = {
    control: (styles) => ({
      ...styles,
      borderColor: "#ccc",
      boxShadow: "none",
      "&:hover": { borderColor: "#aaa" },
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999, // Ensure the menu portal has a high z-index
    }),
  };

  const handleRefresh = () => {
    fetchAndCacheTags();
    setRefresh(true);
  };

  const fetchAndCacheTagsAsync = async () => {
    const res = await fetchAndCacheTags();
    return res; // This will ensure a promise is returned
  };

  const checkIfTagExists = () => {
    const tagExists = tags.some((tag) => tag.name === inputValue);
    return tagExists;
  };

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
        {tags
          .sort((a, b) => a?.name - b?.name)
          .map((tag) => (
            <Tag
              key={tag.name}
              tag={tag}
              onRemove={handleRemoveTag}
              style={{
                marginTop: "0.65rem",
              }}
            />
          ))}
      </div>
      <EditTagsForm
        show={showModal}
        onHide={() => setShowModal(false)}
        projectTags={projectTags}
        project={project}
        refetchParentTags={handleRefresh}
      />
      {editMode && (
        <div className="mt-3">
          <Row className="justify-content-start align-items-center">
            <Col className={hideEditButton ? "col-11" : "col-7"}>
              <Select
                className="mb-2 max-width-12rem"
                ref={selectRef}
                components={{ Option: TagOption }}
                value={null}
                inputValue={inputValue}
                onInputChange={handleInputChange}
                onChange={(option) => {
                  if (option) {
                    handleAddTag(option);
                  }
                }}
                options={selectOptions}
                styles={customStyles}
                isClearable
                placeholder="Add a tag"
                menuPortalTarget={document.body}
                menuPosition="fixed"
                noOptionsMessage={() => (
                  <>
                    {inputValue === "" ? (
                      "No tags found. Start typing to create a new one."
                    ) : (
                      <SubmitButton
                        onClick={(e) => handleCreateNewTag(e)}
                        disabled={checkIfTagExists()}
                      >
                        {checkIfTagExists()
                          ? "This tag is already added"
                          : `Create new tag ${inputValue}`}
                      </SubmitButton>
                    )}
                  </>
                )}
                onKeyDown={handleKeyDown}
                openMenuOnFocus={true}
              />
            </Col>
            <Col className={hideEditButton ? "col-1" : "col-5"}>
              {!hideEditButton && (
                <EditButton
                  buttonText="Edit tags"
                  onClick={() => {
                    fetchAndCacheTags();
                    setShowModal(true);
                  }}
                />
              )}
            </Col>
          </Row>
        </div>
      )}
      {!editMode && !readOnly && (
        <Row>
          <Col className="col-auto">
            <AddButton
              onClick={() => {
                fetchAndCacheTagsAsync()
                  .then((res) => {})
                  .finally(() => {
                    setEditMode(true);
                  });
              }}
              buttonText={"Add tag"}
            />
          </Col>
          <Col className="col-auto">
            {!hideEditButton && (
              <EditButton
                buttonText="Edit tags"
                onClick={() => {
                  fetchAndCacheTags();
                  setShowModal(true);
                }}
              />
            )}
          </Col>
        </Row>
      )}
    </div>
  );
};

export default DokulyTags;

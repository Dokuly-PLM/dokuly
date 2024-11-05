import moment from "moment";
import React, { useEffect, useState } from "react";
import { basicSkeletonLoaderTableCard } from "../functions/helperFunctions";
import { toast } from "react-toastify";
import { Row } from "react-bootstrap";

import {
  fetchImageList,
  setOrganizationLogo,
  uploadImage,
} from "../functions/queries";
import { loadingSpinner } from "../functions/helperFunctions";
import { formatCloudImageUri } from "../../pcbas/functions/productionHelpers";
import DokulyImage from "../../dokuly_components/dokulyImage";
import FileUpload from "../../dokuly_components/fileUpload/fileUpload";
import SubmitButton from "../../dokuly_components/submitButton";

/**
 * # Image Files table
 *
 * Generic table to hold image file objects
 *
 * @param {Array<Number>} imageIds - must contain the list of image ids.
 * @param {String} domainName - must contain the domain name of the parent object entity
 * @param {Object} dbObj - must contain the parent object entity
 * @param {Function} setDbObj - set state function for parent object entity
 * @returns a image table.
 *
 * @example
  import ImageTable from ...
  const [pcba, setPcba] = useState(anyPcbaObject)
  return (
    <div>
        <ImageTable imageIds={pcba.image_ids} domainName="pcba" dbObj={pcba}/>
    </div>
  )
 */
const ImageTable = ({ imageIds, domainName, dbObj, setDbObj }) => {
  // Basic table states
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [is_uploading, setIsUploading] = useState(false);
  const [object, setObject] = useState(
    dbObj !== null && dbObj !== undefined ? dbObj : { id: -1 },
  );
  // Upload image form states
  const [formOpen, setFormOpen] = useState(false);
  const [image, setImage] = useState(null);
  const [name, setName] = useState("");

  const submit = () => {
    if (image == null || image === undefined) {
      toast.error("Select an image to upload!");
      return;
    }
    const extension = image.name.split(".").pop().toLowerCase();
    if (
      extension !== "png" &&
      extension !== "svg" &&
      extension !== "jpg" &&
      extension !== "jpeg" &&
      extension !== "gif" &&
      extension !== "avif" &&
      extension !== "apng"
    ) {
      toast.error(`Invalid file format, check your format: ${extension}`);
      return;
    }
    const data = new FormData();
    data.append("file", image);
    data.append("display_name", image.name);
    data.append("domain_name", domainName);
    data.append("dbObjId", object?.id);

    setIsUploading(true);
    uploadImage(data).then((res) => {
      if (res.status === 200) {
        setDbObj(res.data?.newObj);
        setFormOpen(false);
        setIsUploading(false);
        setImage(null);
        const imageData = {
          logo_id: res?.data?.newImage?.imageData?.id,
        };
        setOrganizationLogo(res.data.newObj.id, imageData).then((res) => {
          if (res.status === 200) {
            setDbObj(res.data);
            toast.success("Image uploaded successfully");
          }
        });
      }
    });
  };

  useEffect(() => {
    if (imageIds !== null && imageIds !== undefined) {
      const data = {
        file_ids: imageIds,
      };
      fetchImageList(data)
        .then((res) => {
          setData(res.data);
        })
        .catch((err) => {
          if (err != null) {
            setError(true);
          }
        });
    }
  }, [imageIds]);

  useEffect(() => {
    if (dbObj !== null && dbObj !== undefined) {
      setObject(dbObj);
    }
  }, [dbObj]);

  const handleFileUpload = ({ target: { files } }) => {
    const file = files[0]; // Assuming single file upload
    setImage(file); // Set the image state
  };

  if (formOpen) {
    return (
      <div className="m-3">
        {is_uploading ? (
          loadingSpinner()
        ) : (
          <React.Fragment>
            <h5>
              <b>Upload image</b>
            </h5>

            <div className="form-group" style={{ marginTop: "1rem" }}>
              <label>Upload image</label>
              <FileUpload
                onFileSelect={handleFileUpload}
                file={image}
                setFile={setImage}
              />
            </div>

            <Row style={{ marginTop: "1rem", marginLeft: "0.1rem" }}>
              <SubmitButton
                onClick={submit}
                disabled={image === null}
                disabledTooltip={"Select an image to upload"}
              >
                Upload
              </SubmitButton>
              <button
                type="button"
                className="btn btn-sm btn-danger ml-2"
                onClick={() => {
                  setFormOpen(false);
                  setImage(null);
                }}
              >
                Cancel
              </button>
            </Row>
          </React.Fragment>
        )}
      </div>
    );
  }

  if (data == null || data === undefined) {
    return (
      <div>
        <h5>
          <b>Organization logo</b>
        </h5>
        <div className="row">
          <h6
            style={{ marginLeft: "1rem", marginTop: "0.75rem" }}
            className="mr-2"
          >
            No Images
          </h6>
          <button
            type="button"
            className="btn btn-bg-transparent"
            onClick={() => {
              setFormOpen(true);
            }}
          >
            <img
              className="icon-dark mr-2"
              src="../../static/icons/upload.svg"
              alt="upload"
            />
            <span className="btn-text">Upload image</span>
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h5>
          <b>Organization logo</b>
        </h5>
        <div
          className="row"
          style={{ marginLeft: "0.1rem", marginTop: "0.5rem" }}
        >
          <h6 className="ml-2">Error loading data</h6>
          <button
            type="button"
            className="btn btn-bg-transparent"
            onClick={() => {
              setFormOpen(true);
            }}
          >
            <img
              className="icon-dark mr-2"
              src="../../static/icons/upload.svg"
              alt="upload"
            />
            <span className="btn-text">Upload image</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        className="btn btn-bg-transparent mb-4"
        onClick={() => {
          setFormOpen(true);
        }}
      >
        <img
          className="icon-dark mr-2"
          src="../../static/icons/upload.svg"
          alt="upload"
        />
        <span className="btn-text">Upload image</span>
      </button>
      {object?.logo_id && (
        <DokulyImage
          //className="icon-tabler-dark"
          className="ml-5 mb-3"
          src={formatCloudImageUri(object?.logo_id)}
          alt="Org Logo"
          height="50px"
          width="50px"
        />
      )}
    </div>
  );
};

export default ImageTable;

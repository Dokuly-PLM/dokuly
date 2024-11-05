import React, { useEffect, useState } from "react";
import moment from "moment";

const PartInformation = (props) => {
  const [loading, setLoading] = useState(true);

  const checkPart = (part) => {
    if (
      part.internal &&
      part.mpn !== null &&
      part.mpn !== "" &&
      part.mpn !== undefined
    ) {
      return false;
    }
    if (part.part_type === "PCB" || part.internal) {
      return true;
    }
    return false;
  };

  return (
    <div className="card-body m-3 card rounded">
      {loading && props.part === undefined ? (
        <div
          style={{ margin: "5rem" }}
          className="d-flex m-5 dokuly-primary justify-content-center"
        >
          <div className="spinner-border" role="status" />
        </div>
      ) : (
        <React.Fragment>
          <h5>
            <b>Information</b>
          </h5>

          <div className="row">
            {props.part?.image_url === "" ||
            props.part?.image_url === null ||
            props.part?.image_url === undefined ? (
              ""
            ) : (
              <div className="col-auto">
                <img
                  className="rounded"
                  style={{ maxWidth: "100px", width: "100%" }}
                  alt="Part Image"
                  src={props.part?.image_url}
                />
              </div>
            )}

            <div className="col col-md-6 col-lg-8 col-xl-8">
              {" "}
              {
                // Internal parts do not have an MPN.
                checkPart(props.part) ? (
                  ""
                ) : (
                  <div className="row">
                    <div
                      className="col col-lg-6 col-xl-6"
                      data-toggle="tooltip"
                      data-placement="top"
                      title="Manufacturer Part Number"
                    >
                      <b>MPN:</b>
                    </div>
                    <div className="col">{props.part?.mpn}</div>
                  </div>
                )
              }
              <div className="row">
                <div className="col col-lg-6 col-xl-6">
                  <b>State:</b>
                </div>
                <div className="col">{props.part?.release_state}</div>
              </div>
              {props.part?.git_link === "" ? (
                ""
              ) : (
                <div className="row">
                  <div className="col col-lg-6 col-xl-6">
                    <b>Git Link:</b>
                  </div>
                  <div className="col">
                    <a href={props.part?.git_link} target="_blank">
                      Link
                    </a>
                  </div>
                </div>
              )}
              {
                // This field is not necessary for internal parts.
                // At some point a specific manufacturer shall be attached, e.g. a specific approved PCB manufacturer etc.
                props.part?.part_type === "PCB" || props.part?.internal ? (
                  ""
                ) : (
                  <div className="row">
                    <div className="col col-lg-6 col-xl-6">
                      <b>Manufacturer:</b>
                    </div>
                    <div className="col">{props.part?.manufacturer}</div>
                  </div>
                )
              }
              <div className="row">
                <div className="col col-lg-6 col-xl-6">
                  <b>Description:</b>
                </div>
                <div className="col">{props.part?.description}</div>
              </div>
              <div className="row">
                <div className="col col-lg-6 col-xl-6">
                  <b>Last modified:</b>
                </div>
                <div className="col">
                  {moment(props.part?.last_updated).format("HH:mm D.M.Y")}
                </div>
              </div>
              {props?.part?.datasheet !== "" &&
                props?.part?.datasheet !== null && (
                  <div className="row">
                    <div className="col col-lg-6 col-xl-6">
                      <b>Datasheet:</b>
                    </div>
                    <div className="col">
                      <a
                        className="border-bottom"
                        href={props.part?.datasheet}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <img
                          className="icon-dark"
                          src="../../static/icons/pdf.svg"
                          alt="icon"
                          width={"44px"}
                        />
                      </a>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </React.Fragment>
      )}
    </div>
  );
};

export default PartInformation;

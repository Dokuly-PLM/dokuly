import React, { useEffect, useState } from "react";
import DokulyTable from "../../../dokuly_components/dokulyTable/dokulyTable";
import AddButton from "../../../dokuly_components/AddButton";
import { Col, Container, Row } from "react-bootstrap";
import CreateNewAPIKey from "./createNewAPIKey";
import CopyToClipButton from "../../../dokuly_components/copyToClipButton";
import DeleteButton from "../../../dokuly_components/deleteButton";
import { deleteAPIKey } from "../../functions/queries";
import { toast } from "react-toastify";
import { Tooltip, OverlayTrigger } from "react-bootstrap";
import CheckBox from "../../../dokuly_components/checkBox";
import moment from "moment";

const DokulyAPIKeys = ({ APIKeys, setRefresh }) => {
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [createNewAPIKey, setCreateNewAPIKey] = useState(false);
  const [showExpired, setShowExpired] = useState(false);
  const [filteredAPIKeys, setFilteredAPIKeys] = useState([]);

  const deleteKey = (row) => {
    if (!confirm("Are you sure you want to delete this API Key?")) {
      return;
    }
    deleteAPIKey(row?.prefix).then((res) => {
      if (res.status === 204) {
        toast.success("API Key Deleted Successfully");
        setRefresh(true);
      }
    });
  };

  useEffect(() => {
    if (APIKeys) {
      setFilteredAPIKeys(
        APIKeys.filter((key) => {
          if (showExpired) {
            return true; // Return all keys if we are showing expired ones
          }
          // Only return keys that are not expired when showExpired is false
          return key?.expiry_date && moment().isBefore(moment(key.expiry_date));
        })
      );
    }
  }, [APIKeys, showExpired]);

  const columns = [
    {
      // Copy to clipboard col
      header: "API Key",
      includeInCsv: false,
      formatter: (row, column) => {
        let style = {
          color: "#D3D3D3",
          marginTop: "-1rem",
        };

        if (row?.expiry_date && moment().isBefore(moment(row.expiry_date))) {
          style = {
            color: "black",
            marginTop: "-1rem",
          };
        }
        if (row?.key) {
          return (
            <CopyToClipButton
              text={row.key}
              className="btn btn-sm btn-bg-transparent ml-2 mr-2"
              style={style}
            />
          );
        } else {
          return <h6>{"N/A"}</h6>;
        }
      },
    },
    {
      key: "projects",
      header: "Project Access",
      includeInCsv: true,
      formatter: (row, column) => {
        let style = {
          color: "#D3D3D3",
        };

        if (row?.expiry_date && moment().isBefore(moment(row.expiry_date))) {
          style = {
            color: "black",
          };
        }
        if (!row.projects) {
          return <h6 style={style}>{"N/A"}</h6>;
        }
        if (row.projects.length === 0) {
          return <h6 style={style}>{"Global Access"}</h6>;
        } else if (row.projects.length === 1) {
          const project = row.projects[0];
          return (
            <h6
              style={style}
            >{`${project.project_number} ${project.title}`}</h6>
          );
        } else if (row.projects.length > 0) {
          const renderTooltip = (props) => (
            <Tooltip className="custom-tooltip" id="button-tooltip" {...props}>
              <div>
                {row.projects.map((project) => (
                  <Row key={project.id} className="my-1">
                    <Col style={{ minWidth: "75px" }} xs="auto">
                      {project.project_number}
                    </Col>
                    <Col style={{ minWidth: "200px" }} xs="auto">
                      {project.title}
                    </Col>
                    <Col style={{ minWidth: "150px" }} xs="auto">
                      {project?.customer?.name}
                    </Col>
                  </Row>
                ))}
              </div>
            </Tooltip>
          );
          return (
            <div>
              <OverlayTrigger
                placement="top"
                overlay={renderTooltip}
                trigger={["hover", "focus"]}
              >
                <h6 style={style}>Multiple Projects</h6>
              </OverlayTrigger>
            </div>
          );
        } else {
          return <h6 style={style}>{"N/A"}</h6>;
        }
      },
    },
    {
      key: "expiry_date",
      header: "Expiry",
      includeInCsv: false,
      formatter: (row, column) => {
        let style = {
          color: "#D3D3D3",
        };

        if (row?.expiry_date && moment().isBefore(moment(row.expiry_date))) {
          style = {
            color: "black",
          };
        }
        if (row.expiry_date) {
          return (
            <h6 style={style}>
              {new Date(row.expiry_date).toLocaleDateString()}
            </h6>
          );
        } else {
          return "N/A";
        }
      },
    },
    {
      // Delete col
      header: "",
      includeInCsv: false,
      formatter: (row, column) => {
        let color = "#D3D3D3";
        if (row?.expiry_date && moment().isBefore(moment(row.expiry_date))) {
          color = "black";
        }
        return (
          <DeleteButton
            style={{
              width: "20px",
              height: "20px",
              marginLeft: "-2rem",
              color,
            }}
            onDelete={() => {
              deleteKey(row);
            }}
          />
        );
      },
    },
  ];

  const handleRowClick = (row) => {
    setSelectedRowIndex(row?.id);
  };

  if (createNewAPIKey) {
    return (
      <CreateNewAPIKey
        setCreateNewAPIKey={setCreateNewAPIKey}
        setRefresh={setRefresh}
      />
    );
  }

  return (
    <div className="card-body card rounded bg-white p-2 mt-2 w-75">
      <div className="p-2">
        <h6 className="card-title pt-2">
          <b>Dokuly API Keys</b>
        </h6>
        <p className="card-text text-muted">
          <small>
            Below are the API keys for your organization. You can use these keys
            to access the Dokuly API.
          </small>
        </p>
        <Row className="mb-2 align-items-center">
          <Col md lg={4} className="justify-content-center">
            <AddButton
              buttonText={"Generate new API Key"}
              className="ml-4"
              onClick={() => {
                setCreateNewAPIKey(true);
              }}
            />
          </Col>
          <Col md lg={4} className="justify-content-center">
            <CheckBox
              className={"dokuly-checkbox"}
              checked={showExpired}
              onChange={() => setShowExpired(!showExpired)}
              aria-label="Toggle switch"
              label="Show Expired"
            />
          </Col>
          <Col />
        </Row>

        <DokulyTable
          data={filteredAPIKeys}
          columns={columns}
          onRowClick={handleRowClick}
          selectedRowIndex={selectedRowIndex}
          showCsvDownload={false}
          showPagination={true}
          showSearch={true}
          itemsPerPage={25}
        />
      </div>
    </div>
  );
};

export default DokulyAPIKeys;

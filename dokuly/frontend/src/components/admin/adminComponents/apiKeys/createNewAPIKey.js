import React, { useState } from "react";
import { Row, Col } from "react-bootstrap";
import useProjects from "../../../common/hooks/useProjects";
import DokulyTable from "../../../dokuly_components/dokulyTable/dokulyTable";
import SubmitButton from "../../../dokuly_components/submitButton";
import DeleteButton from "../../../dokuly_components/deleteButton";
import { generateAPIKey } from "../../functions/queries";
import { toast } from "react-toastify";

const CreateNewAPIKey = ({ setCreateNewAPIKey, setRefresh }) => {
  const [projects, fetchProjects] = useProjects();
  const [allowedProjects, setAllowedProjects] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const defaultExpiry = new Date(today.setDate(today.getDate() + 14)); // Default expiry date 14 days from today
    return defaultExpiry.toISOString().split("T")[0]; // Format as "yyyy-mm-dd" for defaultValue in input
  });

  const generateNewApiKey = () => {
    const today = new Date();
    const expiryDate = new Date(selectedDate);
    const timeDiff = expiryDate - today;
    const expiryDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    generateAPIKey({ project_ids: allowedProjects, expiry_days: expiryDays })
      .then((res) => {
        if (res.status === 201) {
          toast.success("API Key Created Successfully");
          setRefresh(true);
        }
      })
      .catch((err) => {
        toast.error("Error Creating API Key");
      })
      .finally(() => {
        setCreateNewAPIKey(false);
      });
  };

  const cancel = () => {
    setCreateNewAPIKey(false);
  };

  const handleRowClick = (row) => {};

  const handleCheckboxChange = (projectId) => {
    setAllowedProjects((current) => {
      const isAlreadyAllowed = current.includes(projectId);
      return isAlreadyAllowed
        ? current.filter((id) => id !== projectId)
        : [...current, projectId];
    });
  };

  const handleResetAllowedProjects = () => {
    setAllowedProjects((current) =>
      current.length === 0 ? projects.map((p) => p.id) : [],
    );
  };

  const accessFormatter = (row, column) => (
    <input
      className="dokuly-checkbox"
      type="checkbox"
      style={{ width: "20px", height: "20px", marginLeft: "2.25rem" }}
      checked={allowedProjects.length === 0 || allowedProjects.includes(row.id)}
      onChange={() => handleCheckboxChange(row.id)}
    />
  );

  const columns = [
    {
      key: "project_number",
      header: "Project Number",
      includeInCsv: true,
      formatter: (row, column) => {
        if (row?.id) {
          return `${row?.project_number}`;
        } else {
          return "N/A";
        }
      },
    },
    {
      key: "project_title",
      header: "Project Name",
      includeInCsv: true,
      formatter: (row, column) => {
        if (row?.id) {
          return `${row?.title}`;
        } else {
          return "N/A";
        }
      },
    },
    {
      key: "customer_name",
      header: "Customer",
      includeInCsv: true,
      formatter: (row, column) => {
        return row?.customer_name;
      },
    },
    {
      key: "allow_access",
      header: "Allow Access",
      includeInCsv: false,
      formatter: accessFormatter,
    },
  ];

  return (
    <div className="card-body card rounded bg-white mt-2 w-75">
      <div className="p-2">
        <Row className="mb-2">
          <h6 className="card-title pt-2">
            <b>Set API Key Project Access</b>
          </h6>
        </Row>
        <Row className="mb-4 justify-content-center align-items-center">
          <Col md={2}>
            <div>
              <label htmlFor="expiryDays">Expiry Date:</label>
              <input
                type="date"
                id="expiryDate"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="form-control"
              />
            </div>
          </Col>
          <Col className="justify-content-start align-items-center">
            <Row style={{ marginTop: "2rem" }}>
              <Col md={1} className="d-flex justify-content-start">
                <SubmitButton
                  onClick={() => generateNewApiKey()}
                  type="button"
                  children={"Submit"}
                />
              </Col>
              <Col md={1} className="mx-3 d-flex justify-content-start">
                <SubmitButton
                  onClick={() => cancel()}
                  type="button"
                  className="btn btn-danger"
                  children={"Cancel"}
                />
              </Col>
              <Col md={2} className="d-flex justify-content-start">
                {allowedProjects.length !== 0 && (
                  <SubmitButton
                    onClick={() => handleResetAllowedProjects()}
                    type="button"
                    children={"Reset Access"}
                    className="btn btn-info"
                  />
                )}
              </Col>
            </Row>
          </Col>
        </Row>
        <DokulyTable
          data={projects}
          columns={columns}
          onRowClick={handleRowClick}
          selectedRowIndex={null}
          showCsvDownload={false}
          showPagination={true}
          showSearch={true}
          itemsPerPage={25}
        />
      </div>
    </div>
  );
};

export default CreateNewAPIKey;

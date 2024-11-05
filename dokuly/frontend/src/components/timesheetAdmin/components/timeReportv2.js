import React, { useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import RenderTimePDF from "./renderPdf";
import { BlobProvider, PDFViewer, pdf } from "@react-pdf/renderer";
import moment from "moment";
import { loadingSpinner } from "../../admin/functions/helperFunctions";
import { getTotalHours } from "../functions/helperFunctions";
import { useSpring, animated, config } from "react-spring";
import download from "downloadjs";
import { fetchSelectedLogoImage } from "../functions/queries";
import { toast } from "react-toastify";

const TimeReport = ({
  filterEmployee,
  include_comments,
  date_from,
  date_to,
  projects,
  customers,
  profiles,
  timetracks,
  filterCustomer,
  filterProject,
  loadingCustomers,
  loadingProfiles,
  loadingProjects,
  loadingTimetrack,
  setIncludeComments,
  projectTasks,
}) => {
  const [renderReport, setRenderReport] = useState(false);
  const [customerProjectInfo, setCustomerProjectInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [missingFilter, setMissingFilter] = useState(false);
  const [imageUri, setImageUri] = useState(-1);
  const [loadingImage, setLoadingImage] = useState(true);

  const loadCustomerProjectInformation = () => {
    if (customers && projects && filterCustomer) {
      const customer = customers?.find(
        (customer) => parseInt(customer.id) === parseInt(filterCustomer),
      );
      let project = {};
      if (filterProject) {
        project = projects?.find(
          (project) => parseInt(project.id) === parseInt(filterProject),
        );
        setCustomerProjectInfo({
          customerProjectNumber:
            customer.customer_id.toString() + project.project_number.toString(),
          customer: customer,
          project: project,
        });
        return {
          customerProjectNumber:
            customer.customer_id.toString() + project.project_number.toString(),
          customer: customer,
          project: project,
        };
      }
      setCustomerProjectInfo({
        customerProjectNumber: customer.customer_id.toString(),
        customer: customer,
        project: project,
      });
      return {
        customerProjectNumber: customer.customer_id.toString(),
        customer: customer,
        project: project,
      };
    }
    return null;
  };

  useEffect(() => {
    setMissingFilter(false);
    const check = loadCustomerProjectInformation();
    if (check == null) {
      setRenderReport(false);
      setMissingFilter(true);
    }
    setLoadingInfo(false);
  }, [
    filterEmployee,
    include_comments,
    date_from,
    date_to,
    projects,
    customers,
    profiles,
    timetracks,
    filterCustomer,
    filterProject,
    loadingCustomers,
    loadingProfiles,
    loadingProjects,
    loadingTimetrack,
    projectTasks,
  ]);

  useEffect(() => {
    fetchSelectedLogoImage()
      .then((res) => {
        if (res.status === 200) {
          setImageUri(res.data);
        } else {
          toast.error(res.data);
          setImageUri(-1);
        }
      })
      .catch((err) => {
        if (err) {
          setImageUri(-1);
          if (err?.response?.data && err?.response?.status !== 500) {
            toast.error(err.response.data);
          } else {
            toast.error("Something went wrong! Could not fetch the logo.");
          }
        }
      })
      .finally(() => {
        setLoadingImage(false);
      });
  }, []);

  const fadeStyles = useSpring({
    opacity: loadingInfo ? 0 : 1,
    from: { opacity: 0 },
    config: config.molasses,
  });

  const saveAs = (blob, filename) => {
    download(blob, filename);
  };

  const downloadPdf = () => {
    pdf(
      <RenderTimePDF
        date_from={date_from}
        date_to={date_to}
        total_hours={getTotalHours(timetracks)}
        include_comments={include_comments}
        projects={projects}
        customers={customers}
        filterCustomer={filterCustomer}
        filterProject={filterProject}
        timetracks={timetracks}
        filterEmployee={filterEmployee}
        profiles={profiles}
        title={`TL${customerProjectInfo.customerProjectNumber.toString()}_${moment(
          date_from,
        ).format("YYMMDD")}-${moment(date_to).format("YYMMDD")}_${
          customerProjectInfo.customer.name
        }.pdf`}
        imageUri={imageUri}
        projectTasks={projectTasks}
      />,
    )
      .toBlob()
      .then(
        (blob) =>
          saveAs(
            blob,
            `TL${customerProjectInfo.customerProjectNumber.toString()}_${moment(
              date_from,
            ).format("YYMMDD")}-${moment(date_to).format("YYMMDD")}_${
              customerProjectInfo.customer.name
            }.pdf`,
          ), // This sets the filename of the blob
      );
  };

  if (loadingInfo || loadingImage) {
    return (
      <animated.div style={fadeStyles}>
        <Row className="justify-content-center d-flex align-items-center">
          <div className="mt-2 mb-2 mr-4 ml-4">
            <input
              className="dokuly-checkbox"
              name="include_comments"
              type="checkbox"
              onChange={(e) => {
                setIncludeComments(e.target.checked);
              }}
              checked={include_comments}
              disabled={true}
            />
            <label className="form-check-label" htmlFor="flexCheckDefault">
              Render comments in PDF
            </label>
          </div>
          <button
            className="btn btn-bg-transparent mt-2 mb-2 mr-4 ml-4"
            onClick={() => {
              setRenderReport(!renderReport);
            }}
            type="button"
            disabled={true}
          >
            <Row>
              <img
                className="icon-tabler-dark"
                src="../../static/icons/file-text.svg"
                alt="file"
                width={"30px"}
              />
              <span className="btn-text">
                {renderReport ? "Hide" : "Render"} Report PDF
              </span>
            </Row>
          </button>
          <button
            onClick={() => downloadPdf()}
            type={"button"}
            className="btn-bg-transparent mt-2 mb-2 mr-4 ml-4"
            disabled={true}
          >
            <img
              className="icon-tabler-dark"
              src="../../static/icons/download.svg"
              alt="file"
              width={"30px"}
            />
            <span className="btn-text">Download PDF</span>
          </button>
        </Row>
      </animated.div>
    );
  }

  if (missingFilter || filterCustomer === "") {
    return (
      <Row className="justify-content-center mt-2 mb-2 mr-4 ml-4 pt-2 pb-2">
        <span>
          <img
            className="icon-tabler"
            src="../../static/icons/alert-circle.svg"
            alt="Warning!"
            width={"30px"}
            style={{
              filter:
                " invert(65%) sepia(80%) saturate(1471%) hue-rotate(175deg) brightness(90%) contrast(88%)",
            }}
          />
          Generate a PDF by selecting a customer or project in the filters above
        </span>
      </Row>
    );
  }

  return (
    <animated.div style={fadeStyles}>
      <Row className="justify-content-center d-flex align-items-center">
        <div className="mt-2 mb-2 mr-4 ml-4">
          <input
            className="form-check-input"
            name="include_comments"
            type="checkbox"
            onChange={(e) => {
              setIncludeComments(e.target.checked);
            }}
            checked={include_comments}
          />
          <label className="form-check-label" htmlFor="flexCheckDefault">
            Render comments in PDF
          </label>
        </div>
        <button
          className="btn btn-bg-transparent mt-2 mb-2 mr-4 ml-4"
          onClick={() => {
            setRenderReport(!renderReport);
          }}
          type="button"
        >
          <Row>
            <img
              className="icon-tabler-dark"
              src="../../static/icons/file-text.svg"
              alt="file"
              width={"30px"}
            />
            <span className="btn-text">
              {renderReport ? "Hide" : "Render"} Report PDF
            </span>
          </Row>
        </button>
        <button
          onClick={() => downloadPdf()}
          type={"button"}
          className="btn btn-bg-transparent mt-2 mb-2 mr-4 ml-4"
        >
          <img
            className="icon-tabler-dark"
            src="../../static/icons/download.svg"
            alt="file"
            width={"30px"}
          />
          <span className="btn-text">Download PDF</span>
        </button>
      </Row>
      <Row className="justify-content-center mt-2 mb-2 mr-4 ml-4 pt-2 pb-2">
        {renderReport && (
          <PDFViewer width="75%" height="700px">
            <RenderTimePDF
              date_from={date_from}
              date_to={date_to}
              total_hours={getTotalHours(timetracks)}
              include_comments={include_comments}
              projects={projects}
              customers={customers}
              filterCustomer={filterCustomer}
              filterProject={filterProject}
              timetracks={timetracks}
              filterEmployee={filterEmployee}
              profiles={profiles}
              title={`TL${customerProjectInfo.customerProjectNumber.toString()}_${moment(
                date_from,
              ).format("YYMMDD")}-${moment(date_to).format("YYMMDD")}_${
                customerProjectInfo.customer.name
              }.pdf`}
              imageUri={imageUri}
              projectTasks={projectTasks}
            />
          </PDFViewer>
        )}
      </Row>
    </animated.div>
  );
};

export default TimeReport;

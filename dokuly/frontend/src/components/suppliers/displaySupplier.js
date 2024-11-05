import React, { useState, useEffect, useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Col, Container, Row, Tabs, Tab } from "react-bootstrap";
import ErrorBoundary from "../common/errorBoundaries";
import { AuthContext } from "../App";
import NoPermission from "../dokuly_components/noPermission";
import Heading from "../dokuly_components/Heading";
import { getSupplier } from "./functions/queries";
import InformationCard from "./overViewTab/informationCard";
import SupplierNotesCard from "./overViewTab/supplierNotes";
import EditSupplierForm from "./forms/editSupplierForm";

const DisplaySupplier = () => {
  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  // Parse the supplier ID from the URL
  const url = window.location.href.toString();
  const supplier_id = Number.parseInt(url.split("/")[5]);

  const [supplier, setSupplier] = useState(null);
  const [supplierName, setSupplierName] = useState("");
  const [supplierNumber, setSupplierNumber] = useState("");
  const [refresh, setRefresh] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [key, setKey] = useState("overview"); // State to handle active tab key

  useEffect(() => {
    if (refresh) {
      getSupplier(supplier_id)
        .then((res) => {
          if (res.status === 200) {
            setSupplier(res.data);
            setSupplierName(res.data.name);
            setSupplierNumber(res.data.supplier_id);
          } else {
            setError(true);
            setErrorMessage(res.data);
          }
        })
        .catch((err) => {
          if (err?.response) {
            if (err.response.status === 401) {
              setIsAuthenticated(false);
              navigate("/login"); // Redirect to login if unauthorized
            }
            if (err.response.status === 404) {
              setError(true);
              setErrorMessage("Supplier not found");
            }
          }
        })
        .finally(() => {
          setRefresh(false);
          document.title = `Suppliers | ${supplierName || "Dokuly"}`;
        });
    }
  }, [refresh, supplier_id, setIsAuthenticated, navigate, supplierName]);

  if (error) {
    return <NoPermission errorMessage={errorMessage} />;
  }

  return (
    <div
      className="container-fluid mt-2 mainContainerWidth"
      style={{ paddingBottom: "1rem" }}
    >
      <NavLink to="/suppliers">
        <img
          className="icon-tabler-dark"
          src="../../static/icons/arrow-left.svg"
          alt="icon"
        />
      </NavLink>
      <Heading
        item_number={supplierNumber}
        display_name={supplierName}
        app="suppliers"
      />
      <Tabs id="document-tabs" activeKey={key} onSelect={setKey}>
        <Tab eventKey="overview" title="Overview">
          <ErrorBoundary>
            <Container>
              <Row>
                <EditSupplierForm supplier={supplier} setRefresh={setRefresh} />
              </Row>
              <Row>
                <Col>
                  <InformationCard
                    supplier={supplier}
                    setRefresh={setRefresh}
                  />
                </Col>
              </Row>
              <Row>
                <Col>
                  <SupplierNotesCard
                    supplier={supplier}
                    setRefresh={setRefresh}
                  />
                </Col>
              </Row>
            </Container>
          </ErrorBoundary>
        </Tab>
      </Tabs>
    </div>
  );
};

export default DisplaySupplier;

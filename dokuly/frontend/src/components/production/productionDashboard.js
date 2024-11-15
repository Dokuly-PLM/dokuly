import React, { useState, useEffect, Fragment, useContext } from "react";
import NewProductionForm from "./forms/newProductionForm";
import ItemSearch from "./itemSearch";
import { Col, Container, Row, Card, Spinner } from "react-bootstrap";
import { searchProductionItems } from "./functions/queries";
import ProductionLatestActivity from "./latestActivity";
import ItemsProducedChart from "./itemsProducedChart";
import { AuthContext } from "../App";
import DokulyCard from "../dokuly_components/dokulyCard";
import CardTitle from "../dokuly_components/cardTitle";
import { toast } from "react-toastify";
import LotTable from "./lots/lotTable";

export default function ProductionDashBoard() {
  const [refresh, setRefresh] = useState(true);
  const [items, setItems] = useState([]);

  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);

  // load all pcba, assembly and part items
  useEffect(() => {
    const cachedItems = localStorage.getItem("productionItems");
    if (cachedItems) {
      try {
        setItems(JSON.parse(cachedItems));
      } catch (e) {
        localStorage.removeItem("productionItems");
      }
      setRefresh(false);
    }
    searchProductionItems("").then((res) => {
      if (res.status === 200) {
        setItems(res.data);
        localStorage.setItem("productionItems", JSON.stringify(res.data));
        setRefresh(false);
      } else if (res.status === 401) {
        setIsAuthenticated(false);
      } else {
        toast.error("Error loading items");
      }
    });
    document.title = "Production | Dokuly";
  }, [refresh]);

  return (
    <div
      className="container-fluid mt-2 mainContainerWidth"
      style={{ paddingBottom: "1rem" }}
    >

     
      {refresh ? (
        <Row className="justify-content-center mt-3">
          <Col />
          <Col>
            <div className="spinner-border " role="status" />
          </Col>{" "}
          <Col />
        </Row>
      ) : (
        <>
          <Row className="justify-content-center mt-3">
            <Col>
              <DokulyCard isCollapsed={false} expandText="Items Produced">
                <CardTitle
                  titleText={"Items Produced"}
                  optionalHelpText={"Views a chart of produced items per day."}
                />
                <ItemsProducedChart data={items} />{" "}
              </DokulyCard>
            </Col>{" "}
          </Row>
          <Row>
          <NewProductionForm setRefresh={setRefresh} />
          </Row>
          <Row>
        <LotTable refresh={refresh} />
      </Row>
          <Row className="justify-content-center mt-3">
            <Col>
              <DokulyCard isCollapsed={false} expandText="Latest Activity">
                <CardTitle
                  titleText={"Latest Activity"}
                  optionalHelpText={
                    "View the latest activity of produced items."
                  }
                />
                <ProductionLatestActivity items={items} />
              </DokulyCard>
            </Col>
          </Row>
          <Row className="justify-content-center mt-3">
            <Col>
              <DokulyCard
                isCollapsed={true}
                expandText="Search for serial numbers"
              >
                <CardTitle
                  titleText={"Search for serial numbers"}
                  optionalHelpText={
                    "Search for serial numbers of produced items."
                  }
                />
                <ItemSearch items={items} />
              </DokulyCard>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
}

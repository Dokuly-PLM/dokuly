import React, { useState } from "react";
import DokulyCard from "../dokulyCard";
import { Col, Row } from "react-bootstrap";
import CardTitle from "../cardTitle";
import QuestionToolTip from "../questionToolTip";
import { appToModelName } from "../dokulyIssues/issuesTable";
import { toast } from "react-toastify";
import InlineFormEditor from "../inlineFormEditor";
import { updateMinimumStockLevel } from "./functions/queries";
import useStockHistory from "../../common/hooks/useStockHistory";
import StockOverTimeGraph from "./components/stockOverTimeGraph";
import useStockOnOrder from "../../common/hooks/useStockOnOrder";
import Danger from "../dokulyIcons/danger";

const InventoryStatus = ({
  dbObject,
  app,
  setRefresh,
  refreshPart = () => {},
}) => {
  const [stockOnOrder, connectedPos, refreshStockOnOrder, loadingStockOnOrder] =
    useStockOnOrder({
      app,
      dbObjectId: dbObject?.id,
    });

  const [forecastedStock, setForecastedStock] = useState(0);

  const updateMinimumStock = (newMinimumStockLevel) => {
    if (newMinimumStockLevel === "" || newMinimumStockLevel === null) {
      toast.error("Set valid minimum stock level.");
      return;
    }
    const formattedMinimumStockLevel = Number.parseInt(
      newMinimumStockLevel.minimum_stock_level,
      10
    );
    if (formattedMinimumStockLevel < 0) {
      toast.error("Minimum stock level cannot be negative.");
      return;
    }
    const data = {
      minimum_stock_level: newMinimumStockLevel,
      app: app,
      object_id: dbObject.id,
    };
    updateMinimumStockLevel(data).then((res) => {
      if (res.status === 200) {
        toast.success("Minimum stock level updated successfully.");
        setRefresh(true);
        refreshPart(true);
      } else {
        toast.error("Failed to update minimum stock level.");
      }
    });
  };

  return (
    <DokulyCard key={dbObject?.id ?? 0}>
      <Row className="align-items-center">
        <CardTitle
          style={{ paddingLeft: "15px", marginRight: "0.5rem" }}
          titleText="Stock Status"
        />
        <QuestionToolTip
          optionalHelpText={`Set minimum stock level for this ${appToModelName[app]} and view stock levels over time.`}
          placement="right"
        />
      </Row>
      <Row>
        <Col className="col-4">
          <Row>
            <Col className="col-6">
              <b>Current stock:</b>
            </Col>
            <Col className="col-4">{dbObject?.current_total_stock ?? 0}</Col>
          </Row>
          <Row>
            <Col className="col-6">
              <b>Minimum stock level:</b>
            </Col>
            <Col className="col-4">
              <InlineFormEditor
                value={dbObject?.minimum_stock_level?.toString() ?? "0"}
                isLocked={false}
                onSubmit={updateMinimumStock}
                inputWidth="50%"
              />
            </Col>
          </Row>
          <Row>
            <Col className="col-6">
              <b>On order stock:</b>
            </Col>
            <Col className="col-4">{stockOnOrder}</Col>
          </Row>
          <Row className="mt-2 align-items-center">
            <Col className="col-6">
              <b>Forecasted stock:</b>
              {forecastedStock < 0 && <Danger className="mx-2" />}
            </Col>
            <Col className="col-4">{forecastedStock}</Col>
          </Row>
        </Col>
        <Col className="col-8">
          <StockOverTimeGraph
            app={app}
            dbObject={dbObject}
            stockOnOrder={stockOnOrder}
            connectedPos={connectedPos}
            setForecastedStock={setForecastedStock}
          />
        </Col>
      </Row>
    </DokulyCard>
  );
};

export default InventoryStatus;

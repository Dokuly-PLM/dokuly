import React, { useContext, useEffect, useState } from "react";
import Heading from "../../dokuly_components/Heading";
import { Col, Row } from "react-bootstrap";
import EditLotForm from "../forms/editLotForm";
import LotInfoCard, {
  getItemTypeFromModelObject,
  getLotProjectObject,
  getNestedModelObject,
} from "./lotInfoCard";
import LotDescriptionCard from "./lotDescriptionCard";
import useLot from "../../common/hooks/useLot";
import useOrganization from "../../common/hooks/useOrganization";
import { AuthContext } from "../../App";
import { useLocation, useNavigate } from "react-router";
import { toast } from "react-toastify";
import { deleteLot, editLot } from "../functions/queries";
import DokulyTabs from "../../dokuly_components/dokulyTabs/dokulyTabs";
import LotBom from "./lotBom";
import LotProcurement from "./lotProcurement";
import useLotBomItems from "../../common/hooks/useLotBomItems";
import LotSerialNumbers from "./lotSerialNumbers";
import { modelToAppName } from "../forms/newProductionForm";
import { NavLink } from "react-router-dom";
import useSerialNumbers from "../../common/hooks/useSerialNumbers";
import useLotPos from "../../common/hooks/useLotPos";

const DisplayLot = () => {
  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);
  const [lotId, setLotId] = useState(null);
  const [title, setTitle] = useState(null);
  const [quantity, setQuantity] = useState(null);
  const [lotNumber, setLotNumber] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [dbObjectApp, setApp] = useState(null);
  const [plannedProductionDate, setPlannedProductionDate] = useState(null);
  const [producedCount, setProducedCount] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const url = window.location.href.toString();
    const split = url.split("/");
    setLotId(Number.parseInt(split[6]));
  }, [location]);

  const [lot, refreshLot, loadingLot] = useLot({ lotId, setIsAuthenticated });
  const [showModal, setShowModal] = useState(false);

  const [lotBomItems, app, refreshLotBomItems, loadingLotBomItems] =
    useLotBomItems({
      lotId: lotId,
    });

  const [serialNumbers, refreshSerialNumbers, loadingSerialNumbers] =
    useSerialNumbers({
      lotId: lotId,
    });

  const [lotPos, refreshLotPos, loadingLotPos] = useLotPos({
    lotId: lotId,
  });

  const [organization] = useOrganization();

  const onEditLot = (newDescription) => {
    const data = {
      title: title,
      quantity: quantity,
      object_id: selectedItem.id,
      app: dbObjectApp,
      planned_production_date: plannedProductionDate,
    };
    if (newDescription !== null) {
      data.description = newDescription;
    }
    editLot(lot.id, data).then(
      (res) => {
        if (res.status === 200) {
          setShowModal(false);
          refreshLot();
        }
      },
      (error) => {
        toast.error(error);
      }
    );
  };

  const onDelete = () => {
    if (!confirm("Are you sure you want to delete this lot?")) {
      return;
    }
    deleteLot(lot.id).then((res) => {
      if (res.status === 200) {
        navigate("/production");
      }
    });
  };

  const setSelectedPartItem = (part) => {
    setSelectedItem(part);
    setTitle(part?.display_name);
    setApp(modelToAppName[part?.item_type]);
  };

  useEffect(() => {
    if (lot) {
      setTitle(lot?.title ?? "");
      setQuantity(lot?.quantity?.toString() ?? "1");
      setLotNumber(lot?.lot_number ?? "");
      setSelectedPartItem(getNestedModelObject(lot));
      setPlannedProductionDate(lot?.planned_production_date ?? "");
      document.title = `Lot ${lot?.lot_number} | Dokuly`;
    }
  }, [lot]);

  useEffect(() => {
    if (serialNumbers) {
      setProducedCount(serialNumbers.length);
    }
  }, [serialNumbers]);

  const tabs = [
    {
      eventKey: "overview",
      title: "Overview",
      content: (
        <>
          <Row>
            <Col md={4}>
              <LotInfoCard
                openModal={() => setShowModal(true)}
                lot={lot}
                currentProducedCount={producedCount}
              />
            </Col>
            <Col md={8}>
              <LotDescriptionCard
                markdown={lot?.description?.text || ""}
                project={getLotProjectObject(lot)?.id ?? -1}
                readOnly={false}
                handleMarkdownSubmit={onEditLot}
              />
            </Col>
          </Row>
          <EditLotForm
            title={title}
            quantity={quantity}
            lotNumber={lotNumber}
            selectedItem={selectedItem}
            plannedProductionDate={plannedProductionDate}
            setPlannedProductionDate={setPlannedProductionDate}
            setTitle={setTitle}
            setQuantity={setQuantity}
            setLotNumber={setLotNumber}
            setSelectedPartItem={setSelectedPartItem}
            showModal={showModal}
            setShowModal={setShowModal}
            onSubmit={onEditLot}
            onDelete={onDelete}
          />
        </>
      ),
    },
    {
      eventKey: "bomItems",
      title: "BOM items",
      disabled: getItemTypeFromModelObject(lot) === "part",
      content: (
        <>
          {lot && (
            <LotBom
              lot={lot}
              bom={lotBomItems}
              app={app}
              lotQuantity={lot?.quantity}
              currentProducedCount={producedCount}
            />
          )}
        </>
      ),
    },
    {
      eventKey: "procurement",
      title: "Procurement",
      hidden: organization?.procurement_is_enabled === false,
      content: (
        <>
          <LotProcurement poData={lotPos} lot={lot} />
        </>
      ),
    },
    {
      eventKey: "serialNumbers",
      title: "Serial numbers",
      disabled: getNestedModelObject(lot)?.id === -1,
      content: (
        <>
          {lot && (
            <LotSerialNumbers
              app={app}
              serialNumbers={serialNumbers}
              refreshSerialNumbers={refreshSerialNumbers}
              lot={lot}
              currentProducedCount={producedCount}
            />
          )}
        </>
      ),
    },
  ];

  return (
    <div
      className="container-fluid mt-2 mainContainerWidth"
      style={{ paddingBottom: "1rem" }}
    >
      <NavLink to={"/production"}>
        <img
          className="icon-dark p-2 arrow-back"
          src="../../static/icons/arrow-left.svg"
          alt="icon"
          style={{ cursor: "pointer" }}
        />
      </NavLink>
      <Heading
        item_number={`Lot ${lot?.lot_number || ""}`}
        display_name={lot?.title ?? ""}
        app="production"
      />
      <DokulyTabs
        tabs={tabs.filter((tab) => !tab.hidden)}
        basePath={`/production/lot/${lotId}`}
      />
    </div>
  );
};

export default DisplayLot;

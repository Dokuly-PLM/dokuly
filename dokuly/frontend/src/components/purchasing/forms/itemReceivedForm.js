import React, { useContext, useEffect, useState } from "react";
import DokulyModal from "../../dokuly_components/dokulyModal";
import InventoryTable from "../../dokuly_components/dokulyInventory/inventoryTable";
import { Col, Form, Row } from "react-bootstrap";
import SubmitButton from "../../dokuly_components/submitButton";
import AddButton from "../../dokuly_components/AddButton";
import useLocationEntires from "../../common/hooks/useLocationEntires";
import useLocations from "../../common/hooks/useLocations";
import { AuthContext } from "../../App";
import { toast } from "react-toastify";
import QuestionToolTip from "../../dokuly_components/questionToolTip";

const ItemReceivedForm = ({
  show,
  onHide,
  selectedPoItem,
  app,
  markItemReceived = () => {},
}) => {
  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);
  const [showInventoryCard, setShowInventoryCard] = useState(false);
  const [dbObject, setDbObject] = useState(null);
  const [userUpdatedStock, setUserUpdatedStock] = useState(false);
  const [notifiedUserOnUpdate, setNotifiedUserOnUpdate] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [formattedLocationsEntires, setFormattedLocationsEntires] = useState(
    []
  );

  const [locationEntires, refreshLocationEntires, loadingLocationEntires] =
    useLocationEntires({
      app: app,
      dbObjectId: dbObject?.id,
      setIsAuthenticated: setIsAuthenticated,
    });

  const [locations, refreshLocations, loadingLocations] = useLocations({
    setIsAuthenticated: setIsAuthenticated,
  });

  useEffect(() => {
    if (selectedPoItem != null) {
      const dbObject = { ...selectedPoItem };
      if (selectedPoItem?.part) {
        dbObject.id = selectedPoItem.part;
      }
      if (selectedPoItem?.assembly) {
        dbObject.id = selectedPoItem.assembly;
      }
      if (selectedPoItem?.pcba) {
        dbObject.id = selectedPoItem.pcba;
      }
      setDbObject(dbObject);
    }
  }, [selectedPoItem]);

  useEffect(() => {
    if (userUpdatedStock && !notifiedUserOnUpdate) {
      setNotifiedUserOnUpdate(true);
      toast.success("Confirm received item to continue 🎉");
    }
  }, [userUpdatedStock]);

  useEffect(() => {
    console.log("refresh", refresh);
    if (refresh) {
      refreshLocationEntires();
      refreshLocations();
      setRefresh(false);
    }
  }, [refresh]);

  useEffect(() => {
    if (locationEntires?.current_part_stock_list) {
      const formattedLocations = locationEntires?.current_part_stock_list.map(
        (entry) => {
          const newEntry = { ...entry };
          newEntry.transactionQuantity = selectedPoItem?.quantity?.toString();
          return newEntry;
        }
      );
      setFormattedLocationsEntires(formattedLocations);
    }
  }, [locationEntires]);

  return (
    <DokulyModal
      size={"xl"}
      show={show}
      onHide={onHide}
      title={
        <>
          <Row className="mx-1 align-items-center justify-content-start">
            <Col className="col-auto align-items-center mx-1">
              <h4 className="text-center mt-2">Confirm received item</h4>
            </Col>
            <Col className="col-auto align-items-center mx-1">
              <QuestionToolTip
                placement="right"
                optionalHelpText={
                  "Confirming a PO item:\n- Update the stock levels, the quantity is fetched from the order item (Optional)\n- Mark the item as received"
                }
              />
            </Col>
          </Row>
        </>
      }
    >
      <Form.Group className="m-2 center-content">
        <InventoryTable
          dbObject={dbObject}
          locations={locations}
          locationEntities={formattedLocationsEntires ?? []}
          otherRevisionsStockList={
            locationEntires?.other_revisions_stock_list ?? []
          }
          app={app}
          setRefresh={setRefresh}
          refreshPart={() => {
            refreshLocationEntires();
            refreshLocations();
            setUserUpdatedStock(true);
          }}
          loading={false}
          quantityFromPoItem={selectedPoItem?.quantity}
          autoFocus={false}
        />
      </Form.Group>
      <Form.Group className="mx-2 mt-2">
        <SubmitButton onClick={markItemReceived}>
          {userUpdatedStock
            ? "Confirm received"
            : "Confirm received without updating stock"}
        </SubmitButton>
      </Form.Group>
    </DokulyModal>
  );
};

export default ItemReceivedForm;

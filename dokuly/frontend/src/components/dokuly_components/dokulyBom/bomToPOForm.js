import React, { useEffect, useState } from "react";
import DokulyModal from "../dokulyModal";
import DokulyTable from "../dokulyTable/dokulyTable";
import AddButton from "../AddButton";
import { getBomTableColumns } from "./getBomCols";
import { thumbnailFormatter } from "../formatters/thumbnailFormatter";
import { convertPriceToOrganizationCurrency } from "../../common/bom/bomTable";
import { releaseStateFormatter } from "../formatters/releaseStateFormatter";
import { Col, Form, Row } from "react-bootstrap";
import QuestionToolTip from "../questionToolTip";
import DokulyCard from "../dokulyCard";
import SubmitButton from "../submitButton";
import CancelButton from "../cancelButton";
import { createPOFromBom } from "../funcitons/queries";
import { toast } from "react-toastify";
import { useNavigate } from "react-router";

const BomToPOForm = ({
  bomData,
  setBomData,
  show,
  setShow,
  onHide,
  openForm,
  setRefreshBom,
  designator_header,
  designator_header_tooltip,
  partInformationColumns,
  handleClick,
  expandPnCol,
  setExpandPnCol,
  organization,
  app,
  isLockedBom,
  currencyPairs,
  suppliers,
  connectToLot = false,
  lotId = -1,
  initialOrderQuantity = 1,
}) => {
  const [allIgnored, setAllIgnored] = useState(false);
  const [orderQuantity, setOrderQuantity] = useState(initialOrderQuantity);
  const [includeSubParts, setIncludeSubParts] = useState(false);
  const navigate = useNavigate();

  const onSubmit = () => {
    const bomDataWithoutIgnored = bomData.filter((item) => !item.ignored);
    const firstValidBomEntry = bomData.find((item) => item.bom !== undefined);
    const bomId = firstValidBomEntry?.bom;

    if (connectToLot && lotId === -1) {
      toast.error("Lot connection not found, try again");
      return;
    }

    const data = {
      bom_items: bomDataWithoutIgnored,
      bom_id: bomId,
      order_quantity: orderQuantity,
      include_sub_parts: includeSubParts,
      connect_to_lot: connectToLot,
      lot_id: lotId,
    };
    createPOFromBom(data)
      .then((response) => {
        if (response.status === 200) {
          setShow(false);
          toast.success("Purchase order created successfully");
          setTimeout(() => {
            setBomData([]);
            navigate("/procurement");
          }, 200);
        }
        if (response.status === 204) {
          setShow(false);
          toast.error(
            "Error creating purchase order, no supplier data found, check your pricing data!"
          );
        }
      })
      .catch((error) => {});
  };

  const handleRowSelectionChange = (row, isIgnored) => {
    setBomData((prevBomData) => {
      let updatedData = [];
      if (row === "ignore_all") {
        updatedData = prevBomData.map((row) => ({ ...row, ignored: true }));
      } else if (row === "include_all") {
        updatedData = prevBomData.map((row) => ({ ...row, ignored: false }));
      } else {
        updatedData = prevBomData.map((item) =>
          item.id === row.id ? { ...item, ignored: isIgnored } : item
        );
      }

      const allIgnoredUpdated = updatedData.every((item) => item.ignored);
      setAllIgnored(allIgnoredUpdated);

      return updatedData;
    });
  };

  const toggleIgnoreAll = () => {
    setAllIgnored((prevState) => {
      const newState = !prevState;
      handleRowSelectionChange(
        newState ? "ignore_all" : "include_all",
        newState
      );
      return newState;
    });
  };

  const handleSelectDropdown = (row, selectedSupplierId) => {
    const newSupplier = suppliers.find(
      (supplier) => supplier.id === selectedSupplierId
    );

    setBomData((prevBomData) => {
      return prevBomData.map((item) => {
        if (item.id === row.id) {
          return { ...item, selected_supplier: newSupplier };
        }
        return item;
      });
    });
  };

  useEffect(() => {
    if (orderQuantity > 0 && orderQuantity) {
      setBomData((prevBomData) =>
        prevBomData.map((row) => ({
          ...row,
          order_quantity: row.quantity * orderQuantity,
        }))
      );
    }
  }, [orderQuantity]);

  const columnConfiguration = {
    setRefreshBom: setRefreshBom,
    isLockedBom: isLockedBom,
    expandPnCol: expandPnCol,
    setExpandPnCol: setExpandPnCol,
    organizationCurrency: organization?.currency,
    app: app,
    partInformationColumns: partInformationColumns,
    handleClick: handleClick,
    releaseStateFormatter: releaseStateFormatter,
    convertPriceToOrganizationCurrency: convertPriceToOrganizationCurrency,
    designatorHeader: designator_header,
    designatorHeaderTooltip: designator_header_tooltip,
    thumbnailFormatter: thumbnailFormatter,
    currencyPairs: currencyPairs,
    includeSelector: true,
    handleRowSelect: handleRowSelectionChange,
    supplierOptions: suppliers,
    handleSelectDropdown: handleSelectDropdown,
  };

  const columns = getBomTableColumns(columnConfiguration);

  return (
    <>
      <AddButton
        buttonText={"Create PO from BOM"}
        className="ml-3 mb-2"
        onClick={() => {
          openForm();
        }}
      />
      <DokulyModal
        show={show}
        onHide={onHide}
        title="Create PO from BOM"
        size={"fullscreen"}
      >
        <Row className="m-3 justify-content-center align-items-center">
          <Col className="col-3 mx-2">
            <Form.Group>
              <Form.Label>
                Order quantity
                <QuestionToolTip
                  optionalHelpText={
                    "The quantity of the assembly to be produced."
                  }
                  placement="right"
                />
              </Form.Label>
              <Form.Control
                type="number"
                min={1}
                max={9999999}
                value={orderQuantity}
                onChange={(e) => setOrderQuantity(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col className="col-auto mx-2">
            <Form.Group style={{ marginTop: "1.75rem" }}>
              <input
                type="checkbox"
                className="dokuly-checkbox-warning mr-2"
                onChange={toggleIgnoreAll}
                checked={allIgnored}
                style={{ height: "20px", width: "20px" }}
              />
              <Form.Label className="mr-2">
                <b>Ignore all parts</b>
              </Form.Label>
            </Form.Group>
          </Col>
          <Col className="d-flex align-items-center"></Col>
        </Row>
        {bomData ? (
          <Row className="justify-content-center">
            <DokulyCard>
              <DokulyTable
                tableName="BomTable"
                key={bomData.length}
                data={bomData}
                columns={columns}
                showColumnSelector={true}
                itemsPerPage={100000} // No pagination
                onRowClick={(rowID, row, event) => {
                  if (event.ctrlKey || event.metaKey) {
                    if (row.pcba) {
                      window.open(`#/pcbas/${row.pcba}`, "_blank");
                    } else if (row.assembly) {
                      window.open(`#/assemblies/${row.assembly}`, "_blank");
                    } else if (row.part) {
                      window.open(`#/parts/${row.part}`, "_blank");
                    }
                  }
                }}
                navigateColumn={false}
                onNavigate={() => {}}
                textSize="16px"
                defaultSort={{ columnNumber: 1, order: "asc" }}
              />
            </DokulyCard>
          </Row>
        ) : (
          <h5>No BOM data available</h5>
        )}
        <Row className="m-3">
          <SubmitButton className="mr-2" onClick={onSubmit}>
            Create PO
          </SubmitButton>
          <CancelButton
            onClick={() => {
              onHide();
              setBomData([]);
            }}
          >
            Cancel
          </CancelButton>
        </Row>
      </DokulyModal>
    </>
  );
};

export default BomToPOForm;

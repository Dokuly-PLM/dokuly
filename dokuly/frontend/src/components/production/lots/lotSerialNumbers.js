import React, { useState } from "react";
import DokulyCard from "../../dokuly_components/dokulyCard";
import CardTitle from "../../dokuly_components/cardTitle";
import { Col, Row } from "react-bootstrap";
import DokulyTable from "../../dokuly_components/dokulyTable/dokulyTable";
import { useNavigate } from "react-router";
import AddButton from "../../dokuly_components/AddButton";
import ProductionProgress from "../components/productionProgress";
import CreateSerialNumbersForm from "../forms/createSerialNumbersForm";
import { createNewProduction } from "../functions/queries";
import { getNestedModelObject } from "./lotInfoCard";
import moment from "moment";

const LotSerialNumbers = ({
  app,
  serialNumbers,
  refreshSerialNumbers,
  refreshKey,
  lot,
  currentProducedCount = 0,
}) => {
  const navigate = useNavigate();

  const [latestSerialNumber, setLatestSerialNumber] = useState(0);
  const [serialNumberPrefix, setSerialNumberPrefix] = useState("");
  const [serialNumberOffset, setSerialNumberOffset] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [description, setDescription] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [assemblyDate, setAssemblyDate] = useState("");

  const createNewSerialNumbers = () => {
    // Check if at least one of the selections is made
    if (!selectedItem) {
      toast.error("Please select a part, PCBA, or assembly.");
      return;
    }

    const data = {
      quantity: quantity,
      serial_number_prefix: serialNumberPrefix,
      serial_number_offset: serialNumberOffset,
      assembly_date: assemblyDate,
      description: description,
      lot: lot.id,
    };

    if (app === "pcbas") {
      data.pcba = selectedItem.id;
    } else if (app === "parts") {
      data.part = selectedItem.id;
    } else if (app === "assemblies") {
      data.assembly = selectedItem.id;
    }

    createNewProduction(data)
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {})
      .finally(() => {
        setShowModal(false);
        refreshSerialNumbers();
      });
  };

  const columns = [
    {
      key: "full_part_number",
      header: "Part number",
      formatter: (row) => {
        const part = getNestedModelObject(row);
        // Use a regular expression to check if the last character is a number
        const shouldAppendRevision = /\d$/.test(part.full_part_number);
        // Conditionally append the revision based on the test result
        return `${part.full_part_number}${
          shouldAppendRevision ? part.revision : ""
        }`;
      },
    },
    {
      key: "serial_number",
      header: "Serial number",
      formatter: (row) => row.serial_number,
    },
    {
      key: "assembly_date",
      header: "Assembly date",
      formatter: (row) => row.assembly_date,
    },
    {
      key: "type",
      header: "Type",
      formatter: (row) => {
        const part = getNestedModelObject(row);
        return part.item_type;
      },
    },
  ];

  const onNavigate = (row) => {
    navigate(`/production/${row.id}`);
  };

  const handleRowClick = (index) => {
    const row = serialNumbers[index];
    onNavigate(row);
  };

  const onShowModal = () => {
    setSelectedItem(getNestedModelObject(lot));
    setQuantity(lot?.quantity - currentProducedCount ?? 1);
    const momentDate = moment(lot?.planned_production_date);
    if (momentDate.isValid()) {
      setAssemblyDate(momentDate.format("YYYY-MM-DD") ?? "");
    }
    setShowModal(true);
  };

  const onHideModal = () => {
    setShowModal(false);
  };

  return (
    <DokulyCard>
      <CardTitle titleText="Serial numbers" />
      <Row className="align-items-center">
        <AddButton
          className="ml-4 mb-2 mx-2"
          onClick={() => onShowModal()}
          buttonText={"Create new serial numbers"}
        />
      </Row>
      <Row>
        {serialNumbers ? (
          <DokulyTable
            tableName="serialNumbers"
            key={refreshKey ? serialNumbers.length : serialNumbers.length + 1} // Force re-render
            data={serialNumbers}
            columns={columns}
            showColumnSelector={true}
            itemsPerPage={100000} // No pagination
            onRowClick={(index) => handleRowClick(index)}
            navigateColumn={true}
            onNavigate={(row) => onNavigate(row)}
            textSize="16px"
            renderChildrenNextToSearch={
              <Col sm={6} md={6} lg={4} xl={4} className="mt-1">
                <ProductionProgress
                  lot={lot}
                  currentProducedCount={currentProducedCount ?? 0}
                  firstColClassname="col-auto"
                />
              </Col>
            }
          />
        ) : (
          <div className="m-5">No Serial numbers for current production</div>
        )}
      </Row>
      <CreateSerialNumbersForm
        onSubmit={createNewSerialNumbers}
        setLatestSerialNumber={setLatestSerialNumber}
        setSelectedItem={setSelectedItem}
        setSerialNumberOffset={setSerialNumberOffset}
        setSerialNumberPrefix={setSerialNumberPrefix}
        onHideModal={onHideModal}
        selectedItem={selectedItem}
        showModal={showModal}
        latestSerialNumber={latestSerialNumber}
        serialNumberOffset={serialNumberOffset}
        serialNumberPrefix={serialNumberPrefix}
        setQuantity={setQuantity}
        quantity={quantity}
        setAssemblyDate={setAssemblyDate}
        assemblyDate={assemblyDate}
        description={description}
        setDescription={setDescription}
      />
    </DokulyCard>
  );
};

export default LotSerialNumbers;

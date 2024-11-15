import React, { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import ItemInformation from "./itemInformation";

import { editSerialNumber, getSingleProducedItem } from "../functions/queries";
import Heading from "../../dokuly_components/Heading";
import TestData from "./testDataTab/testData";
import DokulyTabs from "../../dokuly_components/dokulyTabs/dokulyTabs";
import { getNestedModelObject } from "../lots/lotInfoCard";
import { toast } from "react-toastify";
import MarkDownNotes from "../../common/markDownNotes/markDownNotes";

const DisplayProducedItem = (props) => {
  const [producedItemId, setProducedItemId] = useState(-1);
  const [producedItem, setProducedItem] = useState(null);
  const [refresh, setRefresh] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const updateProductionDescription = (id, field, text, setRefresh) => {
    if (field === null) {
      toast.error("Data key error.");
      return;
    }
    editSerialNumber(id, { [field]: text }).then((res) => {
      if (res.status === 200) {
        setRefresh(true);
      }
    });
  };

  useEffect(() => {
    const url = window.location.href.toString();
    const split = url.split("/");
    setProducedItemId(parseInt(split[5]));
  }, [location]);

  useEffect(() => {
    if (producedItemId === -1) {
      return;
    }
    if (refresh || producedItem === null) {
      getSingleProducedItem(producedItemId).then((res) => {
        if (res.status === 200) {
          setProducedItem(res.data);
          document.title = `${res.data?.serial_number} | Dokuly`;
        }
      });
    }
    if (refresh) {
      setRefresh(false);
    }
  }, [producedItemId, refresh]);

  const tabs = [
    {
      eventKey: "overview",
      title: "Overview",
      content: (
        <>
          <Container>
            <Row>
              <Col>
                {/* Content for Overview tab */}
                <ItemInformation producedItem={producedItem} />
              </Col>
      
            </Row>
            <Row>
              <Col>   <TestData producedItem={producedItem} /> 
              </Col>
            </Row>

          </Container>
        </>
      ),
    },
    {
      eventKey: "notes",
      title: "Notes",
      content: (
        <MarkDownNotes
          markdownTextObj={producedItem?.description}
          onNotesUpdate={(text) =>
            updateProductionDescription(
              producedItem.id,
              "description",
              text,
              setRefresh
            )
          }
          projectId={getNestedModelObject(producedItem).project}
        />
      ),
    },
  ];

  return (
    <Container
      fluid
      className="mt-2 mainContainerWidth"
      style={{ paddingBottom: "1rem" }}
    >
      {producedItem ? (
        <>
          <NavLink to={"/production"}>
            <img
              className="icon-dark p-2 arrow-back"
              src="../../static/icons/arrow-left.svg"
              alt="icon"
              style={{ cursor: "pointer" }}
            />
          </NavLink>
          <Heading
            item_number={producedItem?.serial_number}
            display_name={
              producedItem?.assembly?.display_name ||
              producedItem?.pcba?.display_name ||
              producedItem?.part?.display_name
            }
          />
          <DokulyTabs tabs={tabs} basePath={`/production/${producedItemId}`} />
        </>
      ) : (
        <div className="text-center">
          <div className="spinner-border " role="status" />
        </div>
      )}
    </Container>
  );
};

export default DisplayProducedItem;

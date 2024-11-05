import React, { useEffect, useState } from "react";
import { Row, Col } from "react-bootstrap";
import { toast } from "react-toastify";

import { getPurchaseOrder, updatePurchaseOrder } from "../functions/queries"; // Make sure to have this function
import EditableMarkdown from "../../dokuly_components/dokulyMarkdown/editableMarkdown";
import DokulyCard from "../../dokuly_components/dokulyCard";
import CardTitle from "../../dokuly_components/cardTitle";
import MarkDownNotes from "../../common/markDownNotes/markDownNotes";

const Notes = ({ purchaseOrder: initialPurchaseOrder, setRefresh }) => {
  const [loading, setLoading] = useState(true);
  const [purchaseOrder, setPurchaseOrder] = useState(
    initialPurchaseOrder || {}
  );
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (initialPurchaseOrder) {
      setPurchaseOrder(initialPurchaseOrder);
      setLoading(false);
    } else {
      const url = window.location.href.toString();
      const split = url.split("/");
      const purchaseOrderID = Number.parseInt(split[5]);
      getPurchaseOrder(purchaseOrderID)
        .then((res) => {
          if (res.status === 200) {
            setPurchaseOrder(res.data);
            setLoading(false);
          } else {
            toast.error("Failed to fetch purchase order");
          }
        })
        .catch((error) => {
          toast.error(`Failed to fetch purchase order: ${error.message}`);
        });
    }
  }, [initialPurchaseOrder]);

  const handleMarkdownSubmit = (markdownText) => {
    if (markdownText === undefined || markdownText == null) {
      return;
    }

    const data = {
      id: purchaseOrder?.id,
      purchase_order_number: purchaseOrder?.purchase_order_number,
      notes: markdownText,
    };

    updatePurchaseOrder(data).then((res) => {
      if (res.status === 200) {
        setRefresh(true);
      }
    });
  };

  useEffect(() => {
    if (purchaseOrder?.notes) {
      const notesObject = { text: purchaseOrder.notes };
      setNotes(notesObject);
    }
  }, [purchaseOrder]);

  return (
    <MarkDownNotes
      markdownTextObj={notes}
      onNotesUpdate={(text) => handleMarkdownSubmit(text)}
      projectId={purchaseOrder.project}
    />
  );
};

export default Notes;

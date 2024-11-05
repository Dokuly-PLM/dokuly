import React, { useState, useRef, useEffect } from "react";
import { Form } from "react-bootstrap";
import { toast } from "react-toastify";

const TransactionInput = ({
  row,
  onSubmit,
  focusInput,
  quantityFromPoItem = 0,
  autoFocus,
}) => {
  const [transactionQuantity, setTransactionQuantity] = useState("0");

  useEffect(() => {
    if (quantityFromPoItem !== 0) {
      setTransactionQuantity(quantityFromPoItem.toString());
      row.transactionQuantity = quantityFromPoItem.toString();
    }
  }, [quantityFromPoItem]);

  // Create a ref for the input
  const inputRef = useRef(null);

  useEffect(() => {
    // If focusInput is true, focus the input and select the text
    if (focusInput && inputRef.current && autoFocus) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [focusInput]);

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      onSubmit(row);
    }
  };

  return (
    <Form.Group className="mr-2">
      <Form.Control
        ref={inputRef} // Attach the ref to the input
        type="number"
        value={transactionQuantity}
        onChange={(e) => {
          const value = e.target.value;
          if (value === "" || /^-?\d*$/.test(value)) {
            setTransactionQuantity(value);
            row.transactionQuantity = value;
          }
        }}
        onKeyDown={handleKeyDown}
        style={{ width: "5rem" }}
      />
    </Form.Group>
  );
};

export default TransactionInput;

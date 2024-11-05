import React from "react";
import { toast } from "react-toastify";
import { addNewPrice } from "./queries";

const AddPrice = ({
  app,
  id,
  setRefresh,
  numberOfPrices = 1,
  textSize = "16px",
}) => {
  let text = "Add price";

  if (numberOfPrices === 0) {
    text = "Manually add price";
  }
  const addItem = async () => {
    if (id === undefined) return;

    await addNewPrice(app, id).then((res) => {
      if (res.status === 201) {
        setRefresh(true);
        toast.success("Price item added successfully!");
      } else {
        toast.error("Error adding price item");
      }
    });
  };

  return (
    <button
      type="button"
      className="btn dokuly-bg-transparent ml-4 mb-2"
      data-toggle="tooltip"
      data-placement="top"
      title="Add a price to the list"
      onClick={addItem}
      //disabled={} // TODO Implement logic for disabling the button
    >
      <div className="row align-items-center">
        <img
          className="icon-dark mr-2"
          src="/static/icons/circle-plus.svg"
          alt="Add Icon"
          style={{ width: "24px", height: "24px" }}
        />
        <span style={{ fontSize: textSize }}>{text}</span>
      </div>
    </button>
  );
};

export default AddPrice;

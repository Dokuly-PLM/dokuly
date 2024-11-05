import React, { useState, useEffect } from "react";
import Select from "react-select";
import { toast } from "react-toastify";
import { getPartsTable } from "../functions/queries";
import { addNewAlternativePart } from "../functions/queries";

/**
 * # Button with form to create a new part.
 */
const AddAlternativePartForm = (props) => {
  // Form Fields
  const [part, setPart] = useState(null);
  const [parts, setParts] = useState([]);

  const launchForm = () => {
    $("#modal").modal("show");
    // Fetch parts table data and filter out the part with the same id as 'part.id'
    getPartsTable().then((res) => {
      // Check if the response status is 200 (OK)
      if (res.status === 200) {
        // Filter the data array to exclude the part with the same id as 'part.id'
        const filteredData = res.data.filter((obj) => obj.id !== props.part.id);
        // Update state with the filtered data
        setParts(filteredData);
        // Call the parent component's refresh function
        props.setRefresh(true);
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (part === null) {
      toast.error("Please select a part.");
      return;
    }

    addNewAlternativePart(props.part.id, part.key).then((res) => {
      if (res.status === 200) {
        toast.success("Alternative part added.");
        props.setRefresh(true);
        $("#modal").modal("hide");
      } else {
        toast.error("Something went wrong.");
      }
    });
  };

  return (
    <>
      <button
        type="button"
        className="btn btn-bg-transparent mt-2 mb-2"
        onClick={() => launchForm()}
      >
        <img
          className="icon-dark"
          src="../../static/icons/circle-plus.svg"
          alt="icon"
        />
      </button>

      {/* <!-- Modal --> */}
      <div
        className="modal fade"
        id="modal"
        tabIndex="-1"
        role="dialog"
        aria-hidden="true"
      >
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="addPartLabel">
                Add alternative part
              </h5>

              <button
                type="button"
                className="close"
                data-dismiss="modal"
                aria-label="Close"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="part">Part</label>
                <Select
                  options={parts.map((part) => {
                    return {
                      value: part.id,
                      label: `${part.full_part_number} - ${part.display_name} (${part.mpn})`,
                      key: part.id,
                    };
                  })}
                  onChange={(e) => {
                    setPart(e);
                  }}
                  placeholder="Select alternative part"
                  isSearchable={true}
                  isClearable={true}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn dokuly-bg-primary"
                onClick={(e) => handleSubmit(e)}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddAlternativePartForm;

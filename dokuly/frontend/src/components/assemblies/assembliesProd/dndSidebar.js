import React, { useEffect, useState } from "react";
import axios from "axios";
import { tokenConfig } from "../../../configs/auth";

// Need to make a hierarchy structure here, were we have a list of pcbas and for each pcba a list of prod pcba.

const DndSidebar = (props) => {
  const [dataRes, setDataRes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const partNumber = props.pn;

  let locationSplit = window.location.href.toString().split("/");
  let currentAssemblyID = locationSplit[locationSplit.length - 1];
  let pcbaID = locationSplit[locationSplit.length - 3];

  const onDrag = (event, production) => {
    event.dataTransfer.setData("reactflowData", production.serial_number);
    event.dataTransfer.setData("id", production.id);
    event.dataTransfer.setData("assembly_date", production.assembly_date);
    event.dataTransfer.setData("comment", production.comment);
    event.dataTransfer.setData("next_prod", production.next_prod);
    event.dataTransfer.setData("prev_prod", production.prev_prod);
    event.dataTransfer.setData("revision", production.revision);
    event.dataTransfer.setData("serial_number", production.serial_number);
    event.dataTransfer.setData("state", production.state);
    event.dataTransfer.setData("pcba_part_number", production.pcba_part_number);
    event.dataTransfer.effectAllowed = "move";
  };

  const getData = (id) => {
    axios
      .get(`api/production/${id}`, tokenConfig())
      .then((res) => {
        setDataRes(res.data);
      })
      .catch((err) => {
        setError(err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    getData(partNumber);
  }, [partNumber]);

  return (
    <aside>
      {loading ? (
        <div className="d-flex m-5 dokuly-primary justify-content-center">
          <div className="spinner-border" role="status"></div>
        </div>
      ) : (
        <div>
          {dataRes !== null && (
            <div>
              {dataRes
                .slice(0, 5)
                .sort(function (a, b) {
                  if (a.id < b.id) {
                    return -1;
                  }
                  if (a.id > b.id) {
                    return 1;
                  }
                  return 0;
                })
                .filter((production) => production.asm_serial_id == null)
                .map((production) => {
                  // Need to add filter here
                  const data = {
                    id: production.id,
                    assembly_date: production.assembly_date,
                    comment: production.comment,
                    next_prod: production.next_prod,
                    prev_prod: production.prev_prod,
                    revision: production.revision,
                    serial_number: production.serial_number,
                    state: production.state,
                    pcba_part_number: production.pcba_part_number,
                  };
                  return (
                    <div
                      id="nodeDiv"
                      key={production.id}
                      style={{
                        marginTop: "0.5rem",
                        borderColor: "#317a85ff",
                        cursor: "pointer",
                        borderRadius: "5px",
                        borderStyle: "solid",
                        minWidth: "8rem",
                        maxWidth: "12rem",
                      }}
                      className="dndnode"
                      onDragStart={(event) => onDrag(event, production)}
                      draggable={true}
                      data={data}
                    >
                      <h5
                        style={{
                          marginTop: "1rem",
                          marginBottom: "1rem",
                          marginLeft: "2rem",
                          marginRight: "2rem",
                        }}
                      >
                        {production.serial_number}{" "}
                      </h5>
                      <h5
                        style={{
                          marginTop: "1rem",
                          marginBottom: "1rem",
                          marginLeft: "2rem",
                          marginRight: "2rem",
                        }}
                      >
                        {"Part number: " + production.pcba_part_number}
                      </h5>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </aside>
  );
};

export default DndSidebar;

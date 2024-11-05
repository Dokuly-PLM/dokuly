import React, { Component, useState, useEffect } from "react";
import { Link, Navigate, NavLink } from "react-router-dom";

import { getRevisions } from "./functions/queries";

const PcbaRevisionList = (props) => {
  const [revision_list, SetRevisionList] = useState([]);
  const [pcba, setPcba] = useState(null);

  useEffect(() => {
    if (props.pcba != null && props.pcba !== undefined) {
      setPcba(props.pcba);
    }
  }, [props.pcba]);

  useEffect(() => {
    if (pcba != null && pcba !== undefined) {
      getRevisions(pcba.id).then((res) => {
        SetRevisionList(res.data);
      });
    }
  }, [pcba]);

  return (
    <React.Fragment>
      {pcba == null || pcba === undefined ? (
        ""
      ) : (
        <div className="dropdown">
          {pcba.revision}
          <button
            className="btn dropdown-toggle"
            type="button"
            id="dropdownMenuButton"
            data-toggle="dropdown"
            aria-haspopup="true"
            aria-expanded="false"
          />
          <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">
            {revision_list.length < 2 ||
            revision_list === undefined ||
            revision_list == null
              ? pcba.revision
              : revision_list
                  .sort(function (a, b) {
                    if (a.revision > b.revision) {
                      return 1;
                    } else if (a.revision < b.revision) {
                      return -1;
                    } else {
                      return 0;
                    }
                  })
                  .map((item) => {
                    return (
                      <NavLink
                        key={item.id}
                        className="dropdown-item"
                        to={`/pcbas/${item.id}`}
                      >
                        {item.revision}
                      </NavLink>
                    );
                  })}
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

export default PcbaRevisionList;

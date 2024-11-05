import React, { useEffect, useState } from "react";
import moment from "moment";

import ProjectEditForm from "../forms/projectEditForm";

export default function Information({ project, readOnly = false, setRefresh }) {
  return (
    <React.Fragment>
      {project == null || project === undefined ? (
        ""
      ) : (
        <div className="card-body bg-white m-3 card rounded">
          <div className="row mb-2">
            <div className="col-3">
              <h5>
                <b>Information</b>
              </h5>
            </div>
            {!readOnly && (
              <div className="col-3">
                <ProjectEditForm project={project} setRefresh={setRefresh} />
              </div>
            )}
          </div>

          <div className="row mb-2">
            <div className="col-3">
              <b>Project number:</b>
            </div>
            <div className="col">
              {project.full_number ? project.full_number : "N/A"}
            </div>
          </div>
          <div className="row mb-2">
            <div className="col-3">
              <b>Project owner:</b>
            </div>
            <div className="col">
              {project?.project_owner
                ? project.project_owner.first_name +
                  " " +
                  project.project_owner.last_name
                : "N/A"}
            </div>
          </div>

          <div className="row mb-2">
            <div className="col-3">
              <b>Customer:</b>
            </div>
            <div className="col">
              {project.customer ? project.customer.name : "N/A"}
            </div>
          </div>

          <div className="row">
            <div className="col-3">
              <b>Creation date:</b>
            </div>
            <div className="col">
              {moment(project.created_at).format("D.M.Y")}
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  );
}

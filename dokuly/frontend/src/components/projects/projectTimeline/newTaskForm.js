import React, { useState, useEffect } from "react";
import { Col, Form, Row } from "react-bootstrap";

import { newProjectTask } from "../functions/queries";
import EditableMarkdown from "../../dokuly_components/dokulyMarkdown/editableMarkdown";
import SubmitButton from "../../dokuly_components/submitButton";
import DokulyModal from "../../dokuly_components/dokulyModal";
import DokulyTags from "../../dokuly_components/dokulyTags/dokulyTags";
import DokulyCheckFormGroup from "../../dokuly_components/dokulyCheckFormGroup";

/**
 * # Project Task Addition Form
 *
 * Using a common selection module allows reuse, and implementation of more advanced search functions.
 *
 * @param {*} props 'project_id'
 *
 * ## Example
 *
 * ```js
 *
 * ```
 */
export const NewTaskForm = ({
  project_id = -1,
  setRefresh = () => {},
  addToGantDefault = false,
  project = {},
}) => {
  // Creates empty array of document.
  const [is_billable, setIsBillable] = useState(false);
  const [task_name, setTaskName] = useState("");
  const [description, setDescription] = useState("");
  const [is_gantt, setIsGantt] = useState(addToGantDefault);
  const [endError, setEndError] = useState(0);
  const [start, setStart] = useState(new Date().toISOString().split("T")[0]);
  const [end, setEnd] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  ); // 7 days from now

  const [show, setShow] = useState(false);
  const [taskTags, setTaskTags] = useState([]);

  useEffect(() => {
    if (end !== "" && end !== undefined && end !== null) {
      setEndError(-1);
    }
  }, [end]);

  function onSubmit() {
    if (is_gantt) {
      if (
        end === "" ||
        end === undefined ||
        end === null ||
        endError === 1 ||
        new Date(start) > new Date(end)
      ) {
        setEndError(1);
        return;
      }
    }
    const data = {
      // Fields used by the view.
      name: "--",
      description: description,
      is_billable: is_billable,
      is_gantt: is_gantt,
      start: start,
      end: end,
      tags: taskTags,
    };
    // Push data to the database
    newProjectTask(project_id, data)
      .then((res) => {
        if (res.status === 201) {
          setRefresh(true);
        }
      })
      .finally(() => {
        setTaskName("");
        setDescription("");
        setTaskTags([]);
        setIsGantt(false);
        setEnd(
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0]
        );
        setShow(false);
      });
  }

  return (
    <div>
      <div className="ml-3">
        <button
          type="button"
          className="btn dokuly-bg-transparent mt-2 mb-2"
          onClick={() => onSubmit()}
        >
          <div className="row">
            <img
              className="icon-dark"
              src="../../static/icons/circle-plus.svg"
              alt="icon"
            />
            <span className="btn-text">New task</span>
          </div>
        </button>
      </div>
    </div>
  );
};

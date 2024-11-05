import React from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { tokenConfig } from "../../../../configs/auth";

export const updateProjectTag = (data, tag_id) => {
  const promise = axios.put(
    `api/projects/put/tags/${tag_id}/`,
    data,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return toast.promise(dataPromise, {
    success: "Tag updated successfully",
    error: "Failed to update tag",
  });
};

export const deleteProjectTag = (tag_id) => {
  const promise = axios.delete(
    `api/projects/delete/tags/${tag_id}/`,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return toast.promise(dataPromise, {
    success: "Tag deleted successfully",
    error: "Failed to delete tag",
  });
};

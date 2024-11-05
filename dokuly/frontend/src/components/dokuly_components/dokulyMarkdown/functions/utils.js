import React from "react";
import { updateNotesTab } from "./queries";

export const updateMarkdownTab = (
  key,
  value,
  markdownObject,
  refreshNotesTabs = () => {},
  setEditingTabKey = () => {},
  setActiveKey = () => {}
) => {
  const data = {};
  data[key] = value;
  updateNotesTab(data, markdownObject.id)
    .then((res) => {})
    .finally(() => {
      refreshNotesTabs();
      setEditingTabKey(null); // Close edit mode after update
      if (key === "title") {
        setActiveKey(value.toLowerCase().replace(" ", "-"));
      }
    });
};

import React, { useEffect, useState, useRef } from "react";
import { Tabs, Tab, Container, Form, Row, Col, Nav } from "react-bootstrap";
import {
  addNewNotesTab,
  deleteNotesTab,
  updateNotesTab,
} from "./functions/queries";
import DeleteButton from "../deleteButton";
import { updateMarkdownTab } from "./functions/utils";
import ContextMenu from "../dokulyContextMenu/dokulyContextMenu";
import { toast } from "react-toastify";

const NotesTabs = ({
  tabs,
  appName,
  appObject,
  activeTab = "main",
  refreshNotesTabs = () => {},
  setActiveTab = () => {},
}) => {
  const [editingTabKey, setEditingTabKey] = useState(null);
  const [tabToEdit, setTabToEdit] = useState(null);
  const [tabTitle, setTabTitle] = useState("");
  const inputRef = useRef(null); // Reference to the input field
  const contextMenuActions = [
    {
      label: "Edit tab",
      onClick: (data) => {
        const title = data.title;
        const markdownComponent = data.markdownObject;
        const eventKey = data.eventKey;
        handleDoubleClick(eventKey, title, markdownComponent);
      },
    },
    {
      label: "Delete tab",
      onClick: (data) => {
        const markdownObject = data.markdownObject;
        handleDeleteTab(markdownObject);
      },
    },
  ];

  useEffect(() => {
    // Click outside listener to cancel edit mode
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setEditingTabKey(null); // Cancel editing if click is outside the input field
      }
    };

    if (editingTabKey) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editingTabKey]);

  const handleNewTab = () => {
    const currentTagsLength = tabs.filter(
      (tab) => tab.eventKey !== "new" && tab.eventKey !== "main"
    ).length;
    let uniqueTitle = `New tab ${currentTagsLength + 1}`;
    // Max 50 retries to find a unique title
    for (let i = 0; i < 50; i++) {
      if (!tabs.find((tab) => tab.title === uniqueTitle)) {
        break;
      }
      uniqueTitle = `New tab ${currentTagsLength + i}`;
    }

    const data = {
      app: appName,
      object_id: appObject.id,
      title: uniqueTitle,
    };
    addNewNotesTab(data)
      .then((res) => {
        refreshNotesTabs();
      })
      .finally(() => {
        setTimeout(() => {
          setActiveTab(uniqueTitle.toLowerCase().replace(" ", "-"));
        }, 150);
      });
  };

  const handleTitleUpdate = (eventKey) => {
    if (tabTitle.toLowerCase().replace(" ", "-") === "main") {
      toast.error("Tab title cannot be 'Main'. Please choose another title.");
      return;
    }
    updateMarkdownTab(
      "title",
      tabTitle,
      tabToEdit,
      refreshNotesTabs,
      setEditingTabKey,
      setActiveTab
    );
  };

  const handleDeleteTab = (tabToDelete) => {
    if (
      !confirm(
        `Are you sure you want to delete this tab? Tab: ${tabToDelete.title}`
      )
    ) {
      return;
    }
    deleteNotesTab(tabToDelete.id)
      .then((res) => {})
      .finally(() => {
        refreshNotesTabs();
        setEditingTabKey(null); // Close edit mode after deletion
        // Update activeTab state
        const newKey = "main";
        setActiveTab(newKey);

        // Store the selected tab in localStorage
        localStorage.setItem(`lastTab-${appName}`, newKey);
      });
  };

  const handleDoubleClick = (eventKey, currentTitle, markdownObject) => {
    if (eventKey === "new" || eventKey === "main") {
      return;
    }
    setTabTitle(currentTitle);
    setEditingTabKey(eventKey);
    setTabToEdit(markdownObject);
  };

  const handleSelect = (key) => {
    if (key === "new") {
      handleNewTab();
      return;
    }

    // Update activeTab state
    setActiveTab(key);

    // Store the selected tab in localStorage
    localStorage.setItem(`lastTab-${appName}`, key);
  };

  const getStyle = (eventKey, editingTabKey, activeTab, title, index) => {
    const style = {};
    if (eventKey === activeTab) {
      style.fontWeight = "bold";
    }
    if (index < tabs.length - 1) {
      style.borderRight = "1px solid #ced4da";
      style.paddingRight = "0.77rem";
    }
    if (eventKey === "main" && index === 0) {
      style.paddingRight = "0.77rem";
      style.borderRight = "1px solid #ced4da";
    }
    return style;
  };

  const handleKeyDown = (e, tab) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setEditingTabKey(null);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      handleTitleUpdate(tab.eventKey);
    }
    // Do not prevent default behavior for other keys
  };

  return (
    <Container fluid className="mt-4">
      <Tab.Container
        id="generic-tabs"
        activeKey={activeTab}
        onSelect={handleSelect}
        className="mb-3"
        transition={false}
      >
        <Row className="mx-1 align-items-center">
          {" "}
          <Nav>
            {tabs.map((tab, index) => (
              <ContextMenu key={tab.eventKey} actions={contextMenuActions}>
                {({ onContextMenu }) => (
                  <Nav.Item
                    as="li"
                    className={index === tabs.length - 2 ? "" : "mx-2"}
                    style={getStyle(
                      tab.eventKey,
                      editingTabKey,
                      activeTab,
                      tab.title,
                      index
                    )}
                    onContextMenu={(e) => {
                      if (tab.eventKey === "new" || tab.eventKey === "main") {
                        return;
                      }
                      onContextMenu(e, tab);
                    }}
                    onDoubleClick={() =>
                      handleDoubleClick(
                        tab.eventKey,
                        tab.title,
                        tab.markdownObject
                      )
                    }
                  >
                    {editingTabKey === tab.eventKey ? (
                      <Row className="d-flex align-items-center" ref={inputRef}>
                        <Col className="col-auto">
                          <Form.Control
                            type="text"
                            value={tabTitle}
                            onChange={(e) => {
                              setTabTitle(e.target.value);
                            }}
                            onBlur={() => handleTitleUpdate(tab.eventKey)}
                            onKeyDown={(e) => handleKeyDown(e, tab)}
                            autoFocus
                          />
                        </Col>
                        <Col className="col-auto">
                          <DeleteButton
                            onDelete={() => {
                              handleDeleteTab(tab);
                            }}
                            buttonText=""
                          />
                        </Col>
                      </Row>
                    ) : (
                      <Nav.Link eventKey={tab.eventKey}>{tab.title}</Nav.Link>
                    )}
                  </Nav.Item>
                )}
              </ContextMenu>
            ))}
          </Nav>
        </Row>
        <Tab.Content>
          {tabs.map((tab) => (
            <Tab.Pane eventKey={tab.eventKey} key={tab.eventKey}>
              {tab.content}
            </Tab.Pane>
          ))}
        </Tab.Content>
      </Tab.Container>
    </Container>
  );
};

export default NotesTabs;

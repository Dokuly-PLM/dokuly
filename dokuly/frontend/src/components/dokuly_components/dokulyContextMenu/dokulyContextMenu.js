// ContextMenu.js
import React, { useState, useEffect } from "react";
import { animated } from "react-spring";

const ContextMenu = ({ actions, children, animationProps }) => {
  const [state, setState] = useState({
    visible: false,
    x: 0,
    y: 0,
    data: null,
  });

  const handleContextMenu = (e, data) => {
    e.preventDefault();

    const offsetX = 10; // Pixels to the right
    const offsetY = 10; // Pixels below

    setState({
      visible: true,
      x: e.clientX + offsetX,
      y: e.clientY + offsetY,
      data,
    });
  };

  const handleClickOutside = () => {
    if (state.visible) {
      setState({ ...state, visible: false });
    }
  };

  useEffect(() => {
    if (state.visible) {
      document.addEventListener("click", handleClickOutside);
      return () => {
        document.removeEventListener("click", handleClickOutside);
      };
    }
  }, [state.visible]);

  return (
    <>
      {/* Provide the onContextMenu handler to children */}
      {children({ onContextMenu: handleContextMenu })}

      {state.visible && (
        <animated.ul
          className="dropdown-menu show"
          style={{
            position: "fixed",
            top: state.y,
            left: state.x,
            zIndex: 1000,
            ...animationProps,
          }}
          onClick={(e) => e.stopPropagation()} // Prevents closing when clicking inside
        >
          {actions && actions.length > 0 ? (
            actions.map((action, index) => (
              <li key={index}>
                <a
                  className="dropdown-item"
                  onClick={() => {
                    action.onClick(state.data);
                    setState({ ...state, visible: false });
                  }}
                >
                  {action.label}
                </a>
              </li>
            ))
          ) : (
            <div
              className="m-2"
              onClick={() => setState({ ...state, visible: false })}
            >
              No right-click menu items!
            </div>
          )}
        </animated.ul>
      )}
    </>
  );
};

export default ContextMenu;

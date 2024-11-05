import React, { useRef, useEffect, useState } from "react";
import { useSpring, animated } from "react-spring";
import DokulyFormSection from "./dokulyFormSection";
import { Col, Row } from "react-bootstrap";

const DropdownFormSection = ({
  isCollapsed,
  handleToggle,
  collapsedText = "",
  formGroups = [],
  wrapperClassname = "",
  className = "",
}) => {
  const [contentHeight, setContentHeight] = useState(0);
  const contentRef = useRef(null);

  // Measure the height of the content dynamically
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [isCollapsed]); // Dependency on isCollapsed to recalculate on toggle

  const expandCollapseStyle = useSpring({
    to: {
      maxHeight: isCollapsed ? "0px" : `${contentHeight + 10}px`,
      opacity: isCollapsed ? 0 : 1,
    },
    from: { maxHeight: "0px", opacity: 0 },
    config: { tension: 259, friction: 40 },
  });

  const rotate = useSpring({
    transform: isCollapsed ? "rotate(0deg)" : "rotate(180deg)",
    config: { tension: 300, friction: 20 },
  });

  return (
    <>
      <div className={`${className} d-flex align-items-center`}>
        <button
          type="button"
          className="btn btn-bg-transparent btn-less-side-padding d-flex justify-content-start align-items-center"
          onClick={handleToggle}
        >
          <animated.img
            style={rotate}
            src={"../../../../static/icons/chevron-down.svg"}
            alt={isCollapsed ? "expand" : "collapse"}
          />
          <span>{collapsedText}</span>
        </button>
        <div
          style={{
            flex: 1,
            borderBottom: "1px solid #ccc",
            marginLeft: "10px",
          }}
        ></div>
      </div>

      <animated.div
        className={wrapperClassname}
        style={expandCollapseStyle}
        ref={contentRef}
      >
        {!isCollapsed ? (
          <>
            {formGroups.map((formGroup, index) => {
              if (formGroup?.asGroup) {
                return (
                  <Row>
                    {formGroup.groups.map((group) => (
                      <Col key={group.id}>
                        <DokulyFormSection
                          onChange={group.onChange}
                          options={group?.options || []}
                          as={group.as}
                          label={group.label}
                          value={group.value}
                          showToolTip={group?.showToolTip || false}
                          tooltipText={group?.tooltipText || ""}
                          useCustomSelect={group?.useCustomSelect || false}
                          className={formGroup?.className || ""}
                          customSelectChildren={
                            group?.customSelectChildren || (() => {})
                          }
                        />
                      </Col>
                    ))}
                  </Row>
                );
              }
              return (
                <DokulyFormSection
                  key={formGroup.id}
                  onChange={formGroup.onChange}
                  options={formGroup?.options || []}
                  as={formGroup.as}
                  label={formGroup.label}
                  value={formGroup.value}
                  showToolTip={formGroup?.showToolTip || false}
                  tooltipText={formGroup?.tooltipText || ""}
                  className={formGroup?.className || ""}
                  useCustomSelect={formGroup?.useCustomSelect || false}
                  customSelectChildren={
                    formGroup?.customSelectChildren || (() => {})
                  }
                />
              );
            })}
          </>
        ) : (
          <></>
        )}
      </animated.div>
    </>
  );
};

export default DropdownFormSection;

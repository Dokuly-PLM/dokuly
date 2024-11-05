import React, { useState, useRef, useEffect } from "react";
import { Modal } from "react-bootstrap";
import { throttle } from "./funcitons/throttle";

const DokulyModal = ({ show, onHide, children, title, size = "md" }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const modalRef = useRef(null);
  const headerRef = useRef(null);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Throttle the `handleMouseMove` function to achieve 60 frames per second.
  const handleMouseMove = throttle((event) => {
    // Check if the modal is currently being dragged
    if (isDragging && modalRef.current && headerRef.current) {
      // Calculate the offset based on the starting position
      const offsetX = event.clientX - startPos.x;
      const offsetY = event.clientY - startPos.y;

      // Update the position based on the calculated offset
      setPosition({
        x: position.x + offsetX,
        y: position.y + offsetY,
      });

      // Update the starting position for the next event
      setStartPos({ x: event.clientX, y: event.clientY });

      // Update the modal's CSS transform property to reflect the new position
      modalRef.current.style.transform = `translate(${position.x}px, ${position.y}px)`;
    }
  }, 16); // Throttling to ~60fps
  // 1000ms / 60 frames = ~16.67ms per frame, rounded down to 16ms.

  useEffect(() => {
    if (!show) {
      return;
    }

    const headerElement = headerRef.current;
    const modalElement = modalRef.current;

    if (headerElement && modalElement) {
      headerElement.addEventListener("mousedown", handleMouseDown);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("mousemove", handleMouseMove);
    }

    return () => {
      if (headerElement && modalElement) {
        headerElement.removeEventListener("mousedown", handleMouseDown);
        window.removeEventListener("mouseup", handleMouseUp);
        window.removeEventListener("mousemove", handleMouseMove);
      }
    };
  }, [show, isDragging, position]);

  const dialogClassName =
    size === "full-screen" ? "modal-fullscreen" : "modal-dialog";

  return (
    <Modal
      size={size === "full-screen" ? "lg" : size}
      show={show}
      onHide={onHide}
      dialogClassName={dialogClassName}
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      ref={modalRef}
    >
      <Modal.Header
        ref={headerRef}
        style={isDragging ? { cursor: "grabbing" } : { cursor: "grab" }}
      >
        <Modal.Title>{title}</Modal.Title>
        <button type="button" className="close" onClick={onHide}>
          <span aria-hidden="true">&times;</span>
        </button>
      </Modal.Header>
      <Modal.Body>{children}</Modal.Body>
    </Modal>
  );
};

export default DokulyModal;

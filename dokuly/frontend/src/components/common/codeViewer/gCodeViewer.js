import React, { useEffect, useRef, useState } from 'react';
import { GCodeViewer } from "react-gcode-viewer";
import { toast } from 'react-toastify';

const GCodeViewerComponent = ({ fileUri }) => {
  const viewerRef = useRef(null);

  useEffect(() => {
    const applyDarkBackground = () => {
      const canvas = viewerRef.current.querySelector('canvas');
      if (canvas) {
        canvas.style.backgroundColor = 'black';
      }
    };

    applyDarkBackground();
    const observer = new MutationObserver(applyDarkBackground);
    observer.observe(viewerRef.current, { childList: true });

    return () => observer.disconnect();
  }, []);

  const style = {
    width: '100%',
    height: '100%',
  };



  return (
    <div ref={viewerRef} style={{ width: '100%', height: 'calc(100vh - 120px)' }} >
      <GCodeViewer
        orbitControls
        showAxes
        style={style}
        url={fileUri}
        onError={(error) => toast.error('Error loading GCode:', error)}
      />
    </div >
  );
}

export default GCodeViewerComponent;

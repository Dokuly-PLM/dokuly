import React, { useState, useEffect } from "react";
import { getFile } from "../filesTable/functions/queries";
import { diffLines } from "diff";
import { toast } from "react-toastify";
import SubmitButton from "../../dokuly_components/submitButton";

export default function TextDiffViewer({
  originalFileUri,
  originalBlobUrl,
  comparisonFileUri,
  comparisonBlobUrl,
  extension,
}) {
  const [originalContent, setOriginalContent] = useState("");
  const [comparisonContent, setComparisonContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [diffMode, setDiffMode] = useState("unified"); // "unified" or "side-by-side"

  useEffect(() => {
    if (originalFileUri && comparisonFileUri) {
      setLoading(true);
      
      // Always fetch from HTTP URIs (same approach as PdfComparisonViewer)
      // Don't rely on blob URLs which may be revoked
      const fetchOriginalText = async () => {
        if (originalFileUri && !originalFileUri.startsWith("blob:")) {
          const blob = await getFile(originalFileUri);
          return await blob.text();
        } else if (originalFileUri?.startsWith("blob:")) {
          // Fallback: try blob URL if HTTP URI not available
          const response = await fetch(originalFileUri);
          if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
          return await response.text();
        }
        throw new Error("No valid original URI provided");
      };
      
      const fetchComparisonText = async () => {
        if (comparisonFileUri && !comparisonFileUri.startsWith("blob:")) {
          const blob = await getFile(comparisonFileUri);
          return await blob.text();
        } else if (comparisonFileUri?.startsWith("blob:")) {
          // Fallback: try blob URL if HTTP URI not available
          const response = await fetch(comparisonFileUri);
          if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
          return await response.text();
        }
        throw new Error("No valid comparison URI provided");
      };
      
      Promise.all([
        fetchOriginalText(),
        fetchComparisonText(),
      ])
        .then(([original, comparison]) => {
          setOriginalContent(original);
          setComparisonContent(comparison);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching file contents:", error);
          toast.error("Failed to load file contents for comparison.");
          setLoading(false);
        });
    }
  }, [originalFileUri, comparisonFileUri]);

  const getDiff = () => {
    if (!originalContent || !comparisonContent) return [];
    return diffLines(originalContent, comparisonContent);
  };

  const renderUnifiedDiff = () => {
    const diff = getDiff();
    const lines = [];
    let lineNumber = 1;
    let originalLineNumber = 1;
    let comparisonLineNumber = 1;

    diff.forEach((part, index) => {
      const isAdded = part.added;
      const isRemoved = part.removed;
      const text = part.value;
      const partLines = text.split("\n");

      partLines.forEach((line, lineIndex) => {
        if (lineIndex === partLines.length - 1 && line === "") return; // Skip last empty line

        const lineKey = `${index}-${lineIndex}`;
        let className = "";
        let prefix = "";

        if (isAdded) {
          className = "diff-added";
          prefix = `+${comparisonLineNumber++}`;
        } else if (isRemoved) {
          className = "diff-removed";
          prefix = `-${originalLineNumber++}`;
        } else {
          prefix = ` ${originalLineNumber++}`;
          comparisonLineNumber++;
        }

        lines.push(
          <div key={lineKey} className={`diff-line ${className}`}>
            <span className="diff-line-number">{prefix}</span>
            <span className="diff-content">{line || " "}</span>
          </div>
        );
      });
    });

    return lines;
  };

  const renderSideBySideDiff = () => {
    const diff = getDiff();
    const leftLines = [];
    const rightLines = [];
    let originalLineNumber = 1;
    let comparisonLineNumber = 1;

    diff.forEach((part, index) => {
      const isAdded = part.added;
      const isRemoved = part.removed;
      const text = part.value;
      const partLines = text.split("\n");

      partLines.forEach((line, lineIndex) => {
        if (lineIndex === partLines.length - 1 && line === "") return;

        const lineKey = `${index}-${lineIndex}`;

        if (isRemoved) {
          leftLines.push({
            key: lineKey,
            content: line || " ",
            lineNumber: originalLineNumber++,
            className: "diff-removed",
          });
          rightLines.push({
            key: `${lineKey}-empty`,
            content: " ",
            lineNumber: null,
            className: "",
          });
        } else if (isAdded) {
          leftLines.push({
            key: `${lineKey}-empty`,
            content: " ",
            lineNumber: null,
            className: "",
          });
          rightLines.push({
            key: lineKey,
            content: line || " ",
            lineNumber: comparisonLineNumber++,
            className: "diff-added",
          });
        } else {
          leftLines.push({
            key: lineKey,
            content: line || " ",
            lineNumber: originalLineNumber++,
            className: "",
          });
          rightLines.push({
            key: lineKey,
            content: line || " ",
            lineNumber: comparisonLineNumber++,
            className: "",
          });
        }
      });
    });

    return (
      <div className="diff-side-by-side">
        <div className="diff-panel diff-left">
          <div className="diff-header">Original</div>
          {leftLines.map((line) => (
            <div key={line.key} className={`diff-line ${line.className}`}>
              <span className="diff-line-number">{line.lineNumber || " "}</span>
              <span className="diff-content">{line.content}</span>
            </div>
          ))}
        </div>
        <div className="diff-panel diff-right">
          <div className="diff-header">Comparison</div>
          {rightLines.map((line) => (
            <div key={line.key} className={`diff-line ${line.className}`}>
              <span className="diff-line-number">{line.lineNumber || " "}</span>
              <span className="diff-content">{line.content}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return <div>Loading files for comparison...</div>;
  }

  return (
    <div className="text-diff-viewer">
      <div className="diff-controls mb-3">
        <SubmitButton
          onClick={() => setDiffMode("unified")}
          className={diffMode === "unified" ? "" : "btn-outline-primary"}
          style={diffMode === "unified" ? { fontSize: "14px", padding: "4px 8px" } : { borderColor: "#007bff", color: "#007bff", backgroundColor: "transparent", fontSize: "14px", padding: "4px 8px" }}
        >
          Unified
        </SubmitButton>
        <SubmitButton
          onClick={() => setDiffMode("side-by-side")}
          className={diffMode === "side-by-side" ? "" : "btn-outline-primary"}
          style={diffMode === "side-by-side" ? { fontSize: "14px", padding: "4px 8px" } : { borderColor: "#007bff", color: "#007bff", backgroundColor: "transparent", fontSize: "14px", padding: "4px 8px" }}
        >
          Side by Side
        </SubmitButton>
      </div>
      <div className="diff-container">
        {diffMode === "unified" ? renderUnifiedDiff() : renderSideBySideDiff()}
      </div>
      <style>{`
        .text-diff-viewer {
          font-family: 'Courier New', monospace;
          font-size: 11px;
          line-height: 1.4;
        }
        .diff-container {
          max-height: 70vh;
          overflow: auto;
          border: 1px solid #ddd;
          background: #1e1e1e;
          color: #d4d4d4;
        }
        .diff-line {
          display: flex;
          white-space: pre;
        }
        .diff-line-number {
          display: inline-block;
          width: 60px;
          padding: 0 10px;
          text-align: right;
          background: #252526;
          color: #858585;
          user-select: none;
          border-right: 1px solid #3e3e42;
        }
        .diff-content {
          flex: 1;
          padding: 0 10px;
        }
        .diff-added {
          background: #1e4620;
        }
        .diff-added .diff-content {
          color: #4ec9b0;
        }
        .diff-removed {
          background: #5a1d1d;
        }
        .diff-removed .diff-content {
          color: #f48771;
        }
        .diff-side-by-side {
          display: flex;
        }
        .diff-panel {
          flex: 1;
          border-right: 1px solid #3e3e42;
        }
        .diff-panel:last-child {
          border-right: none;
        }
        .diff-header {
          padding: 10px;
          background: #2d2d30;
          font-weight: bold;
          border-bottom: 1px solid #3e3e42;
        }
      `}</style>
    </div>
  );
}


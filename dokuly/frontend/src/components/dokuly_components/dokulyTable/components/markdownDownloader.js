import React from "react";
import sortData from "../functions/sortUtils";
import { toast } from "react-toastify";

const MarkdownDownloader = ({
  data,
  columns,
  sortedColumn,
  sortOrder,
  textSize = "14px",
}) => {
  // Function to generate a Markdown string from the original data prop
  const generateMarkdownData = () => {
    const sortedMarkdownData = sortData(data, sortedColumn, sortOrder);

    // Filter columns based on includeInCsv property
    const includedColumns = columns.filter(
      (column) => column.includeInCsv !== false,
    );

    // Create header row
    const headerRow = includedColumns
      .map((column) => column.header)
      .join(" | ");
    const separatorRow = includedColumns.map(() => "---").join(" | ");
    const markdownRows = [`| ${headerRow} |`, `| ${separatorRow} |`];

    // Create data rows
    sortedMarkdownData.forEach((row) => {
      const rowData = includedColumns
        .map((column) => {
          let cellData;
          if (column.csvFormatter) {
            // If a custom CSV formatter is defined, use it
            cellData = column.csvFormatter(row, column);
          } else if (column.formatter) {
            // If a formatter is defined, use it for the CSV data
            cellData = column.formatter(row, column);
          } else {
            // Use the raw data if no formatter is defined
            cellData = row[column.key];
          }

          // Check if the cellData is a React element
          if (React.isValidElement(cellData)) {
            // Extract and use the text content of the React element
            cellData = cellData.props.children;
          }

          // Handle objects by converting them to JSON strings
          if (typeof cellData === "object" && cellData !== null) {
            cellData = JSON.stringify(cellData);
          }

          return cellData;
        })
        .join(" | ");

      markdownRows.push(`| ${rowData} |`);
    });

    return markdownRows.join("\n");
  };

  // Function to handle the Markdown copy to clipboard
  const handleMarkdownCopy = () => {
    const markdownData = generateMarkdownData();
    navigator.clipboard.writeText(markdownData).then(
      () => {
        toast.success("Markdown copied to clipboard!");
      },
      (err) => {
        toast.error(`Failed to copy markdown: ${err.message}`);
      },
    );
  };

  return (
    <button
      type="button"
      className="btn dokuly-btn-transparent p-0"
      title="Copy table in markdown format to clipboard"
      onClick={handleMarkdownCopy}
    >
      <img
        className="icon-dark"
        src="../../static/icons/clipboard.svg"
        alt="icon"
      />
      <span className="btn-text ml-1" style={{ fontSize: textSize }}>
        Markdown
      </span>
    </button>
  );
};

export default MarkdownDownloader;

import React from "react";
import DokulyTable from "../../dokulyTable/dokulyTable";

const DokulyMarkdownTable = ({ children, ...props }) => {
  const data = [];
  const columns = [];

  // Process markdown table children to extract data and columns
  React.Children.forEach(children, (child) => {
    if (child.type === "thead") {
      React.Children.forEach(child.props.children, (row) => {
        const cells = React.Children.map(row.props.children, (cell) =>
          cell?.props?.children ? cell.props.children[0] : "",
        );
        columns.push(
          ...cells.map((cell, index) => ({
            key: `col-${index}`,
            header: cell,
          })),
        );
      });
    } else if (child.type === "tbody") {
      React.Children.forEach(child.props.children, (row) => {
        const rowData = {};
        React.Children.forEach(row.props.children, (cell, index) => {
          rowData[`col-${index}`] = cell?.props?.children
            ? cell.props.children[0]
            : "";
        });
        data.push(rowData);
      });
    }
  });

  return (
    <div className="dokuly-markdown-table-container">
      <DokulyTable
        tableName="MarkdownTable"
        data={data}
        columns={columns}
        showColumnSelector={false}
        itemsPerPage={data.length} // No pagination
        textSize="13px"
        showSearch={false}
        showCsvDownload={false}
        onRowClick={() => {}}
        isMarkdownTable
        {...props}
      />
    </div>
  );
};

export default DokulyMarkdownTable;

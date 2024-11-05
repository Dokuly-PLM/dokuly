import React from "react";
import { mathSymbols } from "./mathSymbols";
import DokulyDropdown from "../../dokulyDropdown";
import GridTable from "../../gridTable";

const SymbolsDropdown = ({
  rows,
  cols,
  rowClassName,
  colClassName,
  onSelect,
  closeDropdown,
}) => {
  const gridItems = mathSymbols.slice(0, rows * cols);

  return (
    <DokulyDropdown
      title="Symbols"
      className="btn-bg-transparent"
      menuStyle={{ width: "30vh", padding: "0.5rem 1.5rem 0.5rem 1.5rem" }}
    >
      {({ closeDropdown }) => (
        <GridTable
          rows={rows}
          cols={cols}
          items={gridItems}
          rowClassName={rowClassName}
          colClassName={`symbol-grid-item d-flex justify-content-center ${colClassName}`}
          colStyle={{ cursor: "pointer" }}
          onSelect={(symbol) => {
            onSelect(symbol);
            closeDropdown();
          }}
        />
      )}
    </DokulyDropdown>
  );
};

export default SymbolsDropdown;

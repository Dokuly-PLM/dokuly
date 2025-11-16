import React from "react";
import DeleteItemButton from "../../common/bom/deleteItemButton";
import DnmEditor from "../../common/bom/dnmEditor";
import QuantityEditor from "../../common/bom/quantityEditor";
import DesignatorEditor from "../../common/bom/designatorEditor";
import PartNumberEditor from "../../common/bom/partNumberEditor";
import GenericDropdownSelector from "../dokulyTable/components/genericDropdownSelector";

export const getBomTableColumns = ({
  setRefreshBom,
  isLockedBom,
  expandPnCol,
  setExpandPnCol,
  organizationCurrency,
  app,
  partInformationColumns,
  handleClick,
  releaseStateFormatter,
  convertPriceToOrganizationCurrency,
  designatorHeader,
  designatorHeaderTooltip,
  thumbnailFormatter,
  currencyPairs,
  organization,
  includeSelector = false,
  supplierOptions = [],
  handleSelectDropdown = () => {},
  handleRowSelect = () => {},
}) => {
  const columns = [
    {
      key: "full_part_number",
      header: "Part Number",
      headerTooltip: "Dokulys unique part number.",
      sort: true,
      formatter: (row) => {
        return (
          <PartNumberEditor
            row={row}
            setRefreshBom={setRefreshBom}
            is_locked_bom={isLockedBom}
            setExpandCol={setExpandPnCol}
            organization={organization}
          />
        );
      },
      csvFormatter: (row) => {
        if (!(row.part || row.assembly || row.pcba)) {
          return "";
        }
        if (row?.full_part_number) {
          // full_part_number already contains the properly formatted part number with revision
          return row.full_part_number;
        }
        return "Unknown";
      },
      // Enhanced search functionality for part numbers
      searchValue: (row) => {
        const searchTerms = [];
        
        // Add properly formatted part number with revision
        if (row?.full_part_number) {
          // full_part_number already contains the properly formatted part number with revision
          searchTerms.push(row.full_part_number);
        }
        
        
        // Add MPN for cross-reference searches
        if (row?.mpn) {
          searchTerms.push(row.mpn);
        }
        
        // Add temporary MPN for imported BOMs
        if (row?.temporary_mpn && row.temporary_mpn !== "-") {
          searchTerms.push(row.temporary_mpn);
        }
        
        return searchTerms.join(" ");
      },
      includeInCsv: true,
      defaultShowColumn: true,
      maxWidth: includeSelector ? "100px" : expandPnCol ? "500px" : "160px",
    },
    {
      key: "thumbnail",
      header: "Thumbnail",
      formatter: thumbnailFormatter,
      includeInCsv: false,
      defaultShowColumn: true,
      maxWidth: "150px",
    },
    {
      key: "display_name",
      header: "Display Name",
      csvFormatter: (row) => (row?.display_name ? `${row?.display_name}` : ""),
      // Enhanced search functionality for display names
      searchValue: (row) => {
        const searchTerms = [];
        
        // Add display name
        if (row?.display_name) {
          searchTerms.push(row.display_name);
        }
        
        // Add description if available
        if (row?.description) {
          searchTerms.push(row.description);
        }
        
        // Add manufacturer for manufacturer-based searches
        if (row?.manufacturer) {
          searchTerms.push(row.manufacturer);
        }
        
        return searchTerms.join(" ");
      },
      defaultShowColumn: true,
      maxWidth: includeSelector ? "400px" : expandPnCol ? "160px" : "800px",
    },
    {
      key: "mpn",
      header: "MPN",
      headerTooltip: "Manufacturer Part Number",
      sort: true,
      formatter: (row) => (
        // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
        <span
          onClick={() => handleClick(row.mpn)}
          title="Copy"
          style={{
            cursor: "pointer",
            padding: "5px",
            borderRadius: "5px",
          }}
        >
          {row.mpn}
        </span>
      ),
      csvFormatter: (row) => (row.mpn ? `${row.mpn}` : ""),
      // Enhanced search functionality for MPN
      searchValue: (row) => {
        const searchTerms = [];
        
        // Add MPN
        if (row?.mpn) {
          searchTerms.push(row.mpn);
        }
        
        // Add temporary MPN for imported BOMs
        if (row?.temporary_mpn && row.temporary_mpn !== "-") {
          searchTerms.push(row.temporary_mpn);
        }
        
        // Add manufacturer for manufacturer-based searches
        if (row?.manufacturer) {
          searchTerms.push(row.manufacturer);
        }
        
        return searchTerms.join(" ");
      },
      includeInCsv: true,
      defaultShowColumn: true,
      maxWidth: includeSelector ? "200px" : expandPnCol ? "160px" : "800px",
    },
    {
      key: "release_state",
      header: "State",
      formatter: (row, cell) => releaseStateFormatter(row),
      csvFormatter: (row) => (row?.release_state ? `${row.release_state}` : ""),
      includeInCsv: true,
      defaultShowColumn: true,
    },
    {
      key: "designator",
      header: designatorHeader,
      headerTooltip: designatorHeaderTooltip,
      formatter: (row) => (
        <DesignatorEditor
          row={row}
          setRefreshBom={setRefreshBom}
          is_locked_bom={isLockedBom}
        />
      ),
      csvFormatter: (row) => (row?.designator ? `${row.designator}` : ""),
      // Enhanced search functionality for designators
      searchValue: (row) => {
        const searchTerms = [];
        
        // Add designator
        if (row?.designator) {
          searchTerms.push(row.designator);
        }
        
        // Add comment for comment-based searches
        if (row?.comment) {
          searchTerms.push(row.comment);
        }
        
        return searchTerms.join(" ");
      },
      includeInCsv: true,
      defaultShowColumn: true,
      maxWidth: expandPnCol ? "200px" : "600px",
    },
    {
      key: "quantity",
      header: "Quantity",
      formatter: (row) => (
        <QuantityEditor
          row={row}
          setRefreshBom={setRefreshBom}
          is_locked_bom={isLockedBom || includeSelector}
        />
      ),
      csvFormatter: (row) => (row?.quantity ? `${row.quantity}` : ""),
      includeInCsv: true,
      defaultShowColumn: true,
      maxWidth: expandPnCol ? "70px" : "200px",
    },
    {
      key: "part_type",
      header: "Part Type",
      formatter: (row) => <span>{row?.part_type?.name || ""}</span>,
      csvFormatter: (row) =>
        row?.part_type?.name ? `${row.part_type.name}` : "",
      includeInCsv: true,
      defaultShowColumn: false,
    },
    {
      key: "manufacturer",
      header: "Manufacturer",
      formatter: (row) => <span>{row?.manufacturer || ""}</span>,
      csvFormatter: (row) => (row?.manufacturer ? `${row.manufacturer}` : ""),
      includeInCsv: true,
      defaultShowColumn: false,
    },
    {
      key: "prices",
      header: `Price in ${organizationCurrency} (MOQ)`,
      headerTooltip: "Price and Minimum Order Quantity (MOQ)",
      formatter: (row) => {
        if (!row.prices || row.prices.length === 0) {
          return "-";
        }
        const lowestMOQPrice = row.prices.reduce((lowest, current) => {
          if (
            !lowest ||
            current.minimum_order_quantity < lowest.minimum_order_quantity
          ) {
            return current;
          }
          return lowest;
        }, null);
        const price = convertPriceToOrganizationCurrency(
          lowestMOQPrice.price,
          lowestMOQPrice.currency || row.part_information?.currency_price,
          currencyPairs,
          organization
        );
        return `${price.toFixed(2)} (${lowestMOQPrice.minimum_order_quantity})`;
      },
      csvFormatter: (row) => {
        if (!row.prices || row.prices.length === 0) {
          return "-";
        }
        const lowestMOQPrice = row.prices.reduce((lowest, current) => {
          if (
            !lowest ||
            current.minimum_order_quantity < lowest.minimum_order_quantity
          ) {
            return current;
          }
          return lowest;
        }, null);
        const price = convertPriceToOrganizationCurrency(
          lowestMOQPrice.price,
          lowestMOQPrice.currency || row.part_information?.currency_price,
          currencyPairs,
          organization
        );
        return `${price.toFixed(2)} (${lowestMOQPrice.minimum_order_quantity})`;
      },
      includeInCsv: true,
      defaultShowColumn: true,
    },
  ];

  if (app === "pcbas") {
    columns.push({
      key: "is_mounted",
      header: "DNM",
      headerTooltip:
        '"Do Not Mount". Check this box to exclude the part from the BOM.',
      formatter: (row) => (
        <DnmEditor
          row={row}
          setRefreshBom={setRefreshBom}
          is_locked_bom={isLockedBom}
        />
      ),
      csvFormatter: (row) => (row.is_mounted ? "" : "DNM"),
      includeInCsv: true,
      defaultShowColumn: true,
      maxWidth: "75px",
    });
  }

  for (const key of partInformationColumns) {
    columns.push({
      key: key,
      header: key,
      headerTooltip: key,
      formatter: (row) => `${row?.part_information?.[key] || ""}`,
      csvFormatter: (row) => `${row?.part_information?.[key] || ""}`,
      includeInCsv: true,
      defaultShowColumn: false,
    });
  }

  if (!isLockedBom) {
    columns.push({
      key: "",
      header: "Action",
      formatter: (row) => (
        <DeleteItemButton row={row} setRefreshBom={setRefreshBom} />
      ),
      includeInCsv: false,
    });
  }

  if (!includeSelector) {
    const rohs_col = {
      key: "is_rohs_compliant",
      header: "RoHS",
      formatter: (row) => (
        <span>
          {row?.item_type !== "part" ? (
            "-"
          ) : row?.is_rohs_compliant ? (
            <img
              src="../../../../static/icons/rohs_green.svg"
              alt="Yes"
              className="icon-dark"
            />
          ) : (
            "No"
          )}
        </span>
      ),
      csvFormatter: (row) =>
        row?.item_type !== "part" ? "-" : row?.is_rohs_compliant ? "Yes" : "No",
      includeInCsv: true,
      defaultShowColumn: true,
      maxWidth: "50px",
    };
    // Add RoHS column before actions column
    const actionsIndex = columns.findIndex(
      (column) => column.header === "Action"
    );
    columns.splice(actionsIndex, 0, rohs_col);
  }

  if (includeSelector) {
    const selectorColumn = {
      key: "selector",
      maxWidth: "60px",
      sort: false,
      includeInCsv: false,
      header: "Ignored",
      formatter: (row) => {
        return (
          <input
            type="checkbox"
            className="dokuly-checkbox-warning"
            checked={row.ignored || false}
            onClick={(e) => {
              handleRowSelect(row, e.target.checked);
            }}
            style={{ height: "20px", width: "20px", marginLeft: "0.55rem" }}
          />
        );
      },
    };
    const supplierCol = {
      key: "supplier",
      header: "Supplier",
      editable: true,
      formatter: (row) => {
        const prices = row?.prices ?? row?.part?.prices ?? [];
        const suppliersInPrices = prices.map((price) => price?.supplier?.id);

        const supplierIdsSeen = new Set();
        const formattedSupplierOptions = supplierOptions
          .filter((supplier) => {
            const isValid = supplier?.id && !supplierIdsSeen.has(supplier.id);
            if (isValid) supplierIdsSeen.add(supplier.id);
            return isValid && suppliersInPrices.includes(supplier.id);
          })
          .map((supplier) => ({
            value: supplier.id,
            label: supplier.name || "Unknown Supplier",
          }));

        const lowestPriceSupplier = prices?.reduce((lowest, current) => {
          if (
            !lowest ||
            current.price < lowest.price ||
            (current.price === lowest.price &&
              current.minimum_order_quantity < lowest.minimum_order_quantity)
          ) {
            return current;
          }
          return lowest;
        }, null);

        const defaultSupplier = formattedSupplierOptions.find(
          (supplier) => supplier.value === lowestPriceSupplier?.supplier?.id
        );

        // Use row.selected_supplier or default to defaultSupplier if it is null or undefined
        const initialState = row.selected_supplier
          ? {
              value: row.selected_supplier.id,
              label: row.selected_supplier.name || "Unknown Supplier",
            }
          : defaultSupplier
          ? {
              value: defaultSupplier.value,
              label: defaultSupplier.label,
            }
          : null;

        // Determine the placeholder based on available options
        const placeholderText =
          formattedSupplierOptions.length > 0
            ? "Select supplier"
            : "No suppliers found for part";

        return (
          <GenericDropdownSelector
            state={initialState?.value}
            setState={(value) => handleSelectDropdown(row, value)}
            dropdownValues={formattedSupplierOptions}
            placeholder={placeholderText}
            borderIfPlaceholder={true}
            borderColor="red"
            textSize={"12px"}
            readOnly={formattedSupplierOptions.length === 0}
          />
        );
      },
    };
    // Remove actions column if it exists
    const actionsIndex = columns.findIndex(
      (column) => column.header === "Action"
    );
    if (actionsIndex > -1) {
      columns.splice(actionsIndex, 1);
    }
    const fnIndex = columns.findIndex((column) => column.header === "F/N");
    if (fnIndex > -1) {
      columns.splice(fnIndex, 1);
    }
    const priceIndex = columns.findIndex((column) => column.key === "prices");
    if (priceIndex > -1) {
      columns.splice(priceIndex, 1);
    }
    columns.push(supplierCol);
    columns.push(selectorColumn);
  }
  return columns;
};

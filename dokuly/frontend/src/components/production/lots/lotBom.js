import React, { useEffect, useState } from "react";
import DokulyTable from "../../dokuly_components/dokulyTable/dokulyTable";
import DokulyCard from "../../dokuly_components/dokulyCard";
import CardTitle from "../../dokuly_components/cardTitle";
import { Col, Row } from "react-bootstrap";
import QuantityEditor from "../../common/bom/quantityEditor";
import DesignatorEditor from "../../common/bom/designatorEditor";
import { thumbnailFormatter } from "../../dokuly_components/formatters/thumbnailFormatter";
import { releaseStateFormatter } from "../../dokuly_components/formatters/releaseStateFormatter";
import AddButton from "../../dokuly_components/AddButton";
import { useNavigate } from "react-router";
import ProductionProgress from "../components/productionProgress";
import useSuppliers from "../../common/hooks/useSuppliers";
import { ThumbnailFormatter } from "../../dokuly_components/dokulyTable/functions/formatters";
import BomToPOForm from "../../dokuly_components/dokulyBom/bomToPOForm";
import useOrganization from "../../common/hooks/useOrganization";
import useCurrencyConversions from "../../common/hooks/useCurrencyConversions";
import NoDataFound from "../../dokuly_components/dokulyTable/components/noDataFound";

const LotBom = ({
  bom,
  app,
  lot,
  lotQuantity = 0,
  currentProducedCount = 0,
  refreshKey = false,
  setRefreshBom = () => {},
}) => {
  const navigate = useNavigate();
  const [bomCopy, setBomCopy] = useState([]);
  const [open, setOpen] = useState(false);
  const [partInformationColumns, setPartInformationColumns] = useState([]);

  const [suppliers, refreshSuppliers, loadingSuppliers, errorSuppliers] =
    useSuppliers();

  const [organization, refreshOrganization, loading] = useOrganization();

  const {
    currencyPairs,
    currencyKeys,
    conversionRate,
    fetchCurrencyConversions,
    loadingCurrency,
    errorCurrency,
  } = useCurrencyConversions(organization?.currency ?? "USD"); // Default currency can be set here

  const isLockedBom = true;
  let designatorHeader = "F/N";
  let designatorHeaderTooltip =
    '"Find Number". A unique identifier for a part in the assembly.';
  if (app === "pcbas") {
    designatorHeader = "Ref.Des.";
    designatorHeaderTooltip =
      '"Reference Designator". A unique identifier for a part in the PCBA.';
  }

  const initialOrderQuantity =
    (lot?.quantity ?? lotQuantity) - currentProducedCount;

  const handlePOFromBom = () => {
    const selectedItems = bom.map((item) => {
      let newItem = {
        ...item,
        ignored: false,
        isPoBomItem: true,
      };

      if (item.assembly) {
        newItem = {
          ...newItem,
          ...item.assembly,
          assembly: item.assembly.id,
        };
      }

      if (item.pcba) {
        newItem = {
          ...newItem,
          ...item.pcba,
          pcba: item.pcba.id,
        };
      }

      if (item.part) {
        newItem = {
          ...newItem,
          ...item.part,
          part: item.part.id,
        };
      }

      if (initialOrderQuantity > 1) {
        newItem = {
          ...newItem,
          quantity: item.quantity * initialOrderQuantity,
        };
      }

      return newItem;
    });

    setBomCopy(selectedItems);
    setOpen(true);
  };

  useEffect(() => {
    if (bom && bom.length > 0) {
      bom.forEach((item, index) => {
        const currentStock =
          item?.part?.current_total_stock ||
          item?.assembly?.current_total_stock ||
          item?.pcba?.current_total_stock ||
          0;

        const onOrderStock = item?.on_order_stock || 0;
        // Total stock of the part in the inventory
        const totalStock = currentStock + onOrderStock;
        // Total quantity missing for completing the production lot
        const totalQuantity =
          item.quantity * lotQuantity - currentProducedCount;
        const missingStock = totalQuantity - totalStock;
        if (missingStock > 0) {
          bom[index].missing_stock = missingStock;
        } else {
          bom[index].missing_stock = 0;
        }
      });
    }
  }, [bom, currentProducedCount]);

  const columns = [
    {
      key: "full_part_number",
      header: "Part Number",
      headerTooltip: "dokuly's unique part number.",
      sort: true,
      formatter: (row) => {
        if (!(row.part || row.assembly || row.pcba)) {
          return "";
        }
        if (row.part) {
          return `${row.part.full_part_number}${row.part.revision}`;
        } else if (row.assembly) {
          return `${row.assembly.full_part_number}${row.assembly.revision}`;
        }
        return `${row.pcba.full_part_number}${row.pcba.revision}`;
      },
      csvFormatter: (row) => {
        if (!(row.part || row.assembly || row.pcba)) {
          return "";
        }
        if (row.part) {
          return `${row.part.full_part_number}${row.part.revision}`;
        } else if (row.assembly) {
          return `${row.assembly.full_part_number}${row.assembly.revision}`;
        }
        return `${row.pcba.full_part_number}${row.pcba.revision}`;
      },
      includeInCsv: true,
      defaultShowColumn: true,
      maxWidth: "60px",
    },
    {
      key: "thumbnail",
      header: "Thumbnail",
      formatter: (row) => {
        const rowPart = row?.part || row?.assembly || row?.pcba;
        return thumbnailFormatter(rowPart);
      },
      includeInCsv: false,
      defaultShowColumn: true,
      maxWidth: "60px",
    },
    {
      key: "display_name",
      header: "Display Name",
      formatter: (row) => {
        const displayName =
          row?.pcba?.display_name ||
          row?.part?.display_name ||
          row?.assembly?.display_name ||
          "-";
        return displayName;
      },
      csvFormatter: (row) => {
        const displayName =
          row?.pcba?.display_name ||
          row?.part?.display_name ||
          row?.assembly?.display_name ||
          "-";
        return displayName;
      },
      defaultShowColumn: true,
      maxWidth: "160px",
    },
    {
      key: "mpn",
      header: "MPN",
      headerTooltip: "Manufacturer Part Number",
      sort: true,
      formatter: (row) => {
        const mpn =
          row?.part?.mpn || row?.assembly?.mpn || row?.pcba?.mpn || "-";
        // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
        <span
          onClick={() => handleClick(mpn)}
          title="Copy"
          style={{
            cursor: "pointer",
            padding: "5px",
            borderRadius: "5px",
          }}
        >
          {mpn}
        </span>;
      },
      csvFormatter: (row) => {
        const mpn =
          row?.part?.mpn || row?.assembly?.mpn || row?.pcba?.mpn || "-";
        return mpn;
      },
      includeInCsv: true,
      defaultShowColumn: false,
      maxWidth: "160px",
    },
    {
      key: "release_state",
      header: "State",
      formatter: (row, cell) => {
        const rowPart = row?.part || row?.assembly || row?.pcba;
        return rowPart ? releaseStateFormatter(rowPart) : ""; // Handle null or undefined rowPart
      },
      csvFormatter: (row) => {
        const releaseState =
          row?.part?.release_state ||
          row?.assembly?.release_state ||
          row?.pcba?.release_state ||
          ""; // Handle null or undefined release_state in each part
        return releaseState;
      },
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
      includeInCsv: true,
      defaultShowColumn: true,
      maxWidth: "200px",
    },
    {
      key: "quantity",
      header: "Quantity",
      headerTooltip: "The quantity needed for the production lot.",
      formatter: (row) => {
        return (
          <QuantityEditor
            row={row}
            setRefreshBom={setRefreshBom}
            is_locked_bom={isLockedBom || includeSelector}
            productionQuantity={lotQuantity}
            displayProductionQuantity={true}
            displayOnlyProductionQuantity={true}
          />
        );
      },
      csvFormatter: (row) => (row?.quantity ? `${row.quantity}` : ""),
      includeInCsv: true,
      defaultShowColumn: true,
      maxWidth: "70px",
    },
    {
      key: "current_total_stock",
      header: "Total Stock",
      headerTooltip: "The current total stock of the part in the inventory.",
      formatter: (row) => {
        const totalStock =
          row?.part?.current_total_stock ||
          row?.assembly?.current_total_stock ||
          row?.pcba?.current_total_stock ||
          0;
        return totalStock;
      },
      csvFormatter: (row) => {
        const totalStock =
          row?.part?.current_total_stock ||
          row?.assembly?.current_total_stock ||
          row?.pcba?.current_total_stock ||
          0;
        return totalStock;
      },
      includeInCsv: true,
      defaultShowColumn: true,
      maxWidth: "70px",
    },
    {
      key: "on_order_stock",
      header: "On Order",
      headerTooltip: "The current on order stock of the part.",
      formatter: (row) => {
        const onOrderStock = row?.on_order_stock || 0;
        return onOrderStock;
      },
      csvFormatter: (row) => {
        const onOrderStock = row?.on_order_stock || 0;
        return onOrderStock;
      },
      includeInCsv: true,
      defaultShowColumn: true,
      maxWidth: "70px",
    },
    {
      key: "missing_stock",
      header: "Missing",
      headerTooltip:
        "The stock needed to complete the production lot based on the quantity to be produced.",
      formatter: (row) => {
        const missingStock = row?.missing_stock || 0;
        return missingStock;
      },
      csvFormatter: (row) => {
        const missingStock = row?.missing_stock || 0;
        return missingStock;
      },
      includeInCsv: true,
      defaultShowColumn: false,
      maxWidth: "70px",
    },
    {
      key: "supplier",
      header: "Supplier",
      formatter: (row) => {
        const rowPricing = row?.part?.prices;
        let thumbnail = "";
        if (rowPricing && rowPricing.length > 0) {
          thumbnail = rowPricing[0]?.supplier?.thumbnail;
        }
        return (
          <Row>
            <Col className="col-6">
              <ThumbnailFormatter thumbnail={thumbnail} />
            </Col>
          </Row>
        );
      },
      csvFormatter: (row) => {
        const rowPricing = row?.part?.prices;
        if (rowPricing && rowPricing.length > 0) {
          return rowPricing[0]?.supplier?.name || "";
        }
        return ""; // Return an empty string if no supplier info is available
      },
      sort: true,
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
  ];

  const onNavigate = (selectedItem) => {
    let url = "";
    if (selectedItem?.pcba) {
      url = `/pcbas/${selectedItem?.pcba.id}`;
    } else if (selectedItem?.assembly) {
      url = `/assemblies/${selectedItem?.assembly.id}`;
    } else if (selectedItem?.part) {
      url = `/parts/${selectedItem?.part.id}`;
    }
    if (url) {
      navigate(url);
    }
  };

  const handleRowClick = (index) => {
    const selectedItem = bom[index];
    if (event.ctrlKey || event.metaKey) {
      let url = "";
      if (selectedItem.pcba) {
        url = `/#/pcbas/${selectedItem.pcba.id}`;
      } else if (selectedItem.assembly) {
        url = `/#/assemblies/${selectedItem.assembly.id}`;
      } else if (selectedItem.part) {
        url = `/#/parts/${selectedItem.part.id}`;
      }
      if (url) {
        window.open(url, "_blank");
      }
    }
  };

  const handleClick = (value) => {
    navigator.clipboard.writeText(value).then(
      () => {},
      (err) => {
        toast.error("Failed to copy: ", err);
      }
    );
  };

  return (
    <DokulyCard>
      <CardTitle titleText="Bill of Materials" />
      <Row>
        {!loadingSuppliers && (
          <BomToPOForm
            bomData={bomCopy}
            setBomData={setBomCopy}
            show={open}
            onHide={() => setOpen(false)}
            setShow={setOpen}
            openForm={handlePOFromBom}
            setRefreshBom={setRefreshBom}
            designator_header={designatorHeader}
            designator_header_tooltip={designatorHeaderTooltip}
            partInformationColumns={partInformationColumns}
            handleClick={handleClick}
            expandPnCol={false}
            setExpandPnCol={() => {}}
            organization={organization}
            app={app}
            isLockedBom={isLockedBom}
            currencyPairs={currencyPairs}
            suppliers={suppliers}
            connectToLot={true}
            lotId={lot?.id}
            initialOrderQuantity={initialOrderQuantity}
          />
        )}
      </Row>
      <Row>
        {bom && app !== "parts" ? (
          <>
            {bom.length === 0 ? (
              <NoDataFound />
            ) : (
              <DokulyTable
                tableName="LotBomTable"
                data={bom}
                columns={columns}
                showColumnSelector={true}
                itemsPerPage={100000} // No pagination
                onRowClick={(index) => handleRowClick(index)}
                navigateColumn={true}
                onNavigate={(row) => onNavigate(row)}
                textSize="16px"
                renderChildrenNextToSearch={
                  <Col sm={6} md={6} lg={4} xl={4} className="mt-1">
                    <ProductionProgress
                      lot={lot}
                      currentProducedCount={currentProducedCount ?? 0}
                      firstColClassname="col-auto"
                    />
                  </Col>
                }
              />
            )}
          </>
        ) : (
          <div className="m-5">No BOM for current production</div>
        )}
      </Row>
    </DokulyCard>
  );
};

export default LotBom;

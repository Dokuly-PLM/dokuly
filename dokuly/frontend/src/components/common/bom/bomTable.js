import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import { Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import DokulyTable from "../../dokuly_components/dokulyTable/dokulyTable";
import { getBom, getBomItemsById, getLinkedParts } from "./functions/queries";
import { buildBomObject } from "./functions/buildBomObject";
import { separateBomItemIDs } from "./functions/separateBomItemIDs";
import { thumbnailFormatter } from "../../dokuly_components/formatters/thumbnailFormatter";
import AddItemButton from "./addItemButton";
import { releaseStateFormatter } from "../../dokuly_components/formatters/releaseStateFormatter";
import BomImportButton from "./bomImport/bomImportButton";
import { ClearBomButton } from "./clearBomButton";
import { usePartTypes } from "../../parts/partTypes/usePartTypes";
import DokulyCard from "../../dokuly_components/dokulyCard";
import CardTitle from "../../dokuly_components/cardTitle";
import useCurrencyConversions from "../hooks/useCurrencyConversions";
import { getBomTableColumns } from "../../dokuly_components/dokulyBom/getBomCols";
import BomToPOForm from "../../dokuly_components/dokulyBom/bomToPOForm";
import useSuppliers from "../hooks/useSuppliers";
import NoDataFound from "../../dokuly_components/dokulyTable/components/noDataFound";

export const convertPriceToOrganizationCurrency = (
  price,
  currency,
  conversionRate,
  organization
) => {
  if (!currency || currency === organization?.currency) {
    return Number.parseFloat(price);
  }

  const rate = conversionRate[currency];
  if (!rate) {
    return Number.parseFloat(price);
  }
  return Number.parseFloat(price) / rate;
};

const BomTable = ({
  app, // "assemblies" or "pcbas"
  id, // assembly.id or pcba.id
  is_locked_bom,
  showTable = true, // This is a hack to hide the table while keeping the bom items in state.
  organization = { currency: "USD" },
  refreshBomIssues = () => {},
  refreshKey = false,
}) => {
  const navigate = useNavigate();
  const partTypes = usePartTypes();
  const {
    currencyPairs,
    currencyKeys,
    conversionRate,
    fetchCurrencyConversions,
    loadingCurrency,
    errorCurrency,
  } = useCurrencyConversions("USD"); // Default currency can be set here

  const [tableTextSize, setTableTextSize] = useState("14px");

  const [refresh_bom, setRefreshBom] = useState(true);
  const [database_bom, setDatatbaseBom] = useState(null);
  const [bom, setBom] = useState([]);
  const [bom_items, setBomItems] = useState([]);
  const [parts, setParts] = useState([]);
  const [assemblies, setAssemblies] = useState([]);
  const [pcbas, setPcbas] = useState([]);
  const [expandPnCol, setExpandPnCol] = useState(false);
  const [partInformationColumns, setPartInformationColumns] = useState([]);
  const [isCorrectCurrencySet, setIsCorrectCurrencySet] = useState(false);
  const [open, setOpen] = useState(false);
  const [bomCopy, setBomCopy] = useState([]);

  const [suppliers, refreshSuppliers, loadingSuppliers, errorSuppliers] =
    useSuppliers();

  const fetchBomData = useCallback(() => {
    if (id) {
      getBom(id, app).then((res) => {
        if (res.status === 200) {
          setDatatbaseBom(res.data);
        }
      });

      getBomItemsById(id, app).then((res) => {
        setBomItems(res);
      });
    }
  }, [id, app]);

  let designator_header = "F/N";
  let designator_header_tooltip =
    '"Find Number". A unique identifier for a part in the assembly.';
  if (app === "pcbas") {
    designator_header = "Ref.Des.";
    designator_header_tooltip =
      '"Reference Designator". A unique identifier for a part in the PCBA.';
  }

  useEffect(() => {
    if (refresh_bom === false) {
      return;
    }

    fetchBomData();
    refreshBomIssues();
    setRefreshBom(false);
  }, [refresh_bom, fetchBomData]);

  useEffect(() => {
    fetchBomData();
  }, [id, fetchBomData]);

  useEffect(() => {
    const { pcbaIds, assemblyIds, partIds } = separateBomItemIDs(bom_items);
    if (bom_items) {
      getLinkedParts(assemblyIds, partIds, pcbaIds)
        .then((res) => {
          setParts(res?.parts || []);
          setAssemblies(res?.asms || []);
          setPcbas(res?.pcbas || []);
        })
        .catch((err) => {
          toast.error(err.message || "Error fetching BOM items");
          setParts([]);
          setAssemblies([]);
          setPcbas([]);
        });
    }
  }, [bom_items]);

  useEffect(() => {
    if (bom_items && Array.isArray(bom_items) && parts && pcbas && assemblies) {
      const mergedBom = buildBomObject(
        bom_items,
        parts,
        pcbas,
        assemblies,
        partTypes
      );

      // Make new rows with placeholder MPN ("-") appear at the top
      mergedBom.sort((a, b) => {
        const aIsNew =
          a?.temporary_mpn === "-" || a?.mpn === undefined || a?.mpn === "";
        const bIsNew =
          b?.temporary_mpn === "-" || b?.mpn === undefined || b?.mpn === "";

        if (aIsNew && !bIsNew) return -1; // a goes first
        if (bIsNew && !aIsNew) return 1; // b goes first
        return 0; // Otherwise, no change
      });

      setBom(mergedBom);
    }
  }, [bom_items, pcbas, assemblies, parts, partTypes]);

  useEffect(() => {
    if (organization) {
      fetchCurrencyConversions(organization.currency).then(() => {
        setIsCorrectCurrencySet(true);
      });
    }
  }, [organization]);

  useEffect(() => {
    const uniqueKeys = new Set();
    parts.forEach((part) => {
      if (part.part_information) {
        Object.keys(part.part_information).forEach((key) => {
          uniqueKeys.add(key);
        });
      }
    });
    setPartInformationColumns(Array.from(uniqueKeys));
  }, [parts]);

  // Trigger recalculation when currency data is loaded
  useEffect(() => {
    if (isCorrectCurrencySet && !loadingCurrency && currencyPairs) {
      setRefreshBom(true);
    }
  }, [loadingCurrency, currencyPairs]);

  const handlePOFromBom = () => {
    const selectedItems = bom.map((item) => {
      return {
        ...item,
        ignored: false,
        isPoBomItem: true,
      };
    });
    setBomCopy(selectedItems);
    setOpen(true);
  };

  // Define the onClick handler inside the formatter function
  const handleClick = (value) => {
    navigator.clipboard.writeText(value).then(
      () => {},
      (err) => {
        toast.error("Failed to copy: ", err);
      }
    );
  };

  if (
    loadingCurrency ||
    !currencyPairs ||
    !organization?.currency ||
    !isCorrectCurrencySet
  ) {
    return <div>Loading currency data...</div>;
  }

  if (errorCurrency) {
    return <div>Error loading currency data: {errorCurrency}</div>;
  }

  const columnConfiguration = {
    setRefreshBom: setRefreshBom,
    isLockedBom: is_locked_bom,
    expandPnCol: expandPnCol,
    setExpandPnCol: setExpandPnCol,
    organizationCurrency: organization?.currency,
    app: app,
    partInformationColumns: partInformationColumns,
    handleClick: handleClick,
    releaseStateFormatter: releaseStateFormatter,
    convertPriceToOrganizationCurrency: convertPriceToOrganizationCurrency,
    designatorHeader: designator_header,
    designatorHeaderTooltip: designator_header_tooltip,
    thumbnailFormatter: thumbnailFormatter,
    currencyPairs: currencyPairs,
    organization: organization,
  };

  const columns = getBomTableColumns(columnConfiguration);

  const handleRowClick = (index) => {
    const selectedItem = bom[index];
    if (event.ctrlKey || event.metaKey) {
      let url = "";
      if (selectedItem.pcba) {
        url = `/#/pcbas/${selectedItem.pcba}`;
      } else if (selectedItem.assembly) {
        url = `/#/assemblies/${selectedItem.assembly}`;
      } else if (selectedItem.part) {
        url = `/#/parts/${selectedItem.part}`;
      }
      if (url) {
        window.open(url, "_blank");
      }
    }
  };

  const onNavigate = (selectedItem) => {
    let url = "";
    if (selectedItem.pcba) {
      url = `/pcbas/${selectedItem.pcba}`;
    } else if (selectedItem.assembly) {
      url = `/assemblies/${selectedItem.assembly}`;
    } else if (selectedItem.part) {
      url = `/parts/${selectedItem.part}`;
    }
    if (url) {
      navigate(url);
    }
  };

  return (
    showTable && (
      <DokulyCard>
        <CardTitle titleText="Bill of Materials" />
        {bom != null && (
          <React.Fragment>
            <Row>
              <AddItemButton
                bom_id={database_bom?.id}
                is_locked_bom={is_locked_bom}
                setRefreshBom={setRefreshBom}
              />
              <ClearBomButton
                bom_id={database_bom?.id}
                is_locked_bom={is_locked_bom}
                setRefreshBom={setRefreshBom}
              />
              <BomImportButton
                app={app}
                bom_id={database_bom?.id}
                is_locked_bom={is_locked_bom}
                setRefreshBom={setRefreshBom}
                showDnmDropdown={app === "pcbas"}
                showBomIgnoreDropdown={app === "pcbas"}
              />
              {!loadingSuppliers && (
                <BomToPOForm
                  bomData={bomCopy}
                  setBomData={setBomCopy}
                  show={open}
                  onHide={() => setOpen(false)}
                  setShow={setOpen}
                  openForm={handlePOFromBom}
                  setRefreshBom={setRefreshBom}
                  designator_header={designator_header}
                  designator_header_tooltip={designator_header_tooltip}
                  partInformationColumns={partInformationColumns}
                  handleClick={handleClick}
                  expandPnCol={expandPnCol}
                  setExpandPnCol={setExpandPnCol}
                  organization={organization}
                  app={app}
                  isLockedBom={is_locked_bom}
                  currencyPairs={currencyPairs}
                  suppliers={suppliers}
                />
              )}
            </Row>
            <Row>
              {bom.length === 0 ? (
                <NoDataFound />
              ) : (
                <DokulyTable
                  tableName="BomTable"
                  data={bom}
                  columns={columns}
                  showColumnSelector={true}
                  itemsPerPage={100000} // No pagination
                  onRowClick={(index) => handleRowClick(index)}
                  navigateColumn={true}
                  onNavigate={(row) => onNavigate(row)}
                  textSize={tableTextSize}
                  setTextSize={setTableTextSize}
                  showTableSettings={true}
                />
              )}
            </Row>
            {!is_locked_bom && (
              <React.Fragment>
                <Row className="mt-2">
                  <Col>
                    <p className="text-muted">
                      <small>
                        <b>Click</b> a cell to edit the data.
                      </small>
                    </p>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <p className="text-muted">
                      <small>
                        <b>Ctrl+click</b> to open item in new tab.
                      </small>
                    </p>
                  </Col>
                </Row>
              </React.Fragment>
            )}
          </React.Fragment>
        )}
      </DokulyCard>
    )
  );
};

export default BomTable;

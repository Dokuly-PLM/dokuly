import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

import { getBomCost } from "../functions/queries";
import PriceVsQuantityChart from "./priceVsQuantityChart";
import useCurrencyConversions from "../../hooks/useCurrencyConversions";
import MissingPricesList from "../../priceCard/missingPricesList";


const BomCost = ({ refresh, app = "", id = -1 }) => {
  const [priceBreaks, setPriceBreaks] = useState([]);
  const [currency, setCurrency] = useState("");
  const [partsMissingPrice, setPartsMissingPrice] = useState([]);
  const [partsMissingPriceDetails, setPartsMissingPriceDetails] = useState([]);
  const [priceBreakQuantitites, setPriceBreakQuantitites] = useState([]);
  const [showMissingPriceTooltip, setShowMissingPriceTooltip] = useState(false);

  const { updatedAt } = useCurrencyConversions(currency);

  useEffect(() => {
    if (!(id > 0 && app)) {
      return;
    }

    getBomCost(id, app)
      .then((res) => {
        if (res.status === 200) {
          setCurrency(res.data.currency);
          setPriceBreakQuantitites(res.data.price_break_quantitites);
          setPriceBreaks(res.data.price_breaks);
          setPartsMissingPrice(res.data.parts_missing_price);
          const missingDetails = res.data.parts_missing_price_details || [];
          setPartsMissingPriceDetails(missingDetails);

        } else {
          toast.error('Failed to get BOM cost:', res);
        }
      })
      .catch((error) => {
        toast.error('Error fetching BOM cost:', error);
      });
  }, [id, app, refresh]);

  return (
    <React.Fragment>
      {
        priceBreaks.length > 0 ? (
          <PriceVsQuantityChart 
            priceBreaks={priceBreaks} 
            currency={currency} 
            updatedAt={updatedAt}
          />
        ) : ("")
      }
      {partsMissingPriceDetails.length > 0 && (
        <div className="d-flex justify-content-center" style={{ position: "relative" }}>
          <div
            onMouseEnter={() => setShowMissingPriceTooltip(true)}
            onMouseLeave={() => setShowMissingPriceTooltip(false)}
          >
            <span 
              className="badge badge-pill badge-danger mx-4 my-4"
              style={{ cursor: "pointer" }}
            >
              {partsMissingPriceDetails.length} parts missing price!
            </span>
            <MissingPricesList 
              parts={partsMissingPriceDetails} 
              show={showMissingPriceTooltip}
              textSize="12px"
              style={{
                top: "100%",
                left: "50%",
                transform: "translateX(-50%)",
                marginTop: "5px",
              }}
            />
          </div>
        </div>
      )}
    </React.Fragment >
  );
};

export default BomCost;

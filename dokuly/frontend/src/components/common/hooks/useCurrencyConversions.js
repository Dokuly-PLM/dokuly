import { useState, useEffect } from "react";
import { getCurrencyConversions } from "../../parts/functions/queries";

/**
 * Custom hook to fetch currency conversion data and manage related states.
 *
 * @param {string} currency - The currency code to get the conversion rate for.
 * @return {Object} An object containing states for currencyPairs, currencyKeys, conversionRate, and a refetch function.
 *
 * @example
 * const { currencyPairs, currencyKeys, conversionRate, fetchCurrencyConversions, loading, error } = useCurrencyConversions(currency);
 */
function useCurrencyConversions(currency) {
  const [currencyPairs, setCurrencyPairs] = useState([]);
  const [currencyKeys, setCurrencyKeys] = useState([]);
  const [conversionRate, setConversionRate] = useState({});
  const [updatedAt, setUpdatedAt] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrencyConversions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCurrencyConversions();
      if (res?.data) {
        // Handle both old format (direct object) and new format (with rates/updated_at)
        const rates = res.data.rates || res.data;
        const timestamp = res.data.updated_at || null;
        
        setCurrencyPairs(rates);
        setCurrencyKeys(Object.keys(rates));
        setConversionRate(rates);
        setUpdatedAt(timestamp);

        const dataToCache = {
          data: rates,
          updated_at: timestamp,
          timestamp: new Date().getTime(),
        };

        localStorage.setItem(
          "currencyConversions",
          JSON.stringify(dataToCache)
        );
      }
    } catch (error) {
      console.error("Failed to fetch currency conversions:", error);
      setError(error?.message || "Unable to fetch currency conversions");
    } finally {
      setLoading(false);
    }
  };

  const loadCachedData = () => {
    const cachedData = localStorage.getItem("currencyConversions");
    if (cachedData) {
      try {
        const parsedData = JSON.parse(cachedData);
        const oneDay = 24 * 60 * 60 * 1000;
        const currentTime = new Date().getTime();
        if (currentTime - parsedData.timestamp < oneDay) {
          if (parsedData.data[currency] === 1) {
            setCurrencyPairs(parsedData.data);
            setCurrencyKeys(Object.keys(parsedData.data));
            setConversionRate(parsedData.data);
            setUpdatedAt(parsedData.updated_at || null);
            setLoading(false);
            return true;
          }
          localStorage.removeItem("currencyConversions");
        }
      } catch (error) {
        console.error("Failed to parse cached data:", error);
        localStorage.removeItem("currencyConversions");
      }
    }
    return false;
  };

  useEffect(() => {
    if (!loadCachedData()) {
      fetchCurrencyConversions();
    }
  }, [currency]);

  return {
    currencyPairs,
    currencyKeys,
    conversionRate,
    updatedAt,
    fetchCurrencyConversions,
    loading,
    error,
  };
}

export default useCurrencyConversions;

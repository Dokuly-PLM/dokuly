import React from "react";
import PropTypes from "prop-types";

const DokulyPriceFormatter = ({
  price,
  organization,
  supplier,
  className = "",
  returnRawPriceFormatted = false,
  purchaseOrder = {},
}) => {
  const formatPrice = (price, currency) => {
    if (!currency) {
      return "Currency not defined";
    }

    const validCurrency = currency.includes("/")
      ? currency.split("/")[1]
      : currency;

    const numericPrice = Number(price);
    if (Number.isNaN(numericPrice)) {
      return "Invalid price";
    }

    try {
      return numericPrice.toLocaleString("en-US", {
        style: "currency",
        currency: validCurrency,
      });
    } catch (error) {
      return `Invalid currency format: ${validCurrency}`;
    }
  };

  const convertPrice = (
    price,
    supplierCurrency,
    organizationCurrency,
    rates
  ) => {
    if (!rates) {
      return "No conversion rates defined";
    }

    if (!supplierCurrency) {
      return "Supplier currency not defined";
    }

    // Normalize currency codes
    const normalizedSupplierCurrency = supplierCurrency?.toUpperCase();
    const normalizedOrgCurrency = organizationCurrency?.toUpperCase();

    // If both currencies are the same, return the original price formatted
    if (normalizedSupplierCurrency === normalizedOrgCurrency) {
      return formatPrice(price, organizationCurrency);
    }

    let convertedPrice = price;

    // Convert from supplier currency to organization currency if necessary
    if (normalizedSupplierCurrency !== normalizedOrgCurrency) {
      const supplierToOrgRate = rates[normalizedSupplierCurrency];
      if (!supplierToOrgRate) {
        return `No conversion rate from ${supplierCurrency} to ${organizationCurrency}`;
      }
      convertedPrice /= supplierToOrgRate;
    }

    // Return the formatted price in the target currency
    return formatPrice(convertedPrice, organizationCurrency);
  };

  const rawPriceFormatted = formatPrice(price, supplier?.default_currency);
  const convertedPriceFormatted = convertPrice(
    price,
    supplier?.default_currency,
    organization?.currency,
    organization?.currency_conversion_rates
  );

  if (returnRawPriceFormatted) {
    const formattedPrice = price.toLocaleString("en-US", {
      style: "currency",
      currency: purchaseOrder?.po_currency || "USD",
    });
    return <div className={className}>{formattedPrice}</div>;
  }

  return <div className={className}>{convertedPriceFormatted}</div>;
};

DokulyPriceFormatter.propTypes = {
  price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  organization: PropTypes.shape({
    currency: PropTypes.string.isRequired,
    currency_conversion_rates: PropTypes.objectOf(PropTypes.number).isRequired,
  }).isRequired,
  supplier: PropTypes.shape({
    currency: PropTypes.string.isRequired,
  }).isRequired,
};

export default DokulyPriceFormatter;

import React from "react";

const convertPriceToOrganizationCurrency = (
  price,
  currency,
  conversionRate,
  organizationCurrency
) => {
  if (!currency || currency === organizationCurrency) {
    return Number.parseFloat(price);
  }
  const rate = conversionRate[currency];
  if (!rate) {
    return Number.parseFloat(price);
  }
  return Number.parseFloat(price) / rate;
};

export const totalPriceFormatter = (
  row,
  currency,
  conversionRate,
  organizationCurrency
) => {
  if (!row.price || !row.quantity) {
    return "-";
  }

  if (!conversionRate) {
    return "Conversion rate not found";
  }

  if (!currency || organizationCurrency === currency) {
    return `${(row.price * row.quantity).toFixed(2)}`;
  }

  // Convert the price per unit first
  const convertedUnitPrice = convertPriceToOrganizationCurrency(
    row.price,
    row?.part_information?.currency_price,
    conversionRate,
    organizationCurrency
  );

  // Then multiply by quantity
  const totalPrice = convertedUnitPrice * row.quantity;

  return `${totalPrice.toFixed(2)}`;
};

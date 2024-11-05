import React, { Component } from "react";

export function CalculateStock(inventory, locations, part) {
  let partStock = { part: "", location: "", stock: 0, locationID: "" };
  let partStockArray = [];
  let initArray = false;

  inventory.map((inventory) => {
    if (inventory.part === part.id) {
      let locationExtists = false;
      partStockArray.length < 1
        ? (partStockArray.push({
            part: inventory.part,
            stock: inventory.quantity,
            locationID: inventory.location,
            owner: inventory.owner,
          }),
          (locationExtists = true),
          (initArray = true))
        : "";

      partStockArray.map((stockLocation) => {
        if (
          parseInt(stockLocation.locationID) === parseInt(inventory.location) &&
          !initArray
        ) {
          stockLocation.stock += parseInt(inventory.quantity);
          locationExtists = true;
        } else if (initArray) {
          initArray = false;
        }
      });
      !locationExtists
        ? partStockArray.push({
            part: inventory.part,
            stock: inventory.quantity,
            locationID: inventory.location,
            owner: inventory.owner,
          })
        : "";
    }
  });

  partStockArray.map((partStock) => {
    partStock.stock == 0 ? (partStock.stock = "") : "";
    locations.map((location) => {
      if (partStock.locationID === location.id && partStock.stock != "") {
        location.container_type == "Matrix"
          ? (partStock.location =
              location.container_type +
              " " +
              location.container_number +
              " - " +
              location.container_column +
              location.container_row +
              "\n\r")
          : (partStock.location =
              location.location_column +
              location.location_row +
              ": " +
              location.container_type +
              "\n\r");
      }
    });
    partStock.stock += "\n\r";
  });

  return partStockArray;
}

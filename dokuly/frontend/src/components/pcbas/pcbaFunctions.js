import React, { Component } from "react";
import { GenerateBomListfromPcba } from "./billOfMaterials/generateBomListfromPcba";

export function calculateBoMPrice(props, pcba) {
  let totalPrice = 0;

  let bom = GenerateBomListfromPcba(props, pcba);

  bom.map((bomItem) => {
    if(bomItem != null && bomItem != undefined) {
      let numberOfRefdes = 1;
      isNaN(bomItem?.price)
        ? ""
        : (totalPrice +=
            bomItem?.price *
            (numberOfRefdes + bomItem?.refdes?.split(",").length - 1));
      }
  });

  return totalPrice;
}

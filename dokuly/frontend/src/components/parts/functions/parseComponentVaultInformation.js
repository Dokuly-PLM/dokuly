export const parse_cv_data = (part) => {
  if (part == null) {
    return;
  }

  const mpn = part.mpn || "";
  const partInfo = part.part_information || {};

  const display_name = partInfo["Description"] || "";
  const description = partInfo["Detailed Description"] || "";

  const priceData = getLatestSingleQuantityPrice(part?.price_history);
  const price = priceData.price || 0;
  const distributor = priceData.distributor || "";
  const currency = priceData.currency || "";

  const manufacturer = part.manufacturer || partInfo["Manufacturer"] || "";

  const datasheet_link = extractDatasheetLink(partInfo);

  const part_type = guess_part_type(description);
  const image_link = partInfo["image_link"] || "";

  const price_history = part?.price_history;
  const stock = part?.stock;
  const part_information = filterEmptyValues(part?.part_information);
  const urls = part?.urls;

  return {
    mpn,
    display_name,
    description,
    price,
    currency,
    manufacturer,
    distributor,
    datasheet_link,
    part_type,
    image_link,
    price_history,
    stock,
    part_information,
    urls,
  };
};

function filterEmptyValues(obj) {
  return Object.entries(obj)
    .filter(([key, value]) => value !== "")
    .reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
}

function extractDatasheetLink(partInfo) {
  if (!partInfo["Datasheet"]) {
    return "";
  }

  if (Array.isArray(partInfo["Datasheet"])) {
    return partInfo["Datasheet"][0] || "";
  }

  if (typeof partInfo["Datasheet"] === "string") {
    const datasheetString = partInfo["Datasheet"].trim();

    // Check if it looks like a list
    if (datasheetString.startsWith("[") && datasheetString.endsWith("]")) {
      try {
        const cleanedString = datasheetString
          .slice(1, -1)
          .replace(/'/g, '"')
          .trim();
        let firstLink = cleanedString.split(",")[0].trim();

        // Remove surrounding double quotes if present
        if (firstLink.startsWith('"') && firstLink.endsWith('"')) {
          firstLink = firstLink.slice(1, -1);
        }

        return firstLink;
      } catch (error) {
        //console.error("Failed to extract link from Datasheet string:", error);
      }
    }
  }

  return "";
}

// TODO find out if the first, or last item in the array is the latest  price.
/**
 * Uses lowest quantity of the latest price.
 * @param {*} priceHistoryArray
 * @returns
 */
function getLatestSingleQuantityPrice(priceHistoryArray) {
  if (!priceHistoryArray || priceHistoryArray.length === 0) {
    return { price: 0, distributor: "", currency: "" };
  }

  let latestPrice = 0;
  let latestDistributor = "";
  let currency = "";

  for (const entry of priceHistoryArray) {
    let priceHistory;

    // Check if the entry is a string and attempt to clean and parse it
    if (typeof entry === "string") {
      try {
        // Replace single quotes with double quotes and attempt to parse
        priceHistory = JSON.parse(entry.replace(/'/g, '"'));
      } catch (error) {
        continue; // Skip to next iteration if there's an error
      }
    } else {
      priceHistory = entry;
    }

    if (!priceHistory) {
      // Check if priceHistory is null or undefined
      continue;
    }

    // Extract all quantity keys, remove commas, convert to numbers, and sort in ascending order
    const quantities = Object.keys(priceHistory)
      .filter((key) => !isNaN(Number(key.replace(/,/g, ""))))
      .map((key) => Number(key.replace(/,/g, "")))
      .sort((a, b) => a - b);

    // If there are any quantities, get the unit price of the lowest one
    if (quantities.length > 0) {
      const lowestQuantity = quantities[0].toString();
      const unitPriceEntry = priceHistory[lowestQuantity];
      if (unitPriceEntry && unitPriceEntry["unit_price"]) {
        latestPrice = parseFloat(unitPriceEntry["unit_price"]);
      }
      if (priceHistory["distributor"]) {
        latestDistributor = priceHistory["distributor"];
      }
      if (priceHistory["currency"]) {
        currency = priceHistory["currency"];
      }
    }
  }

  return {
    price: latestPrice,
    distributor: latestDistributor,
    currency: currency,
  };
}

function guess_part_type(description) {
  const electrical_keywords = [
    "resistor",
    "capacitor",
    "transistor",
    "diode",
    "inductor",
    "sensor",
    "wire",
    "amplifier",
    "switch",
    "circuit",
    "battery",
    "transformer",
    "rectifier",
    "inverter",
    "relay",
    "oscillator",
    "varistor",
    "fuse",
    "thermistor",
    "potentiometer",
    "cable",
    "connector",
    "motor",
    "controller",
    "integrated circuit",
    "plug",
  ];

  const mechanical_keywords = [
    "screw",
    "nut",
    "box",
    "gasket",
    "lid",
    "rack",
    "gear",
    "shaft",
    "bearing",
    "coupling",
    "valve",
    "pipe",
    "pump",
    "compressor",
    "fan",
    "glass",
    "lense",
    "fixture",
    "holder",
  ];

  const consumable_keywords = [
    "glue",
    "adhesive",
    "solder",
    "potting",
    "epoxy",
    "tape",
    "sealant",
    "paint",
    "cleaner",
    "lubricant",
    "grease",
    "oil",
    "chemical",
    "solvent",
    "abrasive",
    "filter",
    "cartridge",
    "sorbent",
  ];

  const tool_keywords = [
    "wrench",
    "hammer",
    "screwdriver",
    "pliers",
    "drill",
    "saw",
    "tape measure",
    "chisel",
    "file",
    "sander",
    "level",
    "meter",
    "gauge",
    "clamp",
    "vise",
    "ladder",
    "knife",
    "torch",
    "welder",
    "magnifier",
    "microscope",
  ];

  const lowercaseDescription = description.toLowerCase();

  for (const keyword of electrical_keywords) {
    if (lowercaseDescription.includes(keyword.toLowerCase())) {
      return "Electrical";
    }
  }

  for (const keyword of mechanical_keywords) {
    if (lowercaseDescription.includes(keyword.toLowerCase())) {
      return "Mechanical";
    }
  }

  for (const keyword of consumable_keywords) {
    if (lowercaseDescription.includes(keyword.toLowerCase())) {
      return "Consumable";
    }
  }

  for (const keyword of tool_keywords) {
    if (lowercaseDescription.includes(keyword.toLowerCase())) {
      return "Tool";
    }
  }

  // If no keyword matches, return a default value or an empty string.
  return "Unknown";
}

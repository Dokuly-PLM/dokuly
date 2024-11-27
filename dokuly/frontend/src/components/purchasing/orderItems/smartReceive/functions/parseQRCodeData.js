export function parseQRCodeData(data, parsingConfig = defaultParsingConfig) {
  // Split data on Group Separator (GS, \u001d) and Record Separator (RS, \u001e)
  const separatorRegex = /[\u001d\u001e]/; // Matches GS (\u001d) or RS (\u001e)
  const fields = data.split(separatorRegex).filter(Boolean);

  console.log("Fields:", fields);

  let mpn = null;
  let quantity = null;

  fields.forEach((line) => {
    // Check each field for MPN patterns
    parsingConfig.mpnPatterns.forEach((pattern) => {
      if (line.startsWith(pattern.prefix)) {
        mpn = line.slice(pattern.prefix.length).trim();
      }
    });

    // Check each field for quantity patterns
    parsingConfig.quantityPatterns.forEach((pattern) => {
      if (line.startsWith(pattern.prefix)) {
        const qtyStr = line.slice(pattern.prefix.length).trim();
        const qty = parseInt(qtyStr, 10);
        if (!isNaN(qty)) {
          quantity = qty;
        }
      }
    });
  });

  console.log(`Extracted MPN: ${mpn}, Quantity: ${quantity}`);
  return { mpn, quantity };
}

const defaultParsingConfig = {
  mpnPatterns: [{ prefix: "1P" }], // Pattern to detect MPN (Manufacturer Part Number)
  quantityPatterns: [{ prefix: "Q" }], // Pattern to detect Quantity
};

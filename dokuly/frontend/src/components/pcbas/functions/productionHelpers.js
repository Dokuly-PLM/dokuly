export function makeSerialNumber(num, digits, name) {
  let serialNumber = "";
  if (num == 0 || num == -1) {
    serialNumber = name + " " + "0001"; // First production
  } else {
    if (digits == 1) {
      if (num == 9) {
        num += 1;
        serialNumber = name + " " + "00" + num;
      } else {
        num += 1;
        serialNumber = name + " " + "000" + num;
      }
      return serialNumber;
    }
    if (digits == 2) {
      if (num == 99) {
        num += 1;
        serialNumber = name + " " + "0" + num;
      } else {
        num += 1;
        serialNumber = name + " " + "00" + num;
      }
      return serialNumber;
    } else if (digits == 3) {
      if (num == 99) {
        num += 1;
        serialNumber = name + " " + "0" + num;
      } else {
        num += 1;
        serialNumber = name + " " + "00" + num;
      }
      return serialNumber;
    } else if (digits == 4) {
      if (num == 9999) {
        alert("Need to make serial number bigger");
      } else {
        num += 1;
        serialNumber = name + " " + "" + num;
      }
      return serialNumber;
    } else {
      alert("Need to make serial number bigger");
    }
  }
  return serialNumber;
}

export const formatNewServerUrl = (filePath) => {
  let formattedPath = "../../static" + filePath;
  return formattedPath;
};

export const formatCloudImageUri = (id) => {
  return `/api/files/images/download/${id}/`;
};

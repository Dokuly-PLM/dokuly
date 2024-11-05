export const getMaxHeight = (searchData) => {
  if (
    searchData !== null &&
    searchData !== undefined &&
    searchData?.length !== 0 && 
    searchData?.length > 10
  ) {
    return "15rem";
  } else if(searchData?.length < 10) {
    return "fit-content";
  } else {
    return "2.5rem";
  }
};

export const getBorder = (index, searchData) => {
  if (index == 14 || index == searchData.length - 1) {
    return "0px solid";
  } else {
    return "1px solid grey";
  }
};

export const getMargin = (index, searchData) => {
  if (index === 14 || index === searchData.length) {
    return "0.0rem";
  } else {
    return "0.3rem";
  }
};

export const getColor = (bom, currentBom) => {
  if(bom && currentBom) {
    if(bom[0].bom_entity_id == currentBom[0].bom_entity_id) {
      return "#DCDCDC"
    }
  }
  return "white"
}

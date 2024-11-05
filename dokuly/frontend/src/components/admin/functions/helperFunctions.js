import React from "react";
import { animated, config } from "react-spring";

/**
 * Get spring fadeIn config
 * @param {boolean} resetSpring - A blooean value for spring reset
 * @return {Object} Formatted spring object
 *
 * @example
  const fadeIn1 = useSpring(fadeIn1C(resetSpring));
 */
export const fadeIn1C = (resetSpring) => {
  return {
    reset: resetSpring,
    from: { opacity: 0, transform: "translateX(50px)" },
    to: { opacity: 1, transform: "translateX(0px)" },
    config: config.slow,
  };
};

/**
 * Get spring fadeIn config
 * @param {boolean} resetSpring - A blooean value for spring reset
 * @return {Object} Formatted spring object
 *
 * @example
  const fadeIn1 = useSpring(fadeIn1C(resetSpring));
 */
export const fadeIn2C = (resetSpring) => {
  return {
    reset: resetSpring,
    from: { opacity: 0, transform: "translateX(50px)" },
    to: { opacity: 1, transform: "translateX(0px)" },
    config: config.slow,
    delay: 50,
  };
};

/**
 * Get spring fadeIn config
 * @param {boolean} resetSpring - A blooean value for spring reset
 * @return {Object} Formatted spring object
 *
 * @example
  const fadeIn1 = useSpring(fadeIn1C(resetSpring));
 */
export const fadeIn3C = (resetSpring) => {
  return {
    reset: resetSpring,
    from: { opacity: 0, transform: "translateX(50px)" },
    to: { opacity: 1, transform: "translateX(0px)" },
    config: config.slow,
    delay: 75,
  };
};

/**
 * Get spring fadeIn config
 * @param {boolean} resetSpring - A blooean value for spring reset
 * @return {Object} Formatted spring object
 *
 * @example
  const fadeIn1 = useSpring(fadeIn1C(resetSpring));
 */
export const fadeIn4C = (resetSpring) => {
  return {
    reset: resetSpring,
    from: { opacity: 0, transform: "translateX(50px)" },
    to: { opacity: 1, transform: "translateX(0px)" },
    config: config.slow,
    delay: 100,
  };
};

/**
 * Format Col, Row for locations
 * @param {String} containerCol - Container Column value.\
 * @param {String} containerRow - Container Row value.
 * @return {String} A formatted string
 *
 * @example
  let check = checkMatchingLocation("Matrix", {...})
 */
export const formatRowCol = (containerCol, containerRow) => {
  if (containerCol == "" || containerCol == null || containerCol == undefined) {
    if (
      containerRow == "" ||
      containerRow == null ||
      containerRow == undefined
    ) {
      return "Col and Row not defined!";
    }
    return "[" + "No Col" + ", " + containerRow + "]";
  }
  if (containerRow == "" || containerRow == null || containerRow == undefined) {
    if (
      containerCol == "" ||
      containerCol == null ||
      containerCol == undefined
    ) {
      return "Row and Col not defined!";
    }
    return "[" + containerCol + ", " + "No Col" + "]";
  }
  return "[" + containerCol + ", " + containerRow + "]";
};

/**
 * Find overlapping locations
 * @param {String} partContainerType - The current container type .
 * @param {Array} locations - The current locations
 * @param {String} containerNumber - A location string value, id number of container.
 * @param {String} containerCol - A location string value, column in container.
 * @param {String} containerRow - A location string value, row in container.
 * @param {Number} locationID - A location entity's id number.
 * @return {boolean} A boolean
 *
 * @example
  let check = checkMatchingLocation("Matrix", {...}, "1", "2", "A")
  ...
 */
export const checkMatchingLocation = (
  partContainerType,
  locations,
  containerNumber,
  containerCol,
  containerRow,
  locationID,
  hasRowOrCol
) => {
  if (locations === null || locations == undefined) {
    return true;
  }
  let arr = [];
  if (!hasRowOrCol) {
    arr = locations.filter((loc) => loc?.container_placement_number != "");
    for (let i = 0; i < arr.length; i++) {
      if (containerNumber == arr[i].container_placement_number) {
        return false;
      }
    }
    return true;
  }
  if (partContainerType === "Matrix") {
    arr = locations.filter((loc) => loc?.container_type == "Matrix");
  } else if (partContainerType === "Box") {
    arr = locations.filter((loc) => loc?.container_type == "Box");
  } else {
    arr = locations.filter((loc) =>
      loc?.container_type_custom !== "Not Defined"
        ? loc?.container_type_custom == partContainerType
        : loc?.container_type == partContainerType
    );
    if (arr.length == 0) {
      arr = locations;
    }
  }
  if (arr.length == 0 || arr == null || arr == undefined) {
    // No entries
    return true;
  }
  for (let i = 0; i < arr.length; i++) {
    let numberFlag = false;
    let colFlag = false;
    let rowFlag = false;
    if (containerNumber == arr[i].container_number) {
      numberFlag = true;
    }
    if (containerCol == arr[i].container_column) {
      colFlag = true;
    }
    if (containerRow == arr[i].container_row) {
      rowFlag = true;
    }
    if (numberFlag && rowFlag && colFlag) {
      if (arr[i].id != locationID) {
        // This is not the same entity
        return false;
      }
    }
  }
  return true;
};

/**
 * CSS helper function.
 * Used to set user colors based on the user's role.
 * @param {String} role - The user's current role.
 * @return {String} A color code.
 *
 * @example
  return (
    <div
      style={{
        backgroundColor: getColorAdmin(role)
      }}
    >
    </div>
  )
 */
export const getColorAdmin = (role) => {
  if (role === "Admin") {
    return "#D3D3D3";
  }
};

/**
 * CSS helper function.
 * Used to set user colors based on the user's role.
 * @param {String} role - The user's current role.
 * @return {String} A color code.
 *
 * @example
  return (
    <div
      style={{
        backgroundColor: getColorSuperAdmin(role)
      }}
    >
    </div>
  )
 */
export const getColorSuperAdmin = (role) => {
  if (role === "Super Admin") {
    return "#D3D3D3";
  }
};

/**
 * CSS helper function.
 * Used to set user colors based on the user's role.
 * @param {String} role - The user's current role.
 * @return {String} A color code.
 *
 * @example
  return (
    <div
      style={{
        backgroundColor: getColorUser(role)
      }}
    >
    </div>
  )
 */
export const getColorUser = (role) => {
  if (role === "User") {
    return "#D3D3D3";
  }
};

/**
 * CSS helper function.
 * Used to set user colors based on the user's role.
 * @param {String} role - The user's current role.
 * @return {String} A color code.
 *
 * @example
  return (
    <div
      style={{
        backgroundColor: getColorDeveloper(role)
      }}
    >
    </div>
  )
 */
export const getColorDeveloper = (role) => {
  if (role === "Developer") {
    return "#D3D3D3";
  }
};

/**
 * JSX helper function.
 * Gets the default loading spinner.
 * @return {HTMLDivElement} Loading spinner component.
 *
 * @example
  const [loading, setLoading] = useState(true)
  return (
    <div>
    {loading ?
      loadingSpinner()
      :
      <div>
        { ... }
      </div>
    }
    </div>
  )
 */
export const loadingSpinner = () => {
  return (
    <div
      style={{ margin: "5rem" }}
      className="d-flex m-5 dokuly-primary justify-content-center"
    >
      <div className="spinner-border" role="status" />
    </div>
  );
};

export const loadingSpinnerCustomMarginAndColor = (
  marginLeft,
  marginRight,
  marginTop,
  marginBottom,
  color = "dokuly-primary"
) => {
  return (
    <div
      style={{
        marginTop: `${marginTop.toString()}rem`,
        marginLeft: `${marginLeft.toString()}rem`,
        marginRight: `${marginRight.toString()}rem`,
        marginBottom: `${marginBottom.toString()}rem`,
      }}
      className={`d-flex ${color} justify-content-center`}
    >
      <div className="spinner-border" role="status" />
    </div>
  );
};

/**
 * JSX helper function.
 * Returns the outer div for a skeleton loader table col
 * NOTE: No spring defined here, use other skeleton loader helpers.
 * @param {number} width - Minimum width of the column
 * @param {number} height - Minimum height of the column
 * @param {number} ml - Margin Left of the JSX element
 * @param {number} mr - Margin Right of the JSX element
 * @param {number} mt - Margin Top of the JSX element
 * @param {number} mb - Margin Bottom of the JSX element
 * @return {HTMLDivElement} Loading spinner component.
 *
 * @example
  const [loading, setLoading] = useState(true)
  return (
    <div>
    {loading ?
      <div>
        {skeletonCol(10, 3, 1, 1, 1, 1)}
      </div>
      :
      <div>
        { ... }
      </div>
    }
    </div>
  )
 */
export const skeletonCol = (width, height, ml, mr, mt, mb) => {
  return (
    <div
      style={{
        marginRight: `${mr}rem`,
        marginLeft: `${ml}rem`,
        marginTop: `${mt}rem`,
        marginBottom: `${mb}rem`,
        borderRadius: "4px",
        border: `${height}px solid`,
        width: `${width}px`,
        minWidth: `${width}px`,
        height: `${height}px`,
        minHeight: `${height}px`,
      }}
    ></div>
  );
};

/**
 * Checks if the inputed customer id is a valid id.
 * @param {JSON} customer - A customer entity
 * @param {number} id - The customer id to check
 * @param {Array<JSON>} customers - All current customers
 * @return {boolean} Boolean flag for valid customer id.
 *
 * @example
  const [selectedCustomer, setSelectedCustomer] = useState(props.someCustomer)
  const [customers, setCustomers] = useState(props.customers)
  const newId = 104
  return (
    <div>
      {checkCustomerId(selectedCustomer, newId, customers) ?
        // Valid id...
        :
        // Non-valid id...
      }
    </div>
  )
 */
export const checkCustomerId = (customer, id, customers) => {
  for (let i = 0; i < customers.length; i++) {
    if (customers[i].customer_id == id) {
      let flag = false;
      if (customer !== null && customer !== undefined) {
        if (customer.id === customers[i].id) {
          flag = true;
        } else {
          return false;
        }
      } else {
        return false;
      }
      if (!flag) {
        return false;
      }
    }
  }
  return true;
};

/**
 * Checks if the inputed document number is a valid number.
 * @param {JSON} document - A document entity
 * @param {number} id - The document number to check
 * @param {Array<JSON>} documents - All current documents
 * @return {boolean} Boolean flag for valid document number.
 *
 * @example
  const [selectedDocument, setSelectedDocument] = useState(props.someDocument)
  const [documents, setDocuments] = useState(props.documents)
  const newId = "TS-0001"
  return (
    <div>
      {checkDocumentNumber(selectedDocument, newId, documents) ?
        // Valid doc number...
        :
        // Non-valid doc number...
      }
    </div>
  )
 */
export const checkDocumentNumber = (document, id, documents) => {
  for (let i = 0; i < documents.length; i++) {
    if (
      documents[i]?.full_doc_number === id &&
      documents[i].id !== document.id
    ) {
      return false;
    }
  }
  return true;
};

/**
 * JSX helper function.
 * Returns a skeleton loader table with 3 cards in a grid format.
 * @param {number} numTableRows - Number of table rows
 * @param {any} spring - The react-spring useSpring JSON object
 * @return {HTMLDivElement} Skeleton loader component.
 *
 * @example
  const [loading, setLoading] = useState(true)
  const spring = useSpring({
    loop: true,
    to: [
      { opacity: 1, color: "#A9A9A9" }, // Dark gray
      { opacity: 0.1, color: "gray" },
    ],
    from: { opacity: 0.1, color: "#D3D3D3" }, // Light gray
  })
  return (
    <div>
    {loading ?
      threeCardSkeletonLoader4ColTableLeftInfoTableRight(10, spring)
      :
      <div>
        { ... }
      </div>
    }
    </div>
  )
 */
export const threeCardSkeletonLoader4ColTableLeftInfoTableRight = (
  numTableRows,
  spring
) => {
  let tableRows = [];
  for (let i = 0; i < numTableRows; i++) {
    tableRows.push(i);
  }
  return (
    <animated.div style={spring}>
      <div className="row">
        <div className="col">
          <div className="card-body bg-white m-3 shadow-sm rounded">
            <div className="row" style={{ marginBottom: "1rem" }}>
              {/* skeletonCol(width, height, ml, mr, mt, mb) */}
              {skeletonCol(150, 10, 5, 2, 0.5, 1)}
              {skeletonCol(50, 10, 2, 2, 0.5, 1)}
              {skeletonCol(50, 10, 2, 2, 0.5, 1)}
            </div>
            <div>
              <div className="row">
                {skeletonCol(30, 10, 5, 2, 0.5, 1)}
                {skeletonCol(200, 10, 2, 2, 0.5, 1)}
                {skeletonCol(100, 10, 2, 2, 0.5, 1)}
                {skeletonCol(100, 10, 2, 2, 0.5, 1)}
              </div>
            </div>
            {tableRows.map((num, i) => {
              return (
                <div
                  className="row"
                  key={i}
                  style={{ borderTop: "1px gray solid", margin: "1rem" }}
                >
                  {skeletonCol(30, 10, 5, 1, 1, 1)}
                  {skeletonCol(
                    Math.min(((i + 1) * Math.random() + 1) * 50, 250),
                    10,
                    1,
                    1,
                    1,
                    1
                  )}
                  {skeletonCol(
                    Math.min(((i + 1) * Math.random() + 1) * 50, 125),
                    10,
                    1,
                    1,
                    1,
                    1
                  )}
                  {skeletonCol(
                    Math.min(((i + 1) * Math.random() + 1) * 50, 175),
                    10,
                    1,
                    5,
                    1,
                    1
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="col">
          <div className="row">{basicSkeletonLoaderInfoCard(4, spring)}</div>
          <div className="row">{basicSkeletonLoaderInfoCard(8, spring)}</div>
        </div>
      </div>
    </animated.div>
  );
};

/**
 * JSX helper function.
 * Returns a skeleton loader table with 2 cards in a grid format.
 * @param {number} numTableRows - Number of table rows
 * @param {any} spring - The react-spring useSpring JSON object
 * @return {HTMLDivElement} Skeleton loader component.
 *
 * @example
  const [loading, setLoading] = useState(true)
  const spring = useSpring({
    loop: true,
    to: [
      { opacity: 1, color: "#A9A9A9" }, // Dark gray
      { opacity: 0.1, color: "gray" },
    ],
    from: { opacity: 0.1, color: "#D3D3D3" }, // Light gray
  })
  return (
    <div>
    {loading ?
      twoCardSkeletonLoader4ColTableLeftInfoTableRight(10, spring)
      :
      <div>
        { ... }
      </div>
    }
    </div>
  )
 */
export const twoCardSkeletonLoader4ColTableLeftInfoTableRight = (
  numTableRows,
  spring
) => {
  let tableRows = [];
  for (let i = 0; i < numTableRows; i++) {
    tableRows.push(i);
  }
  return (
    <animated.div style={spring}>
      <div className="row">
        <div className="col">
          <div className="card-body bg-white m-3 shadow-sm rounded">
            <div className="row" style={{ marginBottom: "1rem" }}>
              {/* skeletonCol(width, height, ml, mr, mt, mb) */}
              {skeletonCol(150, 10, 5, 2, 0.5, 1)}
              {skeletonCol(50, 10, 2, 2, 0.5, 1)}
              {skeletonCol(50, 10, 2, 2, 0.5, 1)}
            </div>
            <div>
              <div className="row">
                {skeletonCol(30, 10, 5, 2, 0.5, 1)}
                {skeletonCol(200, 10, 2, 2, 0.5, 1)}
                {skeletonCol(100, 10, 2, 2, 0.5, 1)}
                {skeletonCol(100, 10, 2, 2, 0.5, 1)}
              </div>
            </div>
            {tableRows.map((num, i) => {
              return (
                <div
                  className="row"
                  key={i}
                  style={{ borderTop: "1px gray solid", margin: "1rem" }}
                >
                  {skeletonCol(30, 10, 5, 1, 1, 1)}
                  {skeletonCol(
                    Math.min(((i + 1) * Math.random() + 1) * 50, 250),
                    10,
                    1,
                    1,
                    1,
                    1
                  )}
                  {skeletonCol(
                    Math.min(((i + 1) * Math.random() + 1) * 50, 125),
                    10,
                    1,
                    1,
                    1,
                    1
                  )}
                  {skeletonCol(
                    Math.min(((i + 1) * Math.random() + 1) * 50, 175),
                    10,
                    1,
                    5,
                    1,
                    1
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="col">
          <div className="row card-body bg-white m-3 shadow-sm rounded">
            {skeletonCol(8, 10, 0, 2, 1, 1)}
            {skeletonCol(50, 10, 0, 2, 1, 1)}
            {skeletonCol(100, 10, 0, 2, 1, 1)}
          </div>
        </div>
      </div>
    </animated.div>
  );
};

/**
 * JSX helper function.
 * Returns a skeleton loader for a single info card.
 * @param {number} numTableRows - Number of table rows
 * @param {any} spring - The react-spring useSpring JSON object
 * @return {HTMLDivElement} Skeleton loader component.
 *
 * @example
  const [loading, setLoading] = useState(true)
  const spring = useSpring({
    loop: true,
    to: [
      { opacity: 1, color: "#A9A9A9" }, // Dark gray
      { opacity: 0.1, color: "gray" },
    ],
    from: { opacity: 0.1, color: "#D3D3D3" }, // Light gray
  })
  return (
    <div>
    {loading ?
      basicSkeletonLoaderInfoCard(10, spring)
      :
      <div>
        { ... }
      </div>
    }
    </div>
  )
 */
export const basicSkeletonLoaderInfoCard = (numTableRows, spring) => {
  let tableRows = [];
  for (let i = 0; i < numTableRows; i++) {
    tableRows.push(i);
  }
  return (
    <animated.div style={spring} className="container">
      <div className="col-xl">
        <div className="card-body bg-white m-3 shadow-sm rounded">
          <div className="row">
            {/* skeletonCol(width, height, ml, mr, mt, mb) */}
            {skeletonCol(50, 10, 1, 0.5, 0.5, 1)}
            {skeletonCol(150, 10, 0.5, 0.5, 0.5, 1)}
            {skeletonCol(100, 10, 0.5, 0.5, 0.5, 1)}
          </div>
          {tableRows.map((num, i) => {
            return (
              <div className="row" key={i}>
                {skeletonCol(
                  Math.min(((i + 1) * Math.random() + 1) * 50, 100),
                  5,
                  1,
                  1,
                  0.5,
                  0.5
                )}
                {skeletonCol(
                  Math.min(((i + 1) * Math.random() + 1) * 50, 250),
                  5,
                  1,
                  8,
                  0.5,
                  0.5
                )}
              </div>
            );
          })}
        </div>
      </div>
    </animated.div>
  );
};

/**
 * JSX helper function.
 * Returns a skeleton loader for a single table card.
 * @param {number} numTableRows - Number of table rows
 * @param {number} numTableCols - Number of table cols
 * @param {any} spring - The react-spring useSpring JSON object
 * @return {HTMLDivElement} Skeleton loader component.
 *
 * @example
  const [loading, setLoading] = useState(true)
  const spring = useSpring({
    loop: true,
    to: [
      { opacity: 1, color: "#A9A9A9" }, // Dark gray
      { opacity: 0.1, color: "gray" },
    ],
    from: { opacity: 0.1, color: "#D3D3D3" }, // Light gray
  })
  return (
    <div>
    {loading ?
      threeCardSkeletonLoader4ColTableLeftInfoTableRight(10, spring)
      :
      <div>
        { ... }
      </div>
    }
    </div>
  )
 */
export const basicSkeletonLoaderTableCard = (
  numTableRows,
  numTableCols,
  spring
) => {
  let tableRows = [];
  let tableCols = [];
  for (let i = 0; i < numTableRows; i++) {
    tableRows.push(i);
  }
  for (let i = 0; i < numTableCols; i++) {
    tableCols.push(i + numTableRows);
  }
  return (
    <animated.div style={spring} className="container">
      <div className="col-xl">
        <div className="card-body bg-white m-3 shadow-sm rounded">
          <div className="row">
            {/* skeletonCol(width, height, ml, mr, mt, mb) */}
            {tableCols.map((col, i) => {
              return (
                <span key={i}>
                  {skeletonCol(
                    100 * (Math.random() + 0.3),
                    10,
                    0.5,
                    0.5,
                    0.5,
                    1
                  )}
                </span>
              );
            })}
          </div>
          {tableRows.map((num, i) => {
            return (
              <div className="row" key={i}>
                {tableCols.map((col, j) => {
                  return (
                    <span key={j}>
                      {skeletonCol(
                        Math.min(((i + 1) * Math.random() + 1) * 50, 100),
                        5,
                        1,
                        1,
                        0.5,
                        0.5
                      )}
                    </span>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </animated.div>
  );
};

/**
 * JSX helper function.
 * Returns a skeleton loader for a single table card.
 * @param {number} numTableRows - Number of table rows
 * @param {number} numTableCols - Number of table cols
 * @param {number} width - Width of table cols
 * @param {number} height - Height of the skeleton loader object
 * @param {any} spring - The react-spring useSpring JSON object
 * @return {HTMLDivElement} Skeleton loader component.
 *
 * @example
  const [loading, setLoading] = useState(true)
  const spring = useSpring({
    loop: true,
    to: [
      { opacity: 1, color: "#A9A9A9" }, // Dark gray
      { opacity: 0.1, color: "gray" },
    ],
    from: { opacity: 0.1, color: "#D3D3D3" }, // Light gray
  })
  return (
    <div>
    {loading ?
      threeCardSkeletonLoader4ColTableLeftInfoTableRight(10, spring)
      :
      <div>
        { ... }
      </div>
    }
    </div>
  )
 */
export const dynamicSkeletonLoaderTableCard = (
  numTableRows,
  numTableCols,
  width,
  height,
  spring
) => {
  let tableRows = [];
  let tableCols = [];
  for (let i = 0; i < numTableRows; i++) {
    tableRows.push(i);
  }
  for (let i = 0; i < numTableCols; i++) {
    tableCols.push(i + numTableRows);
  }
  return (
    <div
      style={{ minHeight: `${height}`, height: `${height}`, marginTop: "4rem" }}
    >
      <animated.div style={spring} className="container">
        {skeletonCol(100, 10, 0.5, 0.5, 0.5, 1)}
        <div className="row">
          {skeletonCol(250, 10, 0.5, 0.5, 0.5, 1)}
          {skeletonCol(50, 5, 0.5, 0.5, 0.5, 1)}
          {skeletonCol(50, 5, 0.5, 0.5, 0.5, 1)}
          {skeletonCol(75, 5, 0.5, 0.5, 0.5, 1)}
        </div>
        <div className="col-xl">
          <div className="card-body card bg-white m-3 shadow-sm rounded">
            <div className="row">
              {/* skeletonCol(width, height, ml, mr, mt, mb) */}
              {tableCols.map((col, i) => {
                return (
                  <span key={i}>
                    {skeletonCol(
                      width * (Math.random() + 0.3),
                      10,
                      0.5,
                      0.5,
                      0.5,
                      1
                    )}
                  </span>
                );
              })}
            </div>
            {tableRows.map((num, i) => {
              return (
                <div className="row" key={i}>
                  {tableCols.map((col, j) => {
                    return (
                      <span key={j}>
                        {skeletonCol(
                          Math.min(((i + 1) * Math.random() + 1) * 100, width),
                          10,
                          1,
                          1,
                          0.5,
                          0.5
                        )}
                      </span>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </animated.div>
    </div>
  );
};

export const basicFadeInSpring = () => {
  return {
    from: { opacity: 0 },
    to: { opacity: 1 },
    config: config.slow,
  };
};

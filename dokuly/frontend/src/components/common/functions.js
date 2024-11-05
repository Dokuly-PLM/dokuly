/**
 * Format URL.
 * This function has some strange substring logic?
 *
 * Use with caution.
 *
 * @param {*} url
 * @returns
 */
export function formatServerURL(url) {
  if (url) {
    let split = url.split("/");
    // Static tag: "../../static/"

    let newString = `${split[0]}/${split[1]}/${split[2]}/${split[3]}/nd/${split[4]}/${split[5]}`;

    return newString;
  }
}

export const formatCloudImageUri = (id) => {
  return `/api/files/images/download/${id}/`;
};

/**
 * Formats a download string for the iframe previewers.
 * For PDF previewer as iframe use the identifier: pdf_preview.
 *
 * @param {Number} documentId - Any document object id
 * @param {String} identifier - A identifier string, could be pdf_raw, pdf, document_file etc.
 * @returns formatted string
 */
export function formatPDFViewerURL(documentId, identifier) {
  return `api/documents/download/${identifier}/${documentId}`;
}

/**
 * Function for generating url for static media files.
 * @param {*} url
 * @returns
 */
export function formatServerUrlFull(url) {
  if (url != null) {
    var n = url.search("8000");
    let str = url;
    let formatedString = `../../static/media/${str}`;

    return formatedString;
  }
}

/**
 * @deprecated
 */
export function checkTokenExpiry(tokenTime) {
  let values = tokenTime.split(",");
  let now = new Date().getTime() / (1000 * 3600 * 24);

  let dateToken =
    new Date(
      values[2],
      values[1],
      values[0],
      values[3],
      values[4],
      values[5]
    ).getTime() /
    (1000 * 3600 * 24);

  if (dateToken - now > 40) {
    //localStorage.removeItem("token")
    //localStorage.removeItem("token_created")
    // return <Navigate push to="/login"/>
    return console.log("Remove token");
  } else {
    return console.log("Token not expired");
  }
}

/**
 * Common function for checking if the profile is allowed to edit.
 * @param {*} profile_role
 * @returns
 */
export function checkProfileIsAllowedToEdit(profile_role) {
  if (profile_role === undefined || profile_role === null) {
    return false;
  }

  if (profile_role !== "Viewer") {
    return true;
  }
  return false;
}

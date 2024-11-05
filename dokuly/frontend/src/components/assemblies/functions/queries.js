import axios from "axios";
import { tokenConfig } from "../../../configs/auth";

/**
 * Create a new assembly.
 * @param {*} data
 * @returns The new assembly
 */
export const createNewAssembly = (data) => {
  const promise = axios.post(
    "/api/assemblies/createNewAssembly/",
    data,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

/**
 * An axios wrapper function, can be used in any react component.
 * PUT query for updating a user's profile data.
 * @param {number} userId - A user's id number.
 * @param {JSON} data - Query payload.
 * @return {Promise<AxiosResponse<any>>} The axios data promsie,
 * contains a data response or error message based on response status.
 *
 * @example
  const [userData, setUserData] = useState({})
  const data = {
    first_name: "someValue",
    phone_number: someValue
  }
  updateUserProfile(userData.id, data)
  .then((res) => {
    if(res.status === 200) {
      setUserData(res.data)
    }
  })
  .catch((err) => {
    if(err.response.status === 401) {
      // Handle err response if needed...
    }
  })
 */
export const editAsmErrata = (id, notes) => {
  const promise = axios.put(
    `api/assemblies/update/errata/${id}/`,
    notes,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const editAsmRevisionNotes = (id, revision_notes) => {
  const data = { revision_notes: revision_notes };
  const promise = axios.put(
    `api/assemblies/update/revisionNotes/${id}/`,
    data,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

/**
 * An axios wrapper function, can be used in any react component.
 * PUT query for updating a user's profile data.
 * @param {number} userId - A user's id number.
 * @param {JSON} data - Query payload.
 * @return {Promise<AxiosResponse<any>>} The axios data promsie,
 * contains a data response or error message based on response status.
 *
 * @example
  const [userData, setUserData] = useState({})
  const data = {
    first_name: "someValue",
    phone_number: someValue
  }
  updateUserProfile(userData.id, data)
  .then((res) => {
    if(res.status === 200) {
      setUserData(res.data)
    }
  })
  .catch((err) => {
    if(err.response.status === 401) {
      // Handle err response if needed...
    }
  })
 */
export const editAsmInfo = (id, data) => {
  const promise = axios.put(
    `api/assemblies/update/info/${id}/`,
    data,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * An axios wrapper function, can be used in any react component.
 * PUT query for updating a user's profile data.
 * @param {number} userId - A user's id number.
 * @param {JSON} data - Query payload.
 * @return {Promise<AxiosResponse<any>>} The axios data promsie,
 * contains a data response or error message based on response status.
 *
 * @example
  const [userData, setUserData] = useState({})
  const data = {
    first_name: "someValue",
    phone_number: someValue
  }
  updateUserProfile(userData.id, data)
  .then((res) => {
    if(res.status === 200) {
      setUserData(res.data)
    }
  })
  .catch((err) => {
    if(err.response.status === 401) {
      // Handle err response if needed...
    }
  })
 */
export const editAsmBomID = (id, bom_id) => {
  const promise = axios.put(
    `api/assemblies/update/bom_id/${id}/${bom_id}/`,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

/**
 * An axios wrapper function, can be used in any react component.
 * Fetches the information contained within the user that is logged in.
 * @param {number} id - A assembly entities id number
 * @return {Promise<AxiosResponse<any>>} The axios data promsie,
 * contains a data response or error message based on response status.
 *
 * @example
  const [userData, setUserData] = useState({})
  fetchUser()
  .then((res) => {
    if(res.status === 200) {
      setUserData(res.data)
    }
  })
  .catch((err) => {
    if(err.response.status === 401) {
      // Handle err response...
    }
  })
 */
export const fetchASM = (id) => {
  const promise = axios.get(
    `api/assemblies/get/singleAsm/${id}/`,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const getAssembliesLatestRevisions = () => {
  const promise = axios.get(
    "api/assemblies/get/latestRevisions/",
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * Get an array of all the revisions
 *
 * @param {*} id
 * @returns
 */
export const getAssemblyRevisions = (id) => {
  const promise = axios.get(
    `api/assemblies/get/revisions/${id}/`,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * An axios wrapper function, can be used in any react component.
 * PUT query for updating a user's profile data.
 * @param {number} userId - A user's id number.
 * @param {JSON} data - Query payload.
 * @return {Promise<AxiosResponse<any>>} The axios data promsie,
 * contains a data response or error message based on response status.
 *
 * @example
  const [userData, setUserData] = useState({})
  const data = {
    first_name: "someValue",
    phone_number: someValue
  }
  updateUserProfile(userData.id, data)
  .then((res) => {
    if(res.status === 200) {
      setUserData(res.data)
    }
  })
  .catch((err) => {
    if(err.response.status === 401) {
      // Handle err response if needed...
    }
  })
 */
export const saveBomToDb = (id, bom) => {
  const promise = axios.put(`api/assembly_bom/${id}/`, bom, tokenConfig());
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const removeBomLine = (bomLineId) => {
  const promise = axios.put(
    `api/assembly_bom/removeBomLine/${bomLineId}/`,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const copyBomFromASM = (id, data) => {
  const promise = axios.put(
    `api/assembly_bom/update/copyBom/${id}/`,
    data,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

/**
 * An axios wrapper function, can be used in any react component.
 * Fetches the information contained within the user that is logged in.
 * @return {Promise<AxiosResponse<any>>} The axios data promsie,
 * contains a data response or error message based on response status.
 *
 * @example
  const [userData, setUserData] = useState({})
  fetchUser()
  .then((res) => {
    if(res.status === 200) {
      setUserData(res.data)
    }
  })
  .catch((err) => {
    if(err.response.status === 401) {
      // Handle err response...
    }
  })
 */
export const fetch_all_boms = (id) => {
  const promise = axios.get(
    `api/assembly_bom/get/allBoms/${id}/`,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const mergedSearch = (search) => {
  const promise = axios.get(
    `api/assembly_bom/mergedSearch/${search}/`,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const simpleAsmBomSearch = (search, currentBomId) => {
  const promise = axios.get(
    `api/assembly_bom/simpleSearch/${search}/${currentBomId}/`,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const editBomVariantComments = (bomId, data) => {
  const promise = axios.put(
    `api/assembly_bom/update/comments/${bomId}/`,
    data,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

/**
 * An axios wrapper function, can be used in any react component.
 * GET query for fetching the revisions for an ASM entity.
 * @param {number} asmId - A user's id number.
 * @return {Promise<AxiosResponse<any>>} The axios data promsie,
 * contains a data response or error message based on response status.
 *
 * @example
  const [userData, setUserData] = useState({})
  const data = {
    first_name: "someValue",
    phone_number: someValue
  }
  updateUserProfile(userData.id, data)
  .then((res) => {
    if(res.status === 200) {
      setUserData(res.data)
    }
  })
  .catch((err) => {
    if(err.response.status === 401) {
      // Handle err response if needed...
    }
  })
 */
export const getRevisions = (asmId) => {
  const promise = axios.get(
    `api/assemblies/get/revisions/${asmId}/`,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * An axios wrapper function, can be used in any react component.
 * POST query to create a new revision of an assembly entity.
 * @param {number} asmId - An assmeblie's id number.
 * @return {Promise<AxiosResponse<any>>} The axios data promsie,
 * contains a data response or error message based on response status.
 *
 * @example
  const [asmDetailed, setASMDeteailed] = useState(someData)
  const optionalData = {
    description: "testData"
  }
  newAsmRevision(asmDetailed.id, optionalData)
  .then((res) => {
    if(res.status === 200) {
      // Navigate to new ASM revision
    }
  })
  .catch((err) => {
    if(err.response.status === 401) {
      // Handle err response if needed...
    }
  })
 */
export const newAsmRevision = (asmId, data) => {
  const promise = axios.post(
    `api/assemblies/newAsmRevision/${asmId}/`,
    data,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * An axios wrapper function, can be used in any react component.
 * PUT query to archive an assembly revision
 * @param {number} asmId - An asseblie's id number.
 * @return {Promise<AxiosResponse<any>>} The axios data promsie,
 * contains a data response or error message based on response status.
 *
 * @example
  const [asmDetailed, setASMDeteailed] = useState(someData)
  archiveAsmRevision(asmDetailed.id)
  .then((res) => {
    if(res.status === 200) {
      // Navigate to older revision or back to ASM overview
    }
  })
  .catch((err) => {
    if(err.response.status === 401) {
      // Handle err response if needed...
    }
  })
 */
export const archiveAsmRevision = (asmId) => {
  const promise = axios.put(
    `api/assemblies/archiveRevision/${asmId}/`,
    {},
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * An axios wrapper function, can be used in any react component.
 * GET query to fetch possible BOM entities
 * @param {boolean} filterAsms - Boolean for filtering data.
 * @param {boolean} filterParts - Boolean for filtering data.
 * @param {boolean} filfilterPcbasterAsms - Boolean for filtering data.
 * @return {Promise<AxiosResponse<any>>} The axios data promsie,
 * contains a data response or error message based on response status.
 *
 * @example
  const [data, setData] = useState([])
  fetchPossibleBomEntires(true, false, false)
  .then((res) => {
    if(res.status === 200) {
      setData(res.data)
    }
  })
  .catch((err) => {
    if(err.response.status === 401) {
      // Handle err response if needed...
    }
  })
 */
export const fetchPossibleBomEntires = (
  filterAsms,
  filterParts,
  filterPcbas,
) => {
  const asms = filterAsms ? 1 : 0;
  const parts = filterParts ? 1 : 0;
  const pcbas = filterPcbas ? 1 : 0;
  const promise = axios.get(
    `api/parts/fetchPossibleBomEntires/${asms}/${parts}/${pcbas}/`,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * Get a list of attached files on an assembly.
 *
 * @param {*} id
 * @returns a list of files for e.g. a file table.
 */
export const fetchFileList = (id) => {
  const promise = axios.get(
    `api/assemblies/fetchFileList/${id}/`,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * Removes a id reference in the file list of .
 *
 * @param {Number} file_id - Identifier for a file object
 * @param {JSON} data - Query payload, need to include the asm id
 * @returns a response status of backend processing
 */
export const removeFileCon = (file_id, data) => {
  const promise = axios.put(
    `api/assemblies/removeFileCon/${file_id}/`,
    data,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const getUnArchivedAssemblies = () => {
  const promise = axios.get("api/assemblies/get/all/", tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

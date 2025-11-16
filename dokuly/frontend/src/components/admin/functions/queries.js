import axios from "axios";

import {
  formDataWithToken,
  offlineToken,
  tokenConfig,
} from "../../../configs/auth";
import { toast } from "react-toastify";

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
export const fetchUser = () => {
  const promise = axios.get("api/auth/user", tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * An axios wrapper function, can be used in any react component.
 * Fetches all saved profiles from db.
 * @return {Promise<AxiosResponse<any>>} The axios data promsie, 
 * contains a data response or error message based on response status.
 *
 * @example
  const [usersData, setUsersData] = useState({})
  fetchUser()
  .then((res) => {
    if(res.status === 200) {
      setUsersData(res.data)
    }
  })
  .catch((err) => {
    if(err.response.status === 401) {
      // Handle err response...
    }
  })
 */
export const fetchUsers = () => {
  const promise = axios.get("api/profiles/allUsers/", tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const manageActiveModules = (data) => {
  const promise = axios.put(
    "api/organizations/manageActiveModules/",
    data,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * An axios wrapper function, can be used in any react component.
 * Fetches the user profile data of the logged user.
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
 */
export const fetchUserProfile = () => {
  const promise = axios.get("api/profiles/getUser/", tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * An axios wrapper function, can be used in any react component.
 * Calls on the email smtp server in the backend, sending a email to reset 
 * the users password. If successful the user can use the received link to reset their password.
 * @param {JSON} data - Query playload, e.g. workEmail for the user.
 * @return {Promise<AxiosResponse<any>>} The axios data promsie, 
 * contains a data response or error message based on response status.
 *
 * @example
  const data = {
    workEmail: this.state.workEmail
  }
  sendResetPassMail(data)
  .then((res) => {
    if(res.status === 200) {
      // Handle success...
      this.setState({success: true, error: false, errorProfile: false})
    }
    console.log(res)
  })
  .catch((err) => {
    // Handle err...
  })
 */
export const sendResetPassMail = (data) => {
  const promise = axios.put("api/profiles/sendResetPassMail/", data);
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * An axios wrapper function, can be used in any react component.
 * Used to change a users permissions, see backend for role hierarchy.
 * Should only be used in admin pages.
 * @param {JSON} data - Query playload.
 * @return {Promise<AxiosResponse<any>>} The axios data promsie, 
 * contains a data response or error message based on response status.
 *
 * @example
  const [currentPermission, setCurrentPermission] = useState(userProfile?.role)
  const queryPayload = {
    role: "Admin",
    user_id: userProfile?.id 
    // If using User instance use id. 
    // If using profile instance use userProfile.user
  }
  alterPermission(queryPayload)
  .then((res) => {
    if(res.status === 200) {
      // Handle updated data...
      setCurrentPermission(res.data.newPermission)
    }
  })
  .catch((err) => {
    if(err.response.status === 401) {
      // Handle err response...
    }
  })
 */
export const alterPermission = (data) => {
  const promise = axios.put(
    "api/profiles/alterPermission/",
    data,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const alterAllowedApps = (data) => {
  const promise = axios.put(
    "api/profiles/update/allowedApps/",
    data,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * An axios wrapper function, can be used in any react component.
 * Checks the token sent with the email to reset a forgotten password. 
 * Can be used to verify current tokens that is stored in the db.
 * @param {JSON} data - Query playload.
 * @return {Promise<AxiosResponse<any>>} The axios data promsie, 
 * contains a data response or error message based on response status.
 *
 * @example
  const [authenticated, setAuthenticated] = useState(false)
  const queryPayload = {
    user: userId, // A user's id
    token: token, // The token to check
  }
  check_token(queryPayload)
  .then((res) => {
    if(res.status === 200) {
      // Token verified...
      // Handle success...
      setAuthenticated(true)
    }
  })
  .catch((err) => {
    setAuthenticated(false) // On any fail, token is not legitimate.
    if(err.response.status === 401) {
      // Handle err response if needed...
    }
  })
 */
export const check_token = (data) => {
  const promise = axios.put(
    "api/profiles/checkToken/",
    data,
    offlineToken(data.token),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * An axios wrapper function, can be used in any react component.
 * Query to reset the password to a specific user.
 * @param {number} id - A user's ID.
 * @param {JSON} data - Query payload. 
 * @return {Promise<AxiosResponse<any>>} The axios data promsie, 
 * contains a data response or error message based on response status.
 *
 * @example
  let userId = someUserId
  let data = {
    token: token, // Send token for verification
    password: password,
  }
  resetPassword(parseInt(userId), data)
  .then((res) => {
    if (res.status === 202) {
      // Handle success...
    }
  })
  .catch((err) => {
    // Handle error if needed...
  });
  };
 */
export const resetPassword = (id, data) => {
  const promise = axios.put(
    `api/profiles/resetPass/${id}/`,
    data,
    offlineToken(data.token),
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
export const updateUserProfile = (userId, data) => {
  const promise = axios.put(
    `api/profiles/update/profileInfo/${userId}/`,
    data,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * An axios wrapper function, can be used in any react component.
 * PUT query to update a user profile's active status
 * @param {JSON} data - Query payload.
 * @return {Promise<AxiosResponse<any>>} The axios data promsie, 
 * contains a data response or error message based on response status.
 *
 * @example
  const [users, setUsers] = useState(
    props.users !== null 
    && props.users !== undefined
    ? props.users : []
  )
  const data = {
      user_id: user.user,
  };
  activateUserQ(data)
  .then((res) => {
    if(res.status === 200) {
      setUsers(res.data.newUsers)
    }
  })
  .catch((err) => {
    if(err.response.status === 401) {
      // Handle err response if needed...
    }
  })
 */
export const activateUserQ = (data) => {
  const promise = axios.put(
    "api/profiles/update/activateUser/",
    data,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * An axios wrapper function, can be used in any react component.
 * GET query to fetch all projects saved in the database.
 * @return {Promise<AxiosResponse<any>>} The axios data promsie, 
 * contains a data response or error message based on response status.
 *
 * @example
  const [projects, setProjects] = useState([])
  fetchProjects()
  .then((res) => {
    if(res.status === 200) {
      setProjects(res.data)
    }
  })
  .catch((err) => {
    if(err.response.status === 401) {
      // Handle err response if needed...
    }
  })
 */
export const fetchProjects = () => {
  const promise = axios.get("api/projects/get/all/", tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * An axios wrapper function, can be used in any react component.
 * GET query to fetch all customers saved in the database.
 * @return {Promise<AxiosResponse<any>>} The axios data promsie, 
 * contains a data response or error message based on response status.
 *
 * @example
  const [customers, setCustomers] = useState([])
  fetchCustomers()
  .then((res) => {
    if(res.status === 200) {
      setCustomers(res.data)
    }
  })
  .catch((err) => {
    if(err.response.status === 401) {
      // Handle err response...
    }
  })
 */
export const fetchCustomers = () => {
  const promise = axios.get("api/customers/", tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * An axios wrapper function, can be used in any react component.
 * PUT query to edit a given project.
 * @param {number} projectId - A project's id number.
 * @param {JSON} data - Query payload.
 * @return {Promise<AxiosResponse<any>>} The axios data promsie, 
 * contains a data response or error message based on response status.
 *
 * @example
  const [selectedProject, setSelectedProject] = useState(props.selectedProject)
  if(selectedProject !== null && selectedProject !== undefined) { // Null check
    if(selectedProject?.id !== undefined) { // Empty Object check
      const data = {
        title: someValue
      }
      editProject(projectId, data)
      .then((res) => {
        if(res.status === 200) {
          setSelectedProject(res.data)
        }
      })
      .catch((err) => {
        if(err.response.status === 401) {
          // Handle err response...
        }
      })
    }
  }
 */
export const editProject = (projectId, data) => {
  const promise = axios.put(
    `api/projects/update/${projectId}/`,
    data,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * An axios wrapper function, can be used in any react component.
 * GET query that fetches projects with non full_project_numbers,
 * uses backend logic to construct the full project number from other project data,
 * this query will be phased out when all project numbers are on the same format.
 * @return {Promise<AxiosResponse<any>>} The axios data promsie, 
 * contains a data response or error message based on response status.
 *
 * @example
  const [projects, setProjects] = useState([])
  fetchProjectsWithNumbers()
  .then((res) => {
    if(res.status === 200) {
      setProjects(res.data)
    }
  })
  .catch((err) => {
    if(err.response.status === 401) {
      // Handle err response...
    }
  })
 */
export const fetchProjectsWithNumbers = () => {
  const promise = axios.get("api/projects/get/fullNumbered/", tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * An axios wrapper function, can be used in any react component.
 * POST query to create a new project entity.
 * @param {JSON} data - Query payload. 
 * @return {Promise<AxiosResponse<any>>} The axios data promsie, 
 * contains a data response or error message based on response status.
 *
 * @example
  const [refresh, setRefresh] = useState(false)
  const newProject = {
    title: someValue,
    contact: someUser.id,
    ...
  }

  useEffect(() => {
    if(refresh) {
      // Set or refetch any data if needed...
    }
  }, [refresh])

  newProject()
  .then((res) => {
    if(res.status === 200) {
      // Refresh DOM if using in a table...
      setRefresh(true) // Runs the useEffect
    }
  })
  .catch((err) => {
    if(err.response.status === 401) {
      // Handle err response...
    }
  })
 */
export const newProject = (data) => {
  const promise = axios.post(
    "api/projects/post/newProject/",
    data,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * An axios wrapper function, can be used in any react component.
 * PUT query to update a given customer.
 * @param {number} customerId - A customer's id number.
 * @param {JSON} data - Query payload. 
 * @return {Promise<AxiosResponse<any>>} The axios data promsie, 
 * contains a data response or error message based on response status.
 *
 * @example
  const [selectedCustomer, setSelectedCustomer] = useState(props.selectedCustomer)
  const data = {
    name: "newName",
    customer_contact: someUser.id
  }
  editCustomer(customerId, data)
  .then((res) => {
    if(res.status === 200) {
      setSelectedCustomer(res.data)
    }
  })
  .catch((err) => {
    if(err.response.status === 401) {
      // Handle err response...
    }
  })
 */
export const editCustomer = (customerId, data) => {
  const promise = axios.put(
    `api/customers/put/${customerId}/`,
    data,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * An axios wrapper function, can be used in any react component.
 * POST query to create a new user profile entity.
 * @param {JSON} data - Query payload.
 * @return {Promise<AxiosResponse<any>>} The axios data promsie, 
 * contains a data response or error message based on response status.
 *
 * @example
  const newUserData = {
    first_name: "someValue",
    last_name: "someValue",
    ...
  }
  newUser(newUserData)
  .then((res) => {
    if(res.status === 200) {
      // Update / refresh DOM or set data...
    }
  })
  .catch((err) => {
    if(err.response.status === 401) {
      // Handle err response...
    }
  })
 */
export const newUser = (data) => {
  const promise = axios.post("api/profiles/post/newUser/", data, tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * An axios wrapper function, can be used in any react component.
 * GET query that fetches all documents saved in the connected database. 
 * @return {Promise<AxiosResponse<any>>} The axios data promsie, 
 * contains a data response or error message based on response status.
 *
 * @example
  const [documents, setDocuments] = useState([])
  fetchDocuments()
  .then((res) => {
    if(res.status === 200) {
      setDocuments(res.data)
    }
  })
  .catch((err) => {
    if(err.response.status === 401) {
      // Handle err response...
    }
  })
 */
export const adminGetDocuments = () => {
  const promise = axios.get(
    "api/documents/get/allEnhanced/admin/",
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * An axios wrapper function, can be used in any react component.
 * PUT query to generate a document number.
 * If document number is generated from POST, this query should not be used.
 * @param {number} id - A document's id number.
 * @param {JSON} data - Query payload.
 * @return {Promise<AxiosResponse<any>>} The axios data promsie, 
 * contains a data response or error message based on response status.
 *
 * @example
  const [selectedDocument, setSelectedDocument] = useState(props.selectedDocument)
  const data = {
    prefix_id: prefix.id
  }
  generateDocumentNumberQ(selectedDocument.id, data)
  .then((res) => {
    if(res.status === 200) {
      setSelectedDocument(res.data)
    }
  })
  .catch((err) => {
    if(err.response.status === 401) {
      // Handle err response...
    }
  })
 */
export const generateDocumentNumberQ = (id, data) => {
  const promise = axios.put(
    `/api/documents/put/generateDocumentNumber/${id}/`,
    data,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * An axios wrapper function, can be used in any react component.
 * Specific PUT query that archives a given document.
 * @param {number} id - A document's id number.
 * @param {JSON} data - Query payload.
 * @return {Promise<AxiosResponse<any>>} The axios data promsie, 
 * contains a data response or error message based on response status.
 *
 * @example
  const [documents, setDocuments] = useState(props.documents)
  const [selectedDocument, setSelectedDocument] = useState({})
  const [refresh, setRefresh] = useState(false)

  // Select a document in any table and 
  // call setSelectedDocument when archiving with inline buttons.
  // See dokuly/frontend/src/components/admin/adminComponents/documentList.js
  // for usage with JSX and Bootstrap logic.

  useEffect(() => {
    if(refresh) {
      // Fetch new data if needed...
      setRefresh(false)
    }
  }, [refresh])

  const data = {
    archived: "True",
  }
  archiveDocument(selectedDocument.id, data)
  .then((res) => {
    if(res.status === 200) {
      setDocuments(res.data)
      setRefresh(true)
    }
  })
  .catch((err) => {
    if(err.response.status === 401) {
      // Handle err response...
    }
  })
 */
export const archiveDocument = (id, data) => {
  const promise = axios.put(
    `api/documents/put/archiveDocument/${id}/`,
    data,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * An axios wrapper function, can be used in any react component.
 * GET function to fetch all document prefixes (types) saved in the connected database. 
 * @return {Promise<AxiosResponse<any>>} The axios data promsie, 
 * contains a data response or error message based on response status.
 *
 * @example
  const [prefixes, setPrefixes] = useState([])
  fetchPrefixes()
  .then((res) => {
    if(res.status === 200) {
      setPrefixes(res.data)
    }
  })
  .catch((err) => {
    if(err.response.status === 401) {
      // Handle err response...
    }
  })
 */
export const fetchPrefixes = () => {
  const promise = axios.get("api/documentPrefixes/get/all/", tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * An axios wrapper function, can be used in any react component.
 * @param {JSON} data - Query payload.
 * @return {Promise<AxiosResponse<any>>} The axios data promsie, 
 * contains a data response or error message based on response status.
 *
 * @example
  const newPrefixData = {
    prefix: someValue1,
    display_name: someValue2,
  }
  newPrefix(newPrefixData)
  .then((res) => {
    if(res.status === 200) {
      // Handle success...
    }
  })
  .catch((err) => {
    if(err.response.status === 401) {
      // Handle err response...
    }
  })
 */
export const newPrefix = (data) => {
  const promise = axios.post(
    "api/documentPrefixes/post/newPrefix/",
    data,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * An axios wrapper function, can be used in any react component.
 * PUT query that updates a given document prefix entity.
 * @param {number} prefixId - A document prefix's id number.
 * @param {JSON} data - Query payload. 
 * @return {Promise<AxiosResponse<any>>} The axios data promsie, 
 * contains a data response or error message based on response status.
 *
 * @example
  const [selectedPrefix, setSelectedPrefix] = useState(props.somePrefix)
  const updatedData = {
    prefix: "someValue",
    display_name: "aValue"
  }
  editPrefix(selectedPrefix.id, updatedData)
  .then((res) => {
    if(res.status === 200) {
      setSelectedPrefix(res.data)
    }
  })
  .catch((err) => {
    if(err.response.status === 401) {
      // Handle err response...
    }
  })
 */
export const editPrefix = (prefixId, data) => {
  const promise = axios.put(
    `api/documentPrefixes/put/${prefixId}/`,
    data,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * Fetch all non-archived protection levels.
 * @return {Promise<AxiosResponse<any>>} The axios data promise
 */
export const fetchProtectionLevels = () => {
  const promise = axios.get("api/protectionLevels/get/all/", tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * Create a new protection level.
 * @param {JSON} data - Query payload with name and description
 * @return {Promise<AxiosResponse<any>>} The axios data promise
 */
export const newProtectionLevel = (data) => {
  const promise = axios.post(
    "api/protectionLevels/post/new/",
    data,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * Edit an existing protection level.
 * @param {number} protectionLevelId - Protection level's id number
 * @param {JSON} data - Query payload
 * @return {Promise<AxiosResponse<any>>} The axios data promise
 */
export const editProtectionLevel = (protectionLevelId, data) => {
  const promise = axios.put(
    `api/protectionLevels/put/${protectionLevelId}/`,
    data,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * Delete a protection level.
 * @param {number} protectionLevelId - Protection level's id number
 * @return {Promise<AxiosResponse<any>>} The axios data promise
 */
export const deleteProtectionLevel = (protectionLevelId) => {
  const promise = axios.delete(
    `api/protectionLevels/delete/${protectionLevelId}/`,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * An axios wrapper function, can be used in any react component.
 * PUT query that updates a given document entity.
 * @param {number} documentId - A document entity's id number.
 * @param {JSON} data - Query payload.
 * @return {Promise<AxiosResponse<any>>} The axios data promsie, 
 * contains a data response or error message based on response status.
 *
 * @example
  const [selectedDocument, setSelectedDocument] = useState(props.somePrefix)
  const updatedData = {
    title: "someValue",
    description: "aValue"
  }
  editDocumentInfo(selectedDocument.id, updatedData)
  .then((res) => {
    if(res.status === 200) {
      setSelectedDocument(res.data)
    }
  })
  .catch((err) => {
    if(err.response.status === 401) {
      // Handle err response...
    }
  })
 */
export const editDocumentInfo = (documentId, data) => {
  const promise = axios.put(
    `api/documents/put/editInfo/${documentId}/`,
    data,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * An axios wrapper function, can be used in any react component.
 * GET query that fetches the user's organization.
 * @param {number} id - DEPRECATED, using the users id by query id.
 * @return {Promise<AxiosResponse<any>>} The axios data promsie, 
 * contains a data response or error message based on response status.
 *
 * @example
  const [organization, setOrganization] = useState({})
  fetchOrg()
  .then((res) => {
    if(res.status === 200) {
      setOrganization(res.data)
    }
  })
  .catch((err) => {
    if(err.response.status === 401) {
      // Handle err response...
    }
  })
 */
export const fetchOrg = () => {
  const promise = axios.get("api/organizations/get/byUserId/", tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const fetchTestUser = () => {
  const promise = axios.get("api/organizations/get/testUser/", tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * An axios wrapper function, can be used in any react component.
 * POST query, used for creating a new organization for a customer. 
 * NOTE: Currently there is a many to one connection between users and org.
 * @param {JSON} data - Query payload.
 * @return {Promise<AxiosResponse<any>>} The axios data promsie, 
 * contains a data response or error message based on response status.
 * @example
 * State lifting example:
  //Parent file:
  import Component from '.../Component.js'
  const Page = (props) => {
    const [org, setOrg] = useState(null)
    const [refresh, setRefresh] = useState(false)
    const liftState = (res) => {
      if(res !== null && res !== undefined) {
        setOrg(res)
        setRefresh(true)
      }
    }
    useEffect(() => {
      if(refresh) {
        // Fetch new data if needed...
        setRefresh(false)
      }
    }, [refresh])
    return (
      <div>
        <Component liftState={liftState} />
        {org !== null && org !== undefined &&
          <OrgInfoTable org={org} />
        }
      </div>
    )
  }

  // Child file:
  const Component = (props) => {
    const newOrg = {
      name: "someValue",
      num_employees: 3,
      ...
    }
    newOrg()
    .then((res) => {
      if(res.status === 200) {
        props.liftState(res.data)
      }
    })
    .catch((err) => {
      if(err.response.status === 401) {
        // Handle err response...
      }
    })
    return (
      <div>
        { ... }
      </div>
    )
  }
 */
export const newOrg = (data) => {
  const promise = axios.post(
    `api/organizations/create/${0}/`,
    data,
    formDataWithToken(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * An axios wrapper function, can be used in any react component.
 * PUT query to update a organization entity.
 * @param {number} id - A organization entity's id number.
 * @param {JSON} data - Query payload.
 * @return {Promise<AxiosResponse<any>>} The axios data promsie, 
 * contains a data response or error message based on response status.
 *
 * @example
  const [selectedOrg, setSelectedOrg] = useState(props.someOrg)
  const updatedData = {
    name: "someValue",
    description: "aValue",
    ...
  }
  editOrg(selectedOrg.id, updatedData)
  .then((res) => {
    if(res.status === 200) {
      setSelectedOrg(res.data)
    }
  })
  .catch((err) => {
    if(err.response.status === 401) {
      // Handle err response...
    }
  })
 */
export const editOrg = (id, data) => {
  const promise = axios.put(
    `api/organizations/update/${id}/`,
    data,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * An axios wrapper function, can be used in any react component.
 * GET query that fetches all projects that are archived.
 * @return {Promise<AxiosResponse<any>>} The axios data promsie, 
 * contains a data response or error message based on response status.
 *
 * @example
  const [archivedProjects, setArchivedProjects] = useState([])
  fetchArchivedProjects()
  .then((res) => {
    if(res.status === 200) {
      setArchivedProjects(res.data)
    }
  })
  .catch((err) => {
    if(err.response.status === 401) {
      // Handle err response...
    }
  })
 */
export const fetchArchivedProjects = () => {
  const promise = axios.get("api/projects/get/archived/", tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * An axios wrapper function, can be used in any react component.
 * GET query that fetches all documents that are archived.
 * @return {Promise<AxiosResponse<any>>} The axios data promsie, 
 * contains a data response or error message based on response status.
 *
 * @example
  const [archivedDocuments, setArchivedDocuments] = useState([])
  fetchArchivedDocuments()
  .then((res) => {
    if(res.status === 200) {
      setArchivedDocuments(res.data)
    }
  })
  .catch((err) => {
    if(err.response.status === 401) {
      // Handle err response...
    }
  })
 */
export const fetchArchivedDocuments = () => {
  const promise = axios.get("api/documents/get/archived/", tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * An axios wrapper function, can be used in any react component.
 * GET query that fetches all prefixes that are archived.
 * @return {Promise<AxiosResponse<any>>} The axios data promsie, 
 * contains a data response or error message based on response status.
 *
 * @example
  const [archivedDocumentPrefixes, setArchivedDocumentPrefixes] = useState([])
  fetchArchivedPrefixes()
  .then((res) => {
    if(res.status === 200) {
      setArchivedDocumentPrefixes(res.data)
    }
  })
  .catch((err) => {
    if(err.response.status === 401) {
      // Handle err response...
    }
  })
 */
export const fetchArchivedPrefixes = () => {
  const promise = axios.get(
    "api/documentPrefixes/get/archived/",
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * An axios wrapper function, can be used in any react component.
 * GET query that fetches all location that are not archived.
 * @return {Promise<AxiosResponse<any>>} The axios data promsie, 
 * contains a data response or error message based on response status.
 *
 * @example
  const [locationTypes, setLocationTypes] = useState([])
  fetchLocationTypes()
  .then((res) => {
    if(res.status === 200) {
      setArchivedDocumentPrefixes(res.data)
    }
  })
  .catch((err) => {
    if(err.response.status === 401) {
      // Handle err response...
    }
  })
 */
export const fetchLocations = () => {
  const promise = axios.get("api/locations/fetch/", tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * An axios wrapper function, can be used in any react component.
 * GET query that fetches all location that are archived.
 * @return {Promise<AxiosResponse<any>>} The axios data promsie, 
 * contains a data response or error message based on response status.
 *
 * @example
  const [locationTypes, setLocationTypes] = useState([])
  fetchLocationTypes()
  .then((res) => {
    if(res.status === 200) {
      setArchivedDocumentPrefixes(res.data)
    }
  })
  .catch((err) => {
    if(err.response.status === 401) {
      // Handle err response...
    }
  })
 */
export const fetchArchivedLocations = () => {
  const promise = axios.get("api/locations/fetchArchived/", tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const updateLocation = async (locationId, data) => {
  try {
    const response = await axios.put(
      `api/locations/${locationId}/update/`,
      data,
    );
    return response;
  } catch (error) {
    console.error("Error updating location: ", error);
    return error;
  }
};

/**
 * An axios wrapper function, can be used in any react component.
 * PUT query to quick-update the logo for an organization
 * @param {Number} orgId - An organization entities id number
 * @param {JSON} data - The query payload
 * @return {Promise<AxiosResponse<any>>} The axios data promsie,
 * contains a data response or error message based on response status.
 */
export const setOrganizationLogo = (orgId, data) => {
  const promise = axios.put(
    `api/organizations/update/${orgId}/`,
    data,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * An axios wrapper function, can be used in any react component.
 * PUT query to fetch a list of images
 * @param {JSON} data - The query payload, must include an array of image file ids
 * @return {Promise<AxiosResponse<any>>} The axios data promsie,
 * contains a data response or error message based on response status.
 */
export const fetchImageList = (data) => {
  const promise = axios.put(
    "api/files/images/fetchImageList/",
    data,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * An axios wrapper function, can be used in any react component.
 * PUT query to upload an image file
 * @param {JSON} data - The query payload, must include an array of image file ids
 * @return {Promise<AxiosResponse<any>>} The axios data promsie,
 * contains a data response or error message based on response status.
 */
export const uploadImage = (data) => {
  const promise = axios.post(
    "api/files/images/uploadImage/",
    data,
    formDataWithToken(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const uploadThumbnail = (data) => {
  const promise = axios.post(
    "api/files/post/thumbnail/",
    data,
    formDataWithToken(),
  );
  const dataPromise = promise.then((res) => res);
  return toast.promise(dataPromise, {
    pending: "Loading...",
    success: "Thumbnail uploaded",
    error: "Failed to upload thumbnail",
  });
};

export const deleteThumbnail = (app, item_id) => {
  const data = {
    app: app,
    item_id: item_id,
  };

  const promise = axios.put(
    "api/files/delete/thumbnail/",
    data,
    formDataWithToken(),
  );
  const dataPromise = promise.then((res) => res);
  return toast.promise(dataPromise, {
    pending: "Loading...",
    success: "Thumbnail deleted",
    error: "Failed to delete thumbnail",
  });
};

/**
 * An axios wrapper function, can be used in any react component.
 * PUT query to archive an image file.
 * @param {Number} id - an id number, belonging to a image file entity
 * @param {Number} returnFlag - flag for return values. 0 is archived entry,
 * 1 is all unarchived, 2 is all unarchived and all archived
 * @return {Promise<AxiosResponse<any>>} The axios data promsie,
 * contains a data response or error message based on response status.
 */
export const archiveImage = (id, returnFlag, data) => {
  const promise = axios.put(
    `api/files/images/archiveImage/${id}/${returnFlag}/`,
    data,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * An axios wrapper function, can be used in any react component.
 * PUT query to unarchive an image file.
 * @param {Number} id - an id number, belonging to a image file entity
 * @param {Number} returnFlag - flag for return values. 0 is archived entry,
 * 1 is all unarchived, 2 is all unarchived and all archived
 * @return {Promise<AxiosResponse<any>>} The axios data promsie,
 * contains a data response or error message based on response status.
 */
export const unarchiveImage = (id, data) => {
  const promise = axios.put(
    `api/files/images/restoreArchived/${id}/`,
    data,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * An axios wrapper function, can be used in any react component.
 * PUT query to fetch archived image files.
 * @return {Promise<AxiosResponse<any>>} The axios data promsie,
 * contains a data response or error message based on response status.
 */
export const fetchArchivedImages = () => {
  const promise = axios.get("api/files/images/fetchArchived/", tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * An axios wrapper function, can be used in any react component.
 * DELETE query to remove a tenant. DANGER: THIS FUNCTION REMOVES THE SCHEMA; USE WITH UPMOST CARE
 * @return {Promise<AxiosResponse<any>>} The axios data promsie,
 * contains a data response or error message based on response status.
 */
export const deleteTenant = () => {
  const promise = axios.delete("api/tenant/deleteTenant/", tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * An axios wrapper function, can be used in any react component.
 * PUT query to fetch max allowed active users
 * @return {Promise<AxiosResponse<any>>} The axios data promsie,
 * contains a data response or error message based on response status.
 */
export const getMaxAllowedActiveUsers = () => {
  const promise = axios.get("api/tenants/getMaxUsers/", tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const fetchStorageSize = () => {
  const promise = axios.get("api/files/checkTenantStorage/", tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

// New api calls for location types

export const createLocationType = async (data) => {
  try {
    // Assuming the API endpoint is "/api/location-types/create/"
    const url = "/api/locationTypes/create/";

    // Make the POST request to create the location type
    const response = await axios.post(url, data);

    return response;
  } catch (error) {
    console.error("Error creating location type:", error);
    throw error;
  }
};

export const updateLocationType = async (id, data) => {
  try {
    // Assuming the API endpoint is "/api/location-types/{id}/update/"
    const url = `/api/locationTypes/${id}/update/`;

    // Make the PUT request to update the location type
    const response = await axios.put(url, data);

    return response;
  } catch (error) {
    console.error("Error updating location type:", error);
    throw error;
  }
};

export const archiveLocationType = async (id) => {
  try {
    // Assuming the API endpoint is "/api/location-types/{id}/update/"
    const url = `/api/locationTypes/${id}/delete/`;

    // Make the PUT request to update the location type
    const response = await axios.put(url);

    return response;
  } catch (error) {
    console.error("Error updating location type:", error);
    throw error;
  }
};

export const getLocationTypes = async () => {
  try {
    // Assuming the API endpoint is "/api/location-types/"
    const url = "/api/locationTypes/";

    // Make the GET request to get all location types
    const response = await axios.get(url);

    return response;
  } catch (error) {
    console.error("Error getting location types:", error);
    throw error;
  }
};

export const createLocation = async (data) => {
  try {
    const response = await axios.post("/api/locations/create/", data);

    if (!response.status.toString().startsWith("2")) {
      throw new Error(`Request failed with status code ${response.status}`);
    }

    return { status: response.status, data: response.data };
  } catch (error) {
    if (error.response) {
      return { status: error.response.status, data: error.response.data };
    }
    throw error;
  }
};

export const archiveLocation = async (id) => {
  try {
    const response = await axios.put(`/api/locations/${id}/archive/`);
    return { status: response.status, data: response.data };
  } catch (error) {
    if (error.response) {
      return { status: error.response.status, data: error.response.data };
    }
    throw error;
  }
};

export const fetchAPIKeyFromOrg = () => {
  const promise = axios.get(
    "api/organizations/fetchCompVaultApiKey/",
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const paddleCheckoutDetails = (data) => {
  const toastPromise = axios
    .put("api/subscriptions/getProducts/", data, tokenConfig())
    .then((res) => res)
    .catch((err) => {
      toast.error("An error occurred");
      throw err;
    });
  return toast.promise(toastPromise, {
    pending: "Loading...",
    success: "Data loaded",
    error: "An error occurred",
  });
};

export const saveSubscription = (data) => {
  const toastPromise = axios
    .put("api/subscriptions/createNewSubscription/", data)
    .then((res) => res)
    .catch((err) => {
      toast.error("An error occurred");
      throw err;
    });
  return toast.promise(toastPromise, {
    pending: "Loading...",
    success: "Data loaded",
    error: "An error occurred",
  });
};

/**
 * An axios wrapper function, can be used in any react component.
 * GET query to verify the checkout session
 * @return {Promise<AxiosResponse<any>>} The axios data promsie,
 * contains a data response or error message based on response status.
 */
export const verifyCheckoutSession = (data) => {
  const promise = axios.put("api/verify-checkout-session/", data);
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const fetchDokulyAPIKeys = () => {
  const promise = axios.get("api/organizations/listAPIKeys/", tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const generateAPIKey = (data) => {
  const promise = axios.post(
    "api/organizations/generateAPIKey/",
    data,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const deleteAPIKey = (keyId) => {
  const promise = axios.delete(
    `api/organizations/deleteAPIKey/${keyId}/`,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const removePaddleSubscriptions = (data) => {
  const toastPromise = axios
    .put("api/organizations/removeSubscription/", data, tokenConfig())
    .then((res) => res)
    .catch((err) => {
      toast.error("An error occurred");
      throw err;
    });
  return toast.promise(toastPromise, {
    pending: "Loading...",
    success: "Data loaded",
    error: "An error occurred",
  });
};

export const refreshPaddleSubscriptions = (useToast) => {
  const toastPromise = axios
    .get("api/organizations/refreshSubscriptionData/", tokenConfig())
    .then((res) => res)
    .catch((err) => {
      toast.error("An error occurred");
      throw err;
    });
  if (!useToast) {
    return toastPromise;
  }
  return toast.promise(toastPromise, {
    pending: "Loading...",
    success: "Subscriptions refreshed",
    error: "An error occurred",
  });
};

/**
 * Preview how a part number template will be formatted.
 * @param {Object} data - Object containing template, use_number_revisions, revision_format
 * @return {Promise<AxiosResponse<any>>} Response with example formatted part numbers
 */
export const previewPartNumberTemplate = (data) => {
  const promise = axios.post(
    "api/organizations/previewPartNumberTemplate/",
    data,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const previewFormattedRevisionTemplate = (data) => {
  const promise = axios.post(
    "api/organizations/previewFormattedRevisionTemplate/",
    data,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

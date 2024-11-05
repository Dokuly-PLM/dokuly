// Setup config with token - helper function
export const tokenConfig = () => {
  // Get token from state
  const token = localStorage.getItem("token");

  // Headers
  const config = {
    headers: {
      "Content-Type": "application/json",
    },
  };
  // If token, add to header config
  if (token) {
    config.headers["Authorization"] = `Token ${token}`;
  }
  return config;
};

// Setup config with token - helper function
export const tokenConfigFileRequest = () => {
  // Get token from state
  const token = localStorage.getItem("token");

  // Headers
  const config = {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  };
  // If token, add to header config
  if (token) {
    config.headers["Authorization"] = `Token ${token}`;
  }
  return config;
};

export const offlineToken = (token) => {
  const config = {
    headers: {
      "Content-Type": "application/json",
    },
  };
  config.headers["Authorization"] = `Token ${token}`;
  return config;
};

export const formDataWithToken = () => {
  const token = localStorage.getItem("token");

  // Headers
  const config = {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  };
  // If token, add to header config
  if (token) {
    config.headers["Authorization"] = `Token ${token}`;
  }
  return config;
};

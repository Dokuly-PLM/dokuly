function clearLocalStorageData() {
  localStorage.removeItem("suppliers");
  localStorage.removeItem("purchaseOrders");
  localStorage.removeItem("organizationCurrency");
  localStorage.removeItem("customers");
  localStorage.removeItem("projects");
  localStorage.removeItem("users");
  localStorage.removeItem("user");
  localStorage.removeItem("parts");
  localStorage.removeItem("assemblies");
  localStorage.removeItem("documents");
  localStorage.removeItem("pcbas");
  localStorage.removeItem("productionItems");
  // remove all local storage data that starts with "my_time_records"
  Object.keys(localStorage)
    .filter((key) => key.startsWith("my_time_records"))
    .forEach((key) => {
      localStorage.removeItem(key);
    });
}

export default clearLocalStorageData;

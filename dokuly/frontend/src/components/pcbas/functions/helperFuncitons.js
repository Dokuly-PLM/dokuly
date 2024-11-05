/**
 * Add project_name and customer_name to a target array.
 * The target array is the items field
 *
 * @param {*} items
 * @param {*} projects
 * @param {*} customers
 * @returns array of documents
 */
export function mapProjectCustomerItems(items, projects, customers) {
	return items.map((item) => {
		let projectObj = null;

		projects.map((element) => {
			if (element?.id === item?.project) {
				projectObj = element;
				item.project_name = projectObj?.title;
			}
		});

		if (projectObj != null && projectObj.customer != null) {
			customers.map((element) => {
				if (element?.id === projectObj?.customer) {
					item.customer_name = element?.name;
					item.customer_id = element?.id;
				}
			});
		}
		return item;
	});
}

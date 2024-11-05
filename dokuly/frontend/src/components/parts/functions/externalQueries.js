import React from "react";
import { corsServerAddress, octopartApiKey } from "../corsServerAddress";
import axios from "axios";

export const fetchOctopartAvail = (id, part_number, revision, mpn) => {
  let partInfo = [];

  var data = JSON.stringify({
    query:
      `
		query {
		  search(q: "` +
      mpn +
      `", limit: 1) {
			results {
			  part {
				mpn
				estimated_factory_lead_days
				total_avail
				avg_avail
				category {
					name
				}
				short_description
				descriptions {
					text
					credit_string
				}
				counts
				reference_designs {
					name
					url
				}
				manufacturer {
				  name
				}
				sellers {
					company {
							name
						}
					offers {
						inventory_level
						factory_lead_days
						moq
						click_url 
						prices {
							quantity
							price
							currency
							converted_price
							converted_currency
						}
					}
				}
				best_image {
					url
				}
				best_datasheet {
				  name
				  url
				  credit_string
				  credit_url
				  page_count
				  mime_type
				}
				specs {
				  attribute {
					name
					group
					shortname
				  }
				  display_value
				}
				document_collections {
				  name
				  documents {
					name
					url
					credit_string
					credit_url
				  }
				}
			  }
			}
		  }
		}`,
    variables: {},
  });

  var config = {
    method: "post",
    url: corsServerAddress + "https://octopart.com/api/v4/endpoint",
    headers: {
      token: octopartApiKey,
      "Content-Type": "application/json",
      Cookie: "",
    },
    data: data,
  };

  const promise = axios(config);
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const updateFarnellStock = (part) => {
  var myHeaders = new Headers();
  myHeaders.append("Access-Control-Allow-Origin", "*");

  var requestOptions = {
    method: "GET",
    redirect: "follow",
    myHeaders,
  };

  fetch(
    corsServerAddress +
      "http://api.element14.com//catalog/products?term=manuPartNum:" +
      part.mpn +
      "",
    requestOptions,
  )
    .then((response) => response.text())
    .then((result) => {
      // this.props.createMessage({ gotHit: "Found part at Farnell" });
      let partInfo = JSON.parse(result);

      let stock =
        partInfo.manufacturerPartNumberSearchReturn.products[0].stock.level;
      let partEntry = {
        supplier_stock:
          partInfo.manufacturerPartNumberSearchReturn.products[0].stock.level,
      };
      return stock;
    })
    .catch((error) => {});
};

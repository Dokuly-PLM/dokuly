export const searchForComponentH = (mpn) => {
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
        Cookie:
          "",
      },
      data: data,
    };

    return config
}
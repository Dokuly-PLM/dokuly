import requests
import json

# ------------------------------------------------------------------------------------------

API_KEY = "your_api_key"  # Update with your actual API key
DOKULY_TENANT = "test2"  # Update with your actual tenant name

# ------------------------------------------------------------------------------------------

PROTOCOL = "https"  # DO NOT CHANGE
# PROTOCOL = "http"  # Only used for localhost
BASE_URL = f"{PROTOCOL}://{DOKULY_TENANT}.dokuly.com"  # DO NOT CHANGE
# BASE_URL = f"{PROTOCOL}://localhost:8000"  # Only used for localhost
CUSTOMERS_URL = f"{BASE_URL}/api/v1/customers/"  # DO NOT CHANGE
CUSTOMER_ID = 0

if __name__ == "__main__":
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Api-Key {API_KEY}",
    }
    customers = None
    if "localhost" in BASE_URL:
        session = requests.Session()  # Only used for localhost
        session.headers.update({'Host': 'test2.dokuly.localhost'})  # Only used for localhost
        response = session.get(
            CUSTOMERS_URL,
            headers=headers,
        )
        if response.status_code == 200:
            customers = json.loads(response.text)
        else:
            print(f"Error: {response.status_code}")
            exit()
    else:
        response = requests.get(CUSTOMERS_URL, headers=headers)
        if response.status_code == 200:
            customers = json.loads(response.text)
        else:
            print(f"Error: {response.status_code}")
            exit()

    if not customers:
        print("No customers found")
        exit()

    while True:
        # Make user select a customer
        print("Select a customer:")
        for index, customer in enumerate(customers):
            print(f"{index + 1}: {customer['name']}")
        customer_index = int(input("Enter the customer index: ")) - 1
        if customer_index < 0 or customer_index >= len(customers):
            print("Invalid customer index")
            continue
        customer_id = customers[customer_index]["id"]
        CUSTOMER_ID = customer_id
        print(f"Selected customer: {customers[customer_index]['name']}, ID: {customer_id}")
        break

    PROJECTS_URL = f"{BASE_URL}/api/v1/projects/{CUSTOMER_ID}/"  # DO NOT CHANGE
    projects = None
    if "localhost" in BASE_URL:
        session = requests.Session()  # Only used for localhost
        session.headers.update({'Host': 'test2.dokuly.localhost'})  # Only used for localhost
        response = session.get(
            PROJECTS_URL,
            headers=headers,
        )
        projects = json.loads(response.text)
    else:
        response = requests.get(PROJECTS_URL, headers=headers)
        projects = json.loads(response.text)

    if not projects:
        print("No projects found")
        exit()

    # Display projects in rows where the cols are ID and title and lastly customer once more
    print("Projects:")
    for project in projects:
        print(f"ID: {project['id']}, Title: {project['title']}")

    # Print customer
    print(f"Customer: {customers[customer_index]['name']}, ID: {customers[customer_index]['id']}")

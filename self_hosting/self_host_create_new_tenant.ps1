# Define the URL of your Django view
$url = "http://yourdomain.com/api/tenants/createOrUpdate/"

# Create a hashtable for your headers to include Content-Type
$headers = @{
    "Content-Type" = "application/json"
    # Add "Authorization" header if your API requires an authentication token
}

# Prompt the user for input and assign the values to variables
$sessionId = Read-Host "Enter session ID"
$userId = Read-Host "Enter user ID"
$email = Read-Host "Enter email"
$domain = Read-Host "Enter domain"
$username = Read-Host "Enter username"
$fullName = Read-Host "Enter full name"
$subscriptionPlanId = Read-Host "Enter subscription plan ID"
$quantity = Read-Host "Enter quantity"

# Construct the JSON payload with user-provided data
$body = @{
    session_id = $sessionId
    userid = $userId
    email = $email
    domain = $domain
    username = $username
    full_name = $fullName
    subscription_info = @{
        quantity = [int]$quantity
        subscription_plan_id = [int]$subscriptionPlanId
    }
} | ConvertTo-Json -Depth 10

# Make the POST request
$response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body

# Output the response
Write-Output "Response from server: $response"

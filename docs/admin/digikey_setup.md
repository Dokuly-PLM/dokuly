# DigiKey API Setup Guide

This guide walks you through setting up DigiKey API access for part search integration.

## Prerequisites

- A DigiKey account (free to create)
- Access to the DigiKey Developer Portal

## Step 1: Register on DigiKey Developer Portal

1. Go to [https://developer.digikey.com/](https://developer.digikey.com/)
2. Sign in with your DigiKey account (or create one if you don't have one)
3. Navigate to the Developer Portal dashboard

## Step 2: Create an Application

1. In the Developer Portal, go to **"My Applications"** or **"Applications"**
2. Click **"Create New Application"** or **"Add Application"**
3. Fill in the application details:
   - **Application Name**: Choose a descriptive name (e.g., "Dokuly PLM Integration")
   - **Description**: Optional description of your application
   - **Redirect URI**: Not required for 2-legged OAuth flow (can leave blank or use a placeholder)
4. Save the application

## Step 3: Get Your Credentials

After creating the application, you'll receive:
- **Client ID**: A unique identifier for your application
- **Client Secret**: A secret key for authentication (keep this secure!)

**Important**: 
- Copy these credentials immediately - the Client Secret is only shown once
- If you lose the Client Secret, you'll need to regenerate it (which invalidates existing tokens)

## Step 4: Subscribe to API Products

1. In the Developer Portal, navigate to **"API Products"** or **"Subscriptions"**
2. Subscribe to the **"Product Information API v4"** product
   - This is required to access product search and details endpoints
   - Some products may require approval or have usage limits

## Step 5: Configure in Dokuly

1. Go to **Admin → Integrations → DigiKey** in Dokuly
2. Enter your **Client ID** in the "Client ID" field
3. Enter your **Client Secret** in the "Client Secret" field
4. Click **"Test Connection"** to verify your credentials work
5. If the test succeeds, click **"Save Settings"**

## Step 6: Verify API Access

After saving, you should be able to:
- Search for parts using the DigiKey search button in the part creation form
- See DigiKey results when searching by MPN
- Get detailed product information including specifications

## Troubleshooting

### "Failed to connect" or "401 Unauthorized"
- Verify your Client ID and Client Secret are correct
- Ensure you've subscribed to the Product Information API v4
- Check that your credentials haven't been reset
- Make sure you're using production credentials (not sandbox) if applicable

### "404 Not Found" 
- The API endpoint may have changed - check the DigiKey API documentation
- Ensure you're using API v4 endpoints

### "No results found"
- Verify the MPN exists in DigiKey's catalog
- Check that your API subscription includes search functionality
- Try searching with a known part number first (e.g., "resistor")

### Token Expiration
- Access tokens expire after 30 minutes
- The system automatically refreshes tokens, but if you see authentication errors, try saving settings again

## Additional Resources

- [DigiKey Developer Portal](https://developer.digikey.com/)
- [DigiKey API Documentation](https://developer.digikey.com/documentation)
- [DigiKey API FAQs](https://developer.digikey.com/faq)
- [OAuth 2.0 2-Legged Flow Tutorial](https://developer.digikey.com/tutorials-and-resources/oauth-20-2-legged-flow)

## Security Notes

- Never share your Client Secret publicly
- Keep your credentials secure
- If credentials are compromised, regenerate them immediately in the Developer Portal
- The Client Secret is stored in plain text in the database (as per your requirements) - ensure proper database security


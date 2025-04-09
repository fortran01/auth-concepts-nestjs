#!/usr/bin/env node

/**
 * Script to test Auth0 API authentication
 *
 * This script demonstrates:
 * 1. Getting a Machine-to-Machine (M2M) token from Auth0
 * 2. Using the token to call a protected API endpoint
 *
 * Usage:
 *   node test-auth0-api.js
 */

require("dotenv").config();
const axios = require("axios");

// Check environment configuration
function validateConfig() {
  const domain = process.env.AUTH0_DOMAIN;
  const clientId = process.env.AUTH0_M2M_CLIENT_ID;
  const clientSecret = process.env.AUTH0_M2M_CLIENT_SECRET;
  const audience = process.env.AUTH0_API_AUDIENCE;

  const issues = [];

  if (!domain) issues.push("AUTH0_DOMAIN is not set");
  if (!clientId) issues.push("AUTH0_M2M_CLIENT_ID is not set");
  if (!clientSecret) issues.push("AUTH0_M2M_CLIENT_SECRET is not set");
  if (!audience) issues.push("AUTH0_API_AUDIENCE is not set");

  return {
    isValid: issues.length === 0,
    issues,
    config: {
      domain,
      clientId: clientId ? `${clientId.substring(0, 6)}...` : "not set",
      audience,
    },
  };
}

async function getToken() {
  const domain = process.env.AUTH0_DOMAIN;
  const clientId = process.env.AUTH0_M2M_CLIENT_ID;
  const clientSecret = process.env.AUTH0_M2M_CLIENT_SECRET;
  const audience = process.env.AUTH0_API_AUDIENCE;

  console.log(`Getting token from Auth0 (${domain})...`);
  console.log(`Using audience: ${audience}`);
  console.log(
    `Using client ID: ${
      clientId ? clientId.substring(0, 6) + "..." : "not set"
    }`
  );

  try {
    const tokenUrl = `https://${domain}/oauth/token`;
    console.log(`Token endpoint: ${tokenUrl}`);

    const response = await axios.post(
      tokenUrl,
      {
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        audience,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error("\n❌ Token Request Failed");

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(`Status: ${error.response.status}`);
      console.error("Response data:", error.response.data);

      // Provide more helpful error messages based on common issues
      const { error: errorCode, error_description } = error.response.data || {};

      if (
        errorCode === "access_denied" &&
        error_description === "Unauthorized"
      ) {
        console.error("\nTROUBLESHOOTING HELP:");
        console.error(
          "This error usually means the M2M application doesn't have permission to access the API."
        );
        console.error("1. Go to Auth0 Dashboard > Applications > APIs");
        console.error(
          `2. Check if an API with identifier "${audience}" exists`
        );
        console.error("3. Go to Applications > Applications");
        console.error(`4. Find the application with client ID "${clientId}"`);
        console.error(
          "5. Check if that application has permission to access the API"
        );
      } else if (errorCode === "invalid_client") {
        console.error("\nTROUBLESHOOTING HELP:");
        console.error(
          "This error usually means the client ID or secret is incorrect."
        );
        console.error(
          "Verify your AUTH0_M2M_CLIENT_ID and AUTH0_M2M_CLIENT_SECRET values in .env"
        );
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error(
        "No response received from Auth0. Check your network connection and AUTH0_DOMAIN value."
      );
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Error setting up request:", error.message);
    }

    console.error("\nFor more information, try visiting:");
    console.error("- http://localhost:3001/auth0-api-debug");
    console.error(
      "- https://auth0.com/docs/get-started/authentication-and-authorization-flow/client-credentials-flow"
    );

    throw new Error("Failed to get token");
  }
}

async function callProtectedApi(token) {
  const apiUrl = "http://localhost:3001/api/auth0/protected";

  console.log(`Calling protected API endpoint: ${apiUrl}`);
  console.log(`Using token: ${token.substring(0, 15)}...`);

  try {
    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error("\n❌ API Request Failed");

    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error("Response data:", error.response.data);

      if (error.response.status === 401) {
        console.error("\nTROUBLESHOOTING HELP:");
        console.error("1. Token might be invalid or expired");
        console.error(
          "2. Check if your Auth0 API audience matches what's configured in the backend"
        );
        console.error(`3. Current audience: ${process.env.AUTH0_API_AUDIENCE}`);
      }
    } else if (error.request) {
      console.error("No response received from API. Is the server running?");
    } else {
      console.error("Error setting up request:", error.message);
    }

    throw new Error("Failed to call protected API");
  }
}

// Main function
async function main() {
  console.log("=== Auth0 API Test ===\n");

  // Validate configuration
  const configValidation = validateConfig();
  if (!configValidation.isValid) {
    console.error("❌ Configuration Issues:");
    configValidation.issues.forEach((issue) => console.error(`- ${issue}`));
    console.error(
      "\nPlease update your .env file with the correct Auth0 configuration."
    );
    process.exit(1);
  }

  console.log("✅ Configuration validated");
  console.log(`Domain: ${configValidation.config.domain}`);
  console.log(`Client ID: ${configValidation.config.clientId}`);
  console.log(`Audience: ${configValidation.config.audience}`);
  console.log("");

  try {
    // 1. Get token
    const token = await getToken();
    console.log("✅ Token received:", token.substring(0, 15) + "...");

    // 2. Call protected API
    console.log("\nCalling protected API...");
    const result = await callProtectedApi(token);
    console.log("\n✅ API Response:");
    console.log(JSON.stringify(result, null, 2));

    console.log("\n✅ Test completed successfully");
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    process.exit(1);
  }
}

main();

#!/usr/bin/env node

/**
 * This script helps debug CORS headers on the server side
 * It makes requests directly to the server and logs the responses
 */

const http = require("http");

const apiHost = "localhost";
const apiPort = 3001;

// Helper function to make requests
function makeRequest(path, method = "GET", headers = {}) {
  return new Promise((resolve, reject) => {
    console.log(`Making ${method} request to ${path}...`);

    const options = {
      hostname: apiHost,
      port: apiPort,
      path,
      method,
      headers: {
        // Default headers
        "User-Agent": "CORS-Test-Script",
        Origin: "http://localhost:4001",
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      console.log(`STATUS: ${res.statusCode}`);
      console.log("HEADERS:");
      Object.entries(res.headers).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });

      // Check for CORS headers specifically
      console.log("\nCORS HEADERS:");
      const corsHeaders = Object.entries(res.headers).filter(([key]) =>
        key.toLowerCase().startsWith("access-control-")
      );

      if (corsHeaders.length === 0) {
        console.log("  No CORS headers found in response!");
      } else {
        corsHeaders.forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      }

      // Get response body
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        console.log("\nRESPONSE BODY:");
        if (!data) {
          console.log("  <empty response body>");
          resolve({ status: res.statusCode, headers: res.headers, data: "" });
          return;
        }

        try {
          const json = JSON.parse(data);
          console.log(JSON.stringify(json, null, 2));
          resolve({ status: res.statusCode, headers: res.headers, data: json });
        } catch (e) {
          // Just log the raw data if it's not JSON
          console.log(data);
          resolve({ status: res.statusCode, headers: res.headers, data });
        }
      });
    });

    req.on("error", (e) => {
      console.error(`Request error: ${e.message}`);
      reject(e);
    });

    req.end();
  });
}

// Test each endpoint
async function runTests() {
  try {
    console.log("=== TESTING ENDPOINT WITHOUT CORS HEADERS ===");
    await makeRequest("/api/data");

    console.log("\n=== TESTING ENDPOINT WITH CORS HEADERS FOR ALL ORIGINS ===");
    await makeRequest("/api/data-with-cors");

    console.log(
      "\n=== TESTING ENDPOINT WITH CORS HEADERS FOR SPECIFIC ORIGIN ==="
    );
    await makeRequest("/api/data-with-specific-cors");

    console.log(
      "\n=== TESTING PREFLIGHT FOR ENDPOINT WITHOUT CORS HEADERS ==="
    );
    await makeRequest("/api/data", "OPTIONS");

    console.log(
      "\n=== TESTING PREFLIGHT FOR ENDPOINT WITH PREFLIGHT HANDLING ==="
    );
    await makeRequest("/api/data-with-preflight", "OPTIONS");

    console.log("\n=== TESTING NEST CORS ENABLED ENDPOINT ===");
    await makeRequest("/api/data-with-nest-cors");

    console.log("\n=== TESTING PREFLIGHT FOR NEST CORS ENABLED ENDPOINT ===");
    await makeRequest("/api/data-with-nest-cors", "OPTIONS");
  } catch (error) {
    console.error("Error running tests:", error);
  }
}

// Run the tests
runTests();

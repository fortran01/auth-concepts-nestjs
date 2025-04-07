const axios = require("axios");
const crypto = require("crypto");

/**
 * Simple script to test Digest Authentication
 * This demonstrates the challenge-response flow of Digest Auth
 */

const username = "admin";
const password = "secret";
const url = "http://localhost:3000/auth/digest";

async function testDigestAuth() {
  console.log("Testing Digest Authentication");
  console.log("-----------------------------");
  console.log(`URL: ${url}`);
  console.log(`Username: ${username}`);
  console.log(`Password: ${password}`);
  console.log("-----------------------------\n");

  try {
    // Step 1: Make an initial request (will get a 401 with WWW-Authenticate header)
    console.log("Step 1: Making initial request (expecting 401)...");
    const response = await axios.get(url, { validateStatus: (status) => true });

    if (response.status !== 401) {
      console.error("Expected 401 Unauthorized, got:", response.status);
      return;
    }

    console.log("Received 401 as expected");

    // Step 2: Parse the WWW-Authenticate header
    const authHeader = response.headers["www-authenticate"];
    console.log(`WWW-Authenticate: ${authHeader}`);

    if (!authHeader || !authHeader.includes("Digest")) {
      console.error(
        "Invalid WWW-Authenticate header or not Digest authentication"
      );
      return;
    }

    // Extract values from the header
    const headerValues = parseDigestHeader(authHeader);
    console.log("Parsed header values:", headerValues);

    const { realm, nonce, opaque } = headerValues;

    // Step 3: Calculate the digest response
    console.log("\nStep 3: Calculating digest response...");
    const method = "GET";
    const uri = "/auth/digest";

    // Calculate HA1 = MD5(username:realm:password)
    const ha1 = crypto
      .createHash("md5")
      .update(`${username}:${realm}:${password}`)
      .digest("hex");
    console.log(`HA1 (MD5(username:realm:password)): ${ha1}`);

    // Calculate HA2 = MD5(method:uri)
    const ha2 = crypto
      .createHash("md5")
      .update(`${method}:${uri}`)
      .digest("hex");
    console.log(`HA2 (MD5(method:uri)): ${ha2}`);

    // Calculate response = MD5(HA1:nonce:HA2)
    const digestResponse = crypto
      .createHash("md5")
      .update(`${ha1}:${nonce}:${ha2}`)
      .digest("hex");
    console.log(`Response (MD5(HA1:nonce:HA2)): ${digestResponse}`);

    // Step 4: Make authenticated request
    console.log("\nStep 4: Making authenticated request...");
    const authString = `Digest username="${username}", realm="${realm}", nonce="${nonce}", uri="${uri}", response="${digestResponse}", opaque="${opaque}"`;
    console.log(`Authorization: ${authString}`);

    const authenticatedResponse = await axios.get(url, {
      headers: {
        Authorization: authString,
      },
      validateStatus: (status) => true,
    });

    console.log(`Response status: ${authenticatedResponse.status}`);

    if (authenticatedResponse.status === 200) {
      console.log("Authentication successful! 🎉");
      // Just print the first 500 characters to not clutter console
      console.log(
        "Response body: " + authenticatedResponse.data.substring(0, 500) + "..."
      );
    } else {
      console.error("Authentication failed:", authenticatedResponse.status);
      console.error("Response:", authenticatedResponse.data);
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

function parseDigestHeader(header) {
  const matches = header.match(/(\w+)=("[^"]+"|[^,]+)/g);
  const result = {};

  if (matches) {
    matches.forEach((match) => {
      const [key, value] = match.split("=");
      // Remove quotes if present
      result[key] = value.replace(/"/g, "");
    });
  }

  return result;
}

testDigestAuth();

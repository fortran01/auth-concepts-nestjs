const { createClient } = require("redis");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

async function testRedisConnection() {
  console.log("Redis Connection Test");
  console.log("=====================");

  // Get Redis URL from environment or use default
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6380";
  console.log(`Connecting to Redis at: ${redisUrl}`);

  try {
    // Create Redis client
    const redisClient = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 5000, // 5 second timeout
      },
    });

    // Set up event handlers
    redisClient.on("error", (err) => {
      console.error("Redis client error:", err);
    });

    redisClient.on("connect", () => {
      console.log("\n✅ Redis client connected successfully!");
    });

    redisClient.on("reconnecting", () => {
      console.log("Redis client reconnecting...");
    });

    // Connect to Redis
    console.log("\nAttempting to connect to Redis...");
    await redisClient.connect();

    // Check if Redis is working by performing a simple operation
    console.log("\nTesting Redis operations:");

    // Set a test key
    const testKey = "redis-test-" + Date.now();
    await redisClient.set(testKey, "Connection test successful!");
    console.log(`- SET operation successful (key: ${testKey})`);

    // Get the test key
    const value = await redisClient.get(testKey);
    console.log(`- GET operation successful: "${value}"`);

    // Delete the test key
    await redisClient.del(testKey);
    console.log(`- DEL operation successful (key: ${testKey})`);

    console.log("\n✅ All Redis operations completed successfully!");

    // Close Redis connection
    await redisClient.disconnect();
    console.log("Redis connection closed.");

    console.log("\n=====================");
    console.log(
      "Redis is properly configured and working! The Redis session debug tool should work correctly."
    );
  } catch (error) {
    console.error("\n❌ Redis connection error:", error.message);
    console.error("\nTroubleshooting tips:");
    console.error("1. Make sure Redis is running: docker-compose up -d");
    console.error("2. Check if Redis is listening on port 6380: docker ps");
    console.error("3. Check your .env file for correct REDIS_URL");
    console.error(
      "4. Try connecting to Redis using redis-cli: redis-cli -p 6380 ping"
    );

    console.error("\n=====================");
    console.error(
      "Redis connection failed! The Redis session debug tool will not work correctly."
    );
    process.exit(1);
  }
}

// Run the test
testRedisConnection().catch(console.error);

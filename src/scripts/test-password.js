const bcrypt = require("bcrypt");

async function testPassword() {
  const password = "secret";
  const storedHash =
    "$2b$10$pPdGWWq4pCUs7/Xvkvm0aOENOGhEMenoUERFX/0kMCwSP5YpxKriC";

  console.log("Testing password hash...");

  // Generate a new hash
  const newHash = await bcrypt.hash(password, 10);
  console.log('New hash for "secret":', newHash);

  // Compare with stored hash
  const isValid = await bcrypt.compare(password, storedHash);
  console.log("Stored hash is valid?", isValid);

  // Test a wrong password
  const isInvalid = await bcrypt.compare("wrongpassword", storedHash);
  console.log("Wrong password is invalid?", !isInvalid);
}

testPassword().catch(console.error);

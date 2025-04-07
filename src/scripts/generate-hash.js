const bcrypt = require("bcrypt");

// Get the password from command line argument
const password = process.argv[2] || "secret";

// Number of salt rounds
const saltRounds = 10;

async function hashPassword() {
  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log("Password:", password);
    console.log("Hashed Password:", hashedPassword);
  } catch (error) {
    console.error("Error generating hash:", error);
  }
}

hashPassword();

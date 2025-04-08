const ldap = require("ldapjs");
const fs = require("fs");
const path = require("path");

// Configuration
const ldapConfig = {
  url: "ldap://localhost:10489",
  bindDN: "cn=admin,dc=example,dc=org",
  bindPassword: "admin_password",
  baseDN: "dc=example,dc=org",
};

// Create LDAP client
const client = ldap.createClient({
  url: ldapConfig.url,
  timeout: 5000,
  connectTimeout: 10000,
});

// Setup error handling
client.on("error", (err) => {
  console.error("LDAP connection error:", err);
  process.exit(1);
});

// Authentication function
async function authenticate() {
  return new Promise((resolve, reject) => {
    client.bind(ldapConfig.bindDN, ldapConfig.bindPassword, (err) => {
      if (err) {
        console.error("LDAP bind error:", err);
        reject(err);
      } else {
        console.log("LDAP bind successful");
        resolve();
      }
    });
  });
}

// Create organization units
async function createOrganizationalUnit(name) {
  const entry = {
    objectClass: ["top", "organizationalUnit"],
    ou: name,
  };

  return new Promise((resolve, reject) => {
    const dn = `ou=${name},${ldapConfig.baseDN}`;
    client.add(dn, entry, (err) => {
      if (err) {
        // If entry already exists, just return success
        if (err.code === 68) {
          console.log(`OU ${name} already exists, skipping`);
          resolve();
        } else {
          console.error(`Error creating OU ${name}:`, err);
          reject(err);
        }
      } else {
        console.log(`Successfully created OU: ${name}`);
        resolve();
      }
    });
  });
}

// Create user function
async function createUser(user) {
  // Convert password to the format OpenLDAP expects
  // The password needs to be in clear text, but LDAP requires it to be prefixed
  // with "{CLEAR}" to indicate it's a clear-text password.
  const password = user.password;

  const entry = {
    objectClass: ["top", "person", "organizationalPerson", "inetOrgPerson"],
    cn: user.cn,
    sn: user.sn,
    uid: user.uid,
    givenName: user.givenName,
    mail: user.mail,
    title: user.title,
    userPassword: password,
  };

  return new Promise((resolve, reject) => {
    const dn = `uid=${user.uid},ou=People,${ldapConfig.baseDN}`;
    console.log(`Creating user with DN: ${dn}`);
    client.add(dn, entry, (err) => {
      if (err) {
        // If entry already exists, just return success
        if (err.code === 68) {
          console.log(`User ${user.uid} already exists, skipping`);
          resolve();
        } else {
          console.error(`Error creating user ${user.uid}:`, err);
          reject(err);
        }
      } else {
        console.log(`Successfully created user: ${user.uid}`);
        resolve();
      }
    });
  });
}

// Main function
async function main() {
  try {
    // Connect to LDAP server
    await authenticate();

    // Create People OU
    await createOrganizationalUnit("People");

    // Create test users
    const users = [
      {
        uid: "john.doe",
        cn: "John Doe",
        sn: "Doe",
        givenName: "John",
        mail: "john.doe@example.org",
        title: "Software Engineer",
        password: "password123",
      },
      {
        uid: "jane.smith",
        cn: "Jane Smith",
        sn: "Smith",
        givenName: "Jane",
        mail: "jane.smith@example.org",
        title: "Product Manager",
        password: "password456",
      },
    ];

    // Create each user
    for (const user of users) {
      await createUser(user);
    }

    console.log("LDAP setup completed successfully");
  } catch (error) {
    console.error("Error setting up LDAP:", error);
  } finally {
    // Unbind and close connection
    client.unbind((err) => {
      if (err) {
        console.error("Error unbinding from LDAP:", err);
      }
      client.destroy();
      process.exit(0);
    });
  }
}

// Run the script
main();

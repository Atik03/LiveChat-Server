const dns = require("node:dns");

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const { MongoClient } = require("mongodb");

const client = new MongoClient(process.env.MONGODB_URI);

let db;

const connectDB = async () => {
  try {
    await client.connect();

    db = client.db(process.env.MONGODB_DB_NAME);

    // Ensure username remains unique
    await db.collection("user").createIndex(
      { username: 1 },
      {
        unique: true,
        sparse: true,
      },
    );

    console.log("MongoDB connected successfully");
    console.log("Username unique index ensured");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);

    process.exit(1);
  }
};

const getDB = () => {
  if (!db) {
    throw new Error("Database is not connected");
  }

  return db;
};

module.exports = {
  connectDB,
  getDB,
};

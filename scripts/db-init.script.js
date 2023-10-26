import db from "#root/config/database.config.js";

async function run() {
  try {
    await db.migrate({ force: true });
    console.log("Database initialized.");
  } catch (error) {
    console.error(error);
  }
}

run();

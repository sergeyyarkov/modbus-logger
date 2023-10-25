import db from '#root/config/database.config.js'

async function run() {
  try {
    await db.migrate({ force: false })
    console.log('Database initialized.');
  } catch (error) {
    throw error;
  }
}

run();

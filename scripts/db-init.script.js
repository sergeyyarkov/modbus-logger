import { runQueryFromFile } from "#root/utils/database.util.js";

async function run() {
  await runQueryFromFile("sql/init-schema.sql");
}

run();

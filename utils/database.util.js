import fs from "fs/promises";
import db from "#root/config/database.config.js";

/**
 * Reads the `.sql` file and executes the query
 * @param {string} filepath
 */
export async function runQueryFromFile(filepath) {
  try {
    const query = await fs.readFile(filepath);
    await db.run(query.toString());
  } catch (error) {
    throw error;
  }
}

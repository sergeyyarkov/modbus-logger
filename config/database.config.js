// @ts-nocheck
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const sqlite = process.env.NODE_ENV == "development" ? sqlite3.verbose() : sqlite3;

const db = await open({ filename: "./data.db", driver: sqlite.Database });

export default db;

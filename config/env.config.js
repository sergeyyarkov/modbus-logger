import 'dotenv/config';

export default {
  SERVER_PORT: Number.parseInt(process.env?.SERVER_PORT, 10) || 3000,
};

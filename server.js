import app from "#root/app/index.js";
import env from "#root/config/env.config.js";

app.listen(env.SERVER_PORT, () => console.log(`Web server started: http://127.0.0.1:${env.SERVER_PORT}.`));

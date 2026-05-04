import dotenv from "dotenv";
dotenv.config({ debug: process.env.NODE_ENV === 'development' });

import validateEnv from "./config/validateEnv.js";
validateEnv();
import { validateConnection } from "./config/db.js";

const { default: app } = await import("./app.js");
const PORT = process.env.BACKEND_URL.split(':')[2] || 3030;

await validateConnection();
app.listen(PORT, () => {
	console.log(` - Backend: @ ${process.env.BACKEND_URL}\n - Database @ ${process.env.DB_HOST}\n - Frontend @ ${process.env.FRONTEND_URL}`);
});

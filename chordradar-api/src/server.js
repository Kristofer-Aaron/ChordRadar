import app from "./app.js";

const PORT = process.env.BACKEND_URL.split(':')[2] || 3030;

app.listen(PORT, () => {
	console.log(` - Backend: @ ${process.env.BACKEND_URL}\n - Database @ ${process.env.DB_HOST}\n - Frontend @ ${process.env.FRONTEND_URL}`);
});

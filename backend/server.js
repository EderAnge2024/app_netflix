import express from "express";
import cors from "cors";
import router from "./modules/users/routes.js"; // ✅ Ruta corregida

const app = express();

// 🧩 Middlewares
app.use(cors());
app.use(express.json());

// 🚀 Prefijo de rutas
app.use("/api", router);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});

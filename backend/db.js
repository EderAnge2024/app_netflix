import pkg from "pg";
const { Pool } = pkg;

// Configuración de conexión a PostgreSQL
const pool = new Pool({
  host: "localhost",
  user: "postgres",
  password: "portodander123",
  database: "appnetflix",
  port: 5433,
});

// Verificar conexión
pool.connect()
  .then(() => console.log("✅ Conectado a la base de datos"))
  .catch((err) => console.error("❌ Error al conectar a la base de datos:", err));

export default pool; // 👈 Importante para que funcione el import en model.js

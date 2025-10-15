import pool from "../../db.js";

// 🔧 Crear tabla automáticamente si no existe
async function ensureTableExists() {
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      usuario VARCHAR(100) UNIQUE NOT NULL,
      contrasena VARCHAR(100) NOT NULL,
      correo VARCHAR(150) UNIQUE NOT NULL
    );
  `;
  await pool.query(query);
}

// Ejecutar al cargar el módulo
ensureTableExists();

// 🧾 Crear usuario
export async function createUser(nombre, usuario, contrasena, correo) {
  const result = await pool.query(
    "INSERT INTO users (nombre, usuario, contrasena, correo) VALUES ($1, $2, $3, $4) RETURNING *",
    [nombre, usuario, contrasena, correo]
  );
  return result.rows[0];
}

// 🔍 Buscar usuario (login)
export async function findUser(usuario, contrasena) {
  const result = await pool.query(
    "SELECT * FROM users WHERE usuario = $1 AND contrasena = $2",
    [usuario, contrasena]
  );
  return result.rows[0];
}

// 🔍 Buscar usuario por correo (para recuperación)
export async function findUserByEmail(correo) {
  const result = await pool.query(
    "SELECT * FROM users WHERE correo = $1",
    [correo]
  );
  return result.rows[0];
}

// 🔄 Actualizar contraseña por correo
export async function updatePassword(correo, nuevaContrasena) {
  const result = await pool.query(
    "UPDATE users SET contrasena = $1 WHERE correo = $2 RETURNING *",
    [nuevaContrasena, correo]
  );
  return result.rows[0];
}
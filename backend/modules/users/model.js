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

  // 🔄 NUEVA tabla para códigos de verificación
  const verificationCodesTable = `
    CREATE TABLE IF NOT EXISTS verification_codes (
      id SERIAL PRIMARY KEY,
      correo VARCHAR(150) NOT NULL,
      codigo VARCHAR(6) NOT NULL,
      expiracion TIMESTAMP NOT NULL,
      usado BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `;
    await pool.query(query);
    await pool.query(verificationCodesTable);
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

// Generar código de verificación
export async function createVerificationCode(correo, codigo) {
  // Eliminar códigos antiguos del mismo correo
  await pool.query(
    "DELETE FROM verification_codes WHERE correo = $1",
    [correo]
  );

  // Crear nuevo código con expiración de 10 minutos
  const expiracion = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos
  
  const result = await pool.query(
    "INSERT INTO verification_codes (correo, codigo, expiracion) VALUES ($1, $2, $3) RETURNING *",
    [correo, codigo, expiracion]
  );
  return result.rows[0];
}

// Verificar código
export async function verifyCode(correo, codigo) {
  const result = await pool.query(
    "SELECT * FROM verification_codes WHERE correo = $1 AND codigo = $2 AND usado = FALSE AND expiracion > NOW()",
    [correo, codigo]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  // Marcar código como usado
  await pool.query(
    "UPDATE verification_codes SET usado = TRUE WHERE id = $1",
    [result.rows[0].id]
  );
  
  return result.rows[0];
}

// Limpiar códigos expirados
export async function cleanExpiredCodes() {
  await pool.query(
    "DELETE FROM verification_codes WHERE expiracion < NOW() OR usado = TRUE"
  );
}
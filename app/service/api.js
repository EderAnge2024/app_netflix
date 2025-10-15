// api.js

// 🔹 Login
export async function loginUser(usuario, contrasena) {
  try {
    const response = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, contrasena }),
    });
    const data = await response.json();
    return data; 
  } catch (error) {
    console.error('Error de conexión:', error);
    return { success: false, message: 'Error de conexión' };
  }
}

// 🔹 Registro
export async function registerUser(nombre, usuario, contrasena, correo) {
  try {
    const response = await fetch('http://localhost:3000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, usuario, contrasena, correo }),
    });
    const data = await response.json();
    return data; 
  } catch (error) {
    console.error('Error de conexión:', error);
    return { success: false, message: 'Error de conexión' };
  }
}
// 🔄 Solicitar código de verificación
export async function requestCode(correo) {
  try {
    const response = await fetch('http://localhost:3000/api/request-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo }),
    });
    const data = await response.json();
    return data; 
  } catch (error) {
    console.error('Error de conexión:', error);
    return { success: false, message: 'Error de conexión' };
  }
}

// 🔄 Verificar código y cambiar contraseña
export async function verifyCodeAndResetPassword(correo, codigo, nuevaContrasena) {
  try {
    const response = await fetch('http://localhost:3000/api/verify-code-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, codigo, nuevaContrasena }),
    });
    const data = await response.json();
    return data; 
  } catch (error) {
    console.error('Error de conexión:', error);
    return { success: false, message: 'Error de conexión' };
  }
}

// 🔍 Verificar solo el código
export async function verifyCodeOnly(correo, codigo) {
  try {
    const response = await fetch('http://localhost:3000/api/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, codigo }),
    });
    const data = await response.json();
    return data; 
  } catch (error) {
    console.error('Error de conexión:', error);
    return { success: false, message: 'Error de conexión' };
  }
}

// 🔍 Verificar correo
export async function verifyEmail(correo) {
  try {
    const response = await fetch('http://localhost:3000/api/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo }),
    });
    const data = await response.json();
    return data; 
  } catch (error) {
    console.error('Error de conexión:', error);
    return { success: false, message: 'Error de conexión' };
  }
}
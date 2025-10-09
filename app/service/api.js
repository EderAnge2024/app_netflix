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

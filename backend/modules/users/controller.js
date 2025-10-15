import { createUser, findUser, findUserByEmail, updatePassword  } from "./model.js";

export async function register(req, res) {
  const { nombre, usuario, contrasena, correo } = req.body;
  try {
    const newUser = await createUser(nombre, usuario, contrasena, correo);
    res.json(newUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function login(req, res) {
  const { usuario, contrasena } = req.body;

  if (!usuario || !contrasena) {
    return res.status(400).json({ success: false, message: "Todos los campos son obligatorios" });
  }

  try {
    const user = await findUser(usuario, contrasena);

    if (user) {
      res.json({ success: true, message: "Login exitoso", user });
    } else {
      res.json({ success: false, message: "Usuario o contraseña incorrectos" });
    }

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
// 🔄 Controller para RECUPERAR contraseña
export async function recoverPassword(req, res) {
  const { correo, nuevaContrasena } = req.body;

  if (!correo || !nuevaContrasena) {
    return res.status(400).json({ 
      success: false, 
      message: "Correo y nueva contraseña son obligatorios" 
    });
  }

  try {
    // Verificar si el correo existe
    const user = await findUserByEmail(correo);
    if (!user) {
      return res.json({ 
        success: false, 
        message: "Correo no encontrado" 
      });
    }

    // Actualizar la contraseña
    const updatedUser = await updatePassword(correo, nuevaContrasena);
    
    res.json({ 
      success: true, 
      message: "Contraseña actualizada correctamente. Ahora puedes iniciar sesión con tu nueva contraseña.",
      user: updatedUser 
    });

  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: "Error al actualizar la contraseña: " + err.message 
    });
  }
}

// 🔍 Controller para verificar correo
export async function verifyEmail(req, res) {
  const { correo } = req.body;

  if (!correo) {
    return res.status(400).json({ 
      success: false, 
      message: "El correo es obligatorio" 
    });
  }

  try {
    const user = await findUserByEmail(correo);
    
    if (user) {
      res.json({ 
        success: true, 
        exists: true,
        message: "Correo verificado correctamente" 
      });
    } else {
      res.json({ 
        success: false, 
        exists: false,
        message: "Correo no encontrado" 
      });
    }

  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: "Error al verificar el correo: " + err.message 
    });
  }
}
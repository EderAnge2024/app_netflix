import { createUser, findUser, findUserByEmail, updatePassword, createVerificationCode, verifyCode, cleanExpiredCodes } from "./model.js";
import crypto from "crypto";
import nodemailer from "nodemailer";

// Configurable expiration time for verification codes (in seconds)
const VERIFICATION_CODE_EXPIRATION = process.env.VERIFICATION_CODE_EXPIRATION
  ? parseInt(process.env.VERIFICATION_CODE_EXPIRATION, 10)
  : 600; // Default: 10 minutes

const sendVerificationCode = async (correo, codigo) => {
  if (process.env.NODE_ENV === "production") {
    // Configura el transporte de nodemailer (ajusta con tus credenciales reales)
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // tu correo
        pass: process.env.EMAIL_PASS, // tu contraseña o app password
      },
    });

    let mailOptions = {
      from: process.env.EMAIL_USER,
      to: correo,
      subject: "Código de verificación",
      text: `Tu código de verificación es: ${codigo}`,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Código enviado a: ${correo}`);
      return true;
    } catch (error) {
      console.error("Error enviando correo:", error);
      throw new Error("No se pudo enviar el correo de verificación");
    }
  } else {
    // Simulador para desarrollo
    console.log(`📧 Código de verificación para ${correo}: ${codigo}`);
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`✅ Código enviado a: ${correo}`);
        resolve(true);
      }, 1000);
    });
  }
};

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

export async function requestCode(req, res) {
  const { correo } = req.body;

  if (!correo) {
    return res.status(400).json({
      success: false,
      message: "El correo es obligatorio"
    });
  }

  try {
    // Limpiar códigos expirados
    await cleanExpiredCodes();

    // Verificar si el correo existe
    const user = await findUserByEmail(correo);
    if (!user) {
      return res.json({
        success: false,
        message: "Correo no encontrado"
      });
    }

    // Generar código de 6 dígitos de forma segura
    const codigo = crypto.randomInt(100000, 1000000).toString();

    // Guardar código en la base de datos (con expiración configurable)
    await createVerificationCode(correo, codigo, VERIFICATION_CODE_EXPIRATION);

    // Enviar código por mensajería (correo o simulador)
    await sendVerificationCode(correo, codigo);

    res.json({
      success: true,
      message: "Código de verificación enviado a tu correo",
      correo: correo
    });

  } catch (err) {
    console.error("Error en requestCode:", err);
    res.status(500).json({
      success: false,
      message: "Error al enviar el código: " + (err?.message || err)
    });
  }
}

// 🔄 Paso 2: Verificar código y cambiar contraseña
export async function verifyCodeAndResetPassword(req, res) {
  const { correo, codigo, nuevaContrasena } = req.body;

  if (!correo || !codigo || !nuevaContrasena) {
    return res.status(400).json({
      success: false,
      message: "Todos los campos son obligatorios"
    });
  }

  try {
    // Verificar si el código es válido
    const verifiedCode = await verifyCode(correo, codigo);
    if (!verifiedCode) {
      return res.json({
        success: false,
        message: "Código inválido o expirado"
      });
    }

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
    console.error("Error en verifyCodeAndResetPassword:", err);
    res.status(500).json({
      success: false,
      message: "Error al actualizar la contraseña: " + (err?.message || err)
    });
  }
}

// 🔍 Verificar solo el código (sin cambiar contraseña)
export async function verifyCodeOnly(req, res) {
  const { correo, codigo } = req.body;

  if (!correo || !codigo) {
    return res.status(400).json({
      success: false,
      message: "Correo y código son obligatorios"
    });
  }

  try {
    const verifiedCode = await verifyCode(correo, codigo);

    if (verifiedCode) {
      res.json({
        success: true,
        message: "Código verificado correctamente",
        valido: true
      });
    } else {
      res.json({
        success: false,
        message: "Código inválido o expirado",
        valido: false
      });
    }

  } catch (err) {
    console.error("Error en verifyCodeOnly:", err);
    res.status(500).json({
      success: false,
      message: "Error al verificar el código: " + (err?.message || err)
    });
  }
}

// 🔍 Verificar si correo existe
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
    console.error("Error en verifyEmail:", err);
    res.status(500).json({
      success: false,
      message: "Error al verificar el correo: " + (err?.message || err)
    });
  }
}
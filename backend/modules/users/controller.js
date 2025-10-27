import { createUser, findUser, findUserByEmail, updatePassword, createVerificationCode, verifyCode, cleanExpiredCodes } from "./model.js";
import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config();

// 📧 Configuración MEJORADA del transporter (con pool y timeouts)
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    },
    // MEJORAS PARA CONECTIVIDAD
    connectionTimeout: 30000, // 30 segundos
    socketTimeout: 30000,
    greetingTimeout: 30000,
    pool: true, // Conexiones persistentes
    maxConnections: 3,
    maxMessages: 50
  });
};

// 🔄 Función con reintentos inteligentes
const sendEmailWithRetry = async (mailOptions, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const transporter = createTransporter();
    
    try {
      console.log(`📧 Intento ${attempt} de enviar correo a: ${mailOptions.to}`);
      
      const result = await transporter.sendMail(mailOptions);
      console.log(`✅ Correo REAL enviado a: ${mailOptions.to}`);
      console.log(`📫 ID del mensaje: ${result.messageId}`);
      
      await transporter.close(); // Cerrar conexión
      return { success: true, messageId: result.messageId };
      
    } catch (error) {
      console.error(`❌ Intento ${attempt} fallado:`, error.code);
      
      // Cerrar transporter en caso de error
      try { await transporter.close(); } catch (e) {}
      
      // Si es el último intento, lanzar el error
      if (attempt === maxRetries) {
        console.error('🚨 Todos los intentos fallaron para:', mailOptions.to);
        throw error;
      }
      
      // Espera progresiva antes del reintento
      const waitTime = Math.pow(2, attempt) * 1000;
      console.log(`⏳ Reintentando en ${waitTime/1000} segundos...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
};

// 📧 Función MEJORADA para enviar correos (con reintentos)
const sendVerificationCode = async (correo, codigo) => {
  try {
    // Configurar el contenido del correo (IGUAL QUE ANTES)
    const mailOptions = {
      from: `"Sistema de Verificación" <${process.env.GMAIL_USER}>`,
      to: correo,
      subject: '🔐 Código de Verificación - Recuperación de Contraseña',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb; text-align: center;">Recuperación de Contraseña</h2>
          <p>Hola,</p>
          <p>Has solicitado restablecer tu contraseña. Usa el siguiente código para verificar tu identidad:</p>
          <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; margin: 25px 0; letter-spacing: 8px; border-radius: 8px;">
            ${codigo}
          </div>
          <p>Este código expirará en <strong>10 minutos</strong>.</p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Si no solicitaste este código, por favor ignora este mensaje.
          </p>
        </div>
      `
    };

    // Enviar el correo CON REINTENTOS
    const result = await sendEmailWithRetry(mailOptions, 3);
    return result;
    
  } catch (error) {
    console.error('❌ Error enviando correo REAL:', error);
    throw new Error(`No se pudo enviar el correo: ${error.message}`);
  }
};

// 🔧 Función para verificar conexión SMTP (opcional)
export async function verifySMTPConnection() {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Conexión SMTP verificada correctamente');
    await transporter.close();
    return true;
  } catch (error) {
    console.error('❌ Error verificando conexión SMTP:', error);
    return false;
  }
}

// 🎯 TODAS LAS DEMÁS FUNCIONES SE MANTIENEN IGUAL
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

// 🔄 Paso 1: Solicitar código de verificación
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

    // Generar código de 6 dígitos
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Guardar código en la base de datos
    await createVerificationCode(correo, codigo);

    // Enviar código por mensajería (CON LA NUEVA FUNCIÓN MEJORADA)
    await sendVerificationCode(correo, codigo);

    res.json({ 
      success: true, 
      message: "Código de verificación enviado a tu correo",
      correo: correo
    });

  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: "Error al enviar el código: " + err.message 
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
    res.status(500).json({ 
      success: false, 
      message: "Error al actualizar la contraseña: " + err.message 
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
    res.status(500).json({ 
      success: false, 
      message: "Error al verificar el código: " + err.message 
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
    res.status(500).json({ 
      success: false, 
      message: "Error al verificar el correo: " + err.message 
    });
  }
}
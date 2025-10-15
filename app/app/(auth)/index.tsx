import React, { createContext,useState } from 'react';
import { 
  Dimensions, 
  ImageBackground, 
  StyleSheet, 
  TextInput, 
  Button, 
  View, 
  Text, 
  TouchableOpacity,
  Modal,
  Pressable 
} from 'react-native';
import { loginUser, registerUser, requestCode, verifyCodeAndResetPassword } from '@/service/api';
import { useRouter } from 'expo-router';
import { useUser } from '@/components/ui/logeadoDatos/userContext';

export default function AuthScreen() {

  const router = useRouter();
  const { height, width } = Dimensions.get('window');

  const [modoRegistro, setModoRegistro] = useState(false);
  const [mostrarRecuperar, setMostrarRecuperar] = useState(false);
  const [nombre, setNombre] = useState('');
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [correo, setCorreo] = useState('');
  const [codigo, setCodigo] = useState('');
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('');
  const [pasoRecuperacion, setPasoRecuperacion] = useState(1); // 1: solicitar código, 2: verificar código y nueva contraseña
  const [codigoEnviado, setCodigoEnviado] = useState(false);

  const { setUser } = useUser();

  const handleLogin = async () => {
    if (!usuario || !contrasena) {
      setTipoMensaje('error');
      return setMensaje('Ingresa usuario y contraseña');
    }

    const result = await loginUser(usuario, contrasena);

    if (result.success) {
      setTipoMensaje('exito');
      setMensaje(`Bienvenido ${result.user.nombre}`);
      console.log('Usuario:', result.user);
      setUser(result.user);
      router.replace('/(tabs)/principalNav');
    } else {
      setTipoMensaje('error');
      setMensaje('Usuario no encontrado o contraseña incorrecta');
    }
  };
  
  const handleRegister = async () => {
    if (!nombre || !usuario || !contrasena || !correo) {
      setTipoMensaje('error');
      return setMensaje('Completa todos los campos para registrarte');
    }

    const result = await registerUser(nombre, usuario, contrasena, correo);

    if (result.id || result.success) {
      setTipoMensaje('exito');
      setMensaje(`Usuario ${result.usuario || result.user?.usuario} creado`);
      setModoRegistro(false);
      setNombre('');
      setCorreo('');
      setContrasena('');
    } else {
      setTipoMensaje('error');
      setMensaje(result.error || 'El usuario ya existe. Intenta iniciar sesión');
    }
  };

  // 🔄 Paso 1: Solicitar código de verificación
  const handleSolicitarCodigo = async () => {
    if (!correo) {
      setTipoMensaje('error');
      return setMensaje('Ingresa tu correo electrónico');
    }

    const result = await requestCode(correo);
    
    if (result.success) {
      setTipoMensaje('exito');
      setMensaje('Código de verificación enviado a tu correo');
      setCodigoEnviado(true);
      setPasoRecuperacion(2);
    } else {
      setTipoMensaje('error');
      setMensaje(result.message || 'Error al enviar el código');
    }
  };

  // 🔄 Paso 2: Verificar código y cambiar contraseña
  const handleVerificarCodigoYCambiar = async () => {
    if (!codigo || !nuevaContrasena || !confirmarContrasena) {
      setTipoMensaje('error');
      return setMensaje('Completa todos los campos');
    }

    if (nuevaContrasena !== confirmarContrasena) {
      setTipoMensaje('error');
      return setMensaje('Las contraseñas no coinciden');
    }

    if (nuevaContrasena.length < 6) {
      setTipoMensaje('error');
      return setMensaje('La contraseña debe tener al menos 6 caracteres');
    }

    const result = await verifyCodeAndResetPassword(correo, codigo, nuevaContrasena);

    if (result.success) {
      setTipoMensaje('exito');
      setMensaje('¡Contraseña actualizada! Ahora puedes iniciar sesión');
      resetRecuperacion();
    } else {
      setTipoMensaje('error');
      setMensaje(result.message || 'Error al actualizar la contraseña');
    }
  };

  // 🔄 Resetear modal de recuperación
  const resetRecuperacion = () => {
    setMostrarRecuperar(false);
    setPasoRecuperacion(1);
    setCorreo('');
    setCodigo('');
    setNuevaContrasena('');
    setConfirmarContrasena('');
    setCodigoEnviado(false);
    setMensaje('');
  };

  return (
    <ImageBackground  
      source={require('../../assets/images/fondo.jpg')}
      style={{width,height}}
      resizeMode='cover'
    >
      <View style={styles.container}>
        <View style={styles.contenLogeo}>
          <Text style={styles.nombreApp}>MaFre</Text>
          <Text style={styles.title}>{modoRegistro ? 'Registrarse' : 'Iniciar sesión'}</Text>
    
          {modoRegistro && (
            <>
              <TextInput
                placeholder="Nombre"
                style={styles.input}
                value={nombre}
                onChangeText={setNombre}
              />
              <TextInput
                placeholder="Correo"
                style={styles.input}
                value={correo}
                onChangeText={setCorreo}
                keyboardType="email-address"
              />
            </>
          )}
    
          <TextInput
            placeholder="Usuario"
            style={styles.input}
            value={usuario}
            onChangeText={setUsuario}
          />
          <TextInput
            placeholder="Contraseña"
            style={styles.input}
            secureTextEntry
            value={contrasena}
            onChangeText={setContrasena}
          />
    
          {/* Mensaje de validación */}
          {mensaje ? (
            <Text style={[styles.mensaje, tipoMensaje === 'error' ? styles.error : styles.exito]}>
              {mensaje}
            </Text>
          ) : null}
    
          <View style={styles.buttonContainer}>
            <Button
              title={modoRegistro ? 'Registrar' : 'Login'}
              onPress={modoRegistro ? handleRegister : handleLogin}
            />
            
            <TouchableOpacity onPress={() => setModoRegistro(!modoRegistro)}>
              <Text style={styles.switchText}>
                {modoRegistro ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
              </Text>
            </TouchableOpacity>

            {/* Enlace para recuperar contraseña - Solo mostrar en login */}
            {!modoRegistro && (
              <TouchableOpacity onPress={() => setMostrarRecuperar(true)}>
                <Text style={styles.recuperarText}>
                  ¿Olvidaste tu contraseña?
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* 🔄 Modal de Recuperación de Contraseña */}
      <Modal visible={mostrarRecuperar} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {pasoRecuperacion === 1 ? 'Recuperar Contraseña' : 'Crear Nueva Contraseña'}
            </Text>

            {pasoRecuperacion === 1 ? (
              <>
                <Text style={styles.modalText}>
                  Ingresa tu correo electrónico para recibir un código de verificación
                </Text>
                <TextInput
                  placeholder="Correo electrónico"
                  style={styles.input}
                  value={correo}
                  onChangeText={setCorreo}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                
                <View style={styles.modalButtons}>
                  <Pressable style={[styles.modalButton, styles.cancelButton]} onPress={resetRecuperacion}>
                    <Text style={styles.modalButtonText}>Cancelar</Text>
                  </Pressable>
                  <Pressable style={[styles.modalButton, styles.primaryButton]} onPress={handleSolicitarCodigo}>
                    <Text style={styles.modalButtonText}>Enviar Código</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.modalText}>
                  Ingresa el código que recibiste y tu nueva contraseña
                </Text>
                <TextInput
                  placeholder="Código de verificación"
                  style={styles.input}
                  value={codigo}
                  onChangeText={setCodigo}
                  keyboardType="numeric"
                  maxLength={6}
                />
                <TextInput
                  placeholder="Nueva contraseña"
                  style={styles.input}
                  secureTextEntry
                  value={nuevaContrasena}
                  onChangeText={setNuevaContrasena}
                />
                <TextInput
                  placeholder="Confirmar nueva contraseña"
                  style={styles.input}
                  secureTextEntry
                  value={confirmarContrasena}
                  onChangeText={setConfirmarContrasena}
                />
                
                <View style={styles.modalButtons}>
                  <Pressable style={[styles.modalButton, styles.cancelButton]} onPress={() => setPasoRecuperacion(1)}>
                    <Text style={styles.modalButtonText}>Atrás</Text>
                  </Pressable>
                  <Pressable style={[styles.modalButton, styles.primaryButton]} onPress={handleVerificarCodigoYCambiar}>
                    <Text style={styles.modalButtonText}>Cambiar Contraseña</Text>
                  </Pressable>
                </View>
              </>
            )}

            {/* Mensaje en el modal */}
            {mensaje ? (
              <Text style={[styles.mensajeModal, tipoMensaje === 'error' ? styles.error : styles.exito]}>
                {mensaje}
              </Text>
            ) : null}
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems:'center',
    backgroundColor: 'rgba(13, 13, 13, 0.7)',
  },
  contenLogeo: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    padding: 20,
    width: '85%',
    backgroundColor: 'rgba(0, 0, 0, 0.52)',
  },
  nombreApp: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#e50914',
    marginBottom: 15,
    textAlign: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight:'100',
    marginBottom: 14,
    color: '#f6f4f4ff',
    textAlign: 'center',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  switchText: {
    marginTop: 12,
    color: '#007bff',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  recuperarText: {
    marginTop: 8,
    color: '#ff6b6b',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  mensaje: {
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 14,
  },
  mensajeModal: {
    marginTop: 10,
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 14,
  },
  error: {
    color: '#ff6b6b',
  },
  exito: {
    color: '#4caf50',
  },
  // Estilos para el modal de recuperación
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 20,
    width: '100%',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalText: {
    color: '#ccc',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  primaryButton: {
    backgroundColor: '#E50914',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
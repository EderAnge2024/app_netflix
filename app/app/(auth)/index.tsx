import React, { createContext,useState } from 'react';
import { Dimensions, ImageBackground , StyleSheet, TextInput, Button, View, Text, TouchableOpacity } from 'react-native';
import { loginUser, registerUser } from '@/service/api';
import { useRouter } from 'expo-router';
import { useUser } from '@/components/ui/logeadoDatos/userContext';

export default function AuthScreen() {

  const router = useRouter();
  const { height, width } = Dimensions.get('window');

  const [modoRegistro, setModoRegistro] = useState(false);
  const [nombre, setNombre] = useState('');
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [correo, setCorreo] = useState('');
  const [mensaje, setMensaje] = useState(''); // estado para mostrar mensaje
  const [tipoMensaje, setTipoMensaje] = useState(''); // 'error' o 'exito'

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
        </View>
      </View>
    </View>
    </ImageBackground >
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
  mensaje: {
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
  },
  exito: {
    color: 'green',
  },
});

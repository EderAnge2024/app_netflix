// components/ui/otrosNav/perfil.tsx
import React, { useContext } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useUser } from '@/components/ui/logeadoDatos/userContext';
import { useRouter } from 'expo-router';

export default function Perfil() {
    const { user, setUser } = useUser();
    const router = useRouter();
    
    const handleLogout = () => {
       setUser(null);          // limpia el usuario del contexto
       router.replace('/');     // vuelve al login (index dentro de auth)
    };

      if (!user) {
        return (
          <View style={styles.container}>
            <Text style={styles.header}>Perfil</Text>
            <Text style={styles.message}>No hay sesión iniciada</Text>
          </View>
        );
      }
    
      return (
        <View style={styles.container}>
          <Text style={styles.header}>Perfil</Text>
          <Text style={styles.message}>Nombre: {user.nombre}</Text>
          <Text style={styles.message}>Usuario: {user.usuario}</Text>
          <Text style={styles.message}>Correo: {user.correo}</Text>
          <Button title="Cerrar sesión" color="#E50914" onPress={handleLogout} />
        </View>
      );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
    padding: 20,
  },
  header: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  message: {
    color: '#ccc',
    fontSize: 18,
  },
});

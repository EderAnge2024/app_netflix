// components/ui/otrosNav/perfil.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
} from 'react-native';
import { useUser } from '@/components/ui/logeadoDatos/userContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Tipo para cada perfil
interface PerfilData {
  nombre: string;
  activo: boolean;
  icono: keyof typeof Ionicons.glyphMap;
  correo?: string;
  usuario?: string;
}

export default function Perfil() {
  const { user, setUser } = useUser();
  const router = useRouter();
  const [perfilSeleccionado, setPerfilSeleccionado] = useState<PerfilData | null>(null);

  const handleLogout = () => {
    setUser(null);
    router.replace('/'); // Vuelve al login
  };

  // Datos de los perfiles (usuario actual + otros)
  const perfiles: PerfilData[] = user
    ? [
        {
          nombre: user.nombre,
          activo: true,
          icono: 'person-circle-outline',
          correo: user.correo,
          usuario: user.usuario,
        },
        {
          nombre: 'Usuario 1',
          activo: false,
          icono: 'person-outline',
          correo: 'usuario1@correo.com',
          usuario: 'usuario1',
        },
        {
          nombre: 'Usuario 2',
          activo: false,
          icono: 'person-outline',
          correo: 'usuario2@correo.com',
          usuario: 'usuario2',
        },
      ]
    : [];

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>¿Quién está viendo?</Text>

      {perfiles.length === 0 ? (
        <Text style={styles.noPerfiles}>No hay usuarios o perfiles</Text>
      ) : (
        <View style={styles.perfilesContainer}>
          {perfiles.map((perfil, index) => (
            <PerfilCard
              key={index}
              perfil={perfil}
              onPress={() => setPerfilSeleccionado(perfil)}
            />
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.botonCerrar} onPress={handleLogout}>
        <Text style={styles.textoCerrar}>Cerrar sesión</Text>
      </TouchableOpacity>

      {/* Modal de información del perfil */}
      <Modal
        visible={!!perfilSeleccionado}
        transparent
        animationType="fade"
        onRequestClose={() => setPerfilSeleccionado(null)}
      >
        <View style={styles.modalFondo}>
          <View style={styles.modalContenido}>
            {perfilSeleccionado && (
              <>
                <View
                  style={[
                    styles.iconoModalContainer,
                    perfilSeleccionado.activo
                      ? { borderColor: '#E50914' }
                      : { borderColor: '#555' },
                  ]}
                >
                  <Ionicons
                    name={perfilSeleccionado.icono}
                    size={70}
                    color={perfilSeleccionado.activo ? '#E50914' : '#ccc'}
                  />
                </View>
                <Text style={styles.nombreModal}>{perfilSeleccionado.nombre}</Text>
                {perfilSeleccionado.correo && (
                  <Text style={styles.infoModal}>Correo: {perfilSeleccionado.correo}</Text>
                )}
                {perfilSeleccionado.usuario && (
                  <Text style={styles.infoModal}>Usuario: {perfilSeleccionado.usuario}</Text>
                )}

                <TouchableOpacity
                  style={styles.botonCerrarModal}
                  onPress={() => setPerfilSeleccionado(null)}
                >
                  <Text style={styles.textoCerrarModal}>Cerrar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// --- Componente para cada perfil ---
interface PerfilCardProps {
  perfil: PerfilData;
  onPress: () => void;
}

const PerfilCard: React.FC<PerfilCardProps> = ({ perfil, onPress }) => {
  const scale = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 1.1, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.8}
    >
      <Animated.View style={[styles.perfil, { transform: [{ scale }] }]}>
        <View
          style={[
            styles.iconoContainer,
            perfil.activo
              ? { borderColor: '#E50914' }
              : { borderColor: '#555' },
          ]}
        >
          <Ionicons
            name={perfil.icono}
            size={60}
            color={perfil.activo ? '#E50914' : '#aaa'}
          />
        </View>
        <Text style={[styles.nombre, perfil.activo && styles.nombreActivo]}>
          {perfil.nombre}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titulo: {
    color: 'white',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  perfilesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 30,
  },
  perfil: {
    alignItems: 'center',
  },
  iconoContainer: {
    borderWidth: 3,
    borderRadius: 60,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nombre: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
  },
  nombreActivo: {
    color: '#fff',
    fontWeight: 'bold',
  },
  noPerfiles: {
    color: '#aaa',
    fontSize: 18,
    marginTop: 20,
  },
  botonCerrar: {
    marginTop: 50,
    paddingVertical: 12,
    paddingHorizontal: 35,
    backgroundColor: '#E50914',
    borderRadius: 6,
  },
  textoCerrar: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContenido: {
    backgroundColor: '#1a1a1a',
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
    width: 280,
  },
  iconoModalContainer: {
    borderWidth: 3,
    borderRadius: 70,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  nombreModal: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoModal: {
    color: '#ccc',
    fontSize: 16,
    marginBottom: 5,
  },
  botonCerrarModal: {
    marginTop: 15,
    backgroundColor: '#E50914',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 25,
  },
  textoCerrarModal: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

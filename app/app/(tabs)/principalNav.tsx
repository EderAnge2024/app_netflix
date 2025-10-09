// app/(tabs2)/_layout.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Tus componentes existentes
import HomeScreen from '@/components/ui/principales/inicio';
import PeliculasScreen from '@/components/ui/principales/peliculas';
import SeriesSection from '@/components/ui/principales/series';
import NovedadesPopulares from '@/components/ui/principales/novedadesPop';
import SearchScreen from '@/components/ui/otrosNav/buscador';
import NotificacionesScreen from '@/components/ui/otrosNav/notificaciones';
import Perfil from '@/components/ui/otrosNav/perfil';

import { API_KEY, BASE_URL, IMAGE_BASE_URL } from '@/service/apiThemoviedb';
import MiLista from '@/components/ui/principales/miLista';

export default function PrincipalScreen() {
  const [activeTab, setActiveTab] = useState('Inicio');
  const [hasNotifications, setHasNotifications] = useState(false); // 👈 nuevo estado

  // Simulación: obtener si hay notificaciones nuevas
  // En producción, podrías pasar un callback desde NotificacionesScreen que haga setHasNotifications(true)
  React.useEffect(() => {
    // Ejemplo: fetch de API de TMDb para notificaciones
    fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=es-ES&page=1`)
      .then(res => res.json())
      .then(data => {
        // Si hay películas, consideramos que hay "notificaciones"
        setHasNotifications((data.results || []).length > 0);
      })
      .catch(err => console.log(err));
  }, []);

  // Configuración de las pestañas con tus componentes reales
  const textTabs = [
    { 
      id: 'Inicio', 
      label: 'Inicio', 
      component: HomeScreen,
      type: 'text'
    },
    { 
      id: 'Series', 
      label: 'Series', 
      component: SeriesSection,
      type: 'text'
    },
    { 
      id: 'Peliculas', 
      label: 'Películas', 
      component: PeliculasScreen,
      type: 'text'
    },
    { 
      id: 'Novedades', 
      label: 'Novedades populares', 
      component: NovedadesPopulares,
      type: 'text'
    },
    { 
      id: 'MiLista', 
      label: 'Mi lista', 
      component: MiLista,
      type: 'text'
    },
  ];

  const iconTabs = [
    { 
      id: 'Buscar', 
      label: 'Buscar', 
      component: SearchScreen,
      type: 'icon',
      iconName: 'search-outline' // 👈 Nombres de Ionicons
    },
    { 
      id: 'Notificaciones', 
      label: 'Notificaciones', 
      component: NotificacionesScreen,
      type: 'icon',
      iconName: 'notifications-outline'
    },
    { 
      id: 'Perfil', 
      label: 'Perfil', 
      component: Perfil,
      type: 'icon',
      iconName: 'person-outline'
    },
  ];

  const allTabs = [...textTabs, ...iconTabs];
  const ActiveComponent = allTabs.find(tab => tab.id === activeTab)?.component || HomeScreen;

  // Componente para renderizar iconos con Ionicons
  const TabIcon = ({ name, color, size = 24, showBadge = false }) => {
    return (
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name={name} color={color} size={size} />
        {showBadge && (
          <View style={styles.badge} />
        )}
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#141414" />
      
      {/* Header fijo con navegación */}
      <View style={styles.header}>        
        {/* Navegación horizontal */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.navScroll}
          contentContainerStyle={styles.navContentContainer}
        >
          <Text style={styles.netflixLogo}>MaFre </Text>

          {/* Tabs de texto */}
          {textTabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.navItem,
                activeTab === tab.id && styles.navItemActive
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[
                styles.navText,
                activeTab === tab.id && styles.navTextActive
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
          
          {/* Separador visual */}
          <View style={styles.separator} />
          
          {/* Tabs de iconos */}
          {iconTabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.iconNavItem,
                activeTab === tab.id && styles.iconNavItemActive
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <TabIcon 
                name={tab.iconName} 
                color={activeTab === tab.id ? '#E50914' : '#fff'}
                size={24}
                showBadge={tab.id === 'Notificaciones' && hasNotifications} // aquí se notifica
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Contenido dinámico - Solo muestra el componente activo */}
      <View style={styles.contentContainer}>
        <ActiveComponent />
      </View>
    </View>
  );
}

// Los estilos se mantienen igual...
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    backgroundColor: '#141414',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  netflixLogo: {
    color: '#E50914',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  navScroll: {
    flexGrow: 0,
  },
  navContentContainer: {
    paddingRight: 20,
    alignItems: 'center',
  },
  navItem: {
    marginRight: 20,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  navItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#E50914',
  },
  navText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.7,
  },
  navTextActive: {
    opacity: 1,
    fontWeight: 'bold',
  },
  separator: {
    width: 1,
    height: 20,
    backgroundColor: '#404040',
    marginHorizontal: 10,
  },
  iconNavItem: {
    marginRight: 15,
    paddingVertical: 8,
    paddingHorizontal: 8,
    opacity: 0.7,
  },
  iconNavItemActive: {
    opacity: 1,
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
});
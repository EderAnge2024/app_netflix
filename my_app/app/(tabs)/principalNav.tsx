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

// Definir el tipo para las props de TabIcon
interface TabIconProps {
  name: string;
  color: string;
  size?: number;
  showBadge?: boolean;
}

export default function PrincipalScreen() {
  const [activeTab, setActiveTab] = useState('Inicio');
  const [hasNotifications, setHasNotifications] = useState(false);

  React.useEffect(() => {
    fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=es-ES&page=1`)
      .then(res => res.json())
      .then(data => {
        setHasNotifications((data.results || []).length > 0);
      })
      .catch(err => console.log(err));
  }, []);

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
      iconName: 'search-outline'
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

  // Componente TabIcon con typado correcto
  const TabIcon: React.FC<TabIconProps> = ({ name, color, size = 24, showBadge = false }) => {
    return (
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name={name as any} color={color} size={size} />
        {showBadge && (
          <View style={styles.badge} />
        )}
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#141414" />
      
      {/* Header reorganizado */}
      <View style={styles.header}>
        {/* Logo a la izquierda */}
        <Text style={styles.netflixLogo}>MaFre</Text>
        
        {/* Iconos a la derecha */}
        <View style={styles.rightIcons}>
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
                showBadge={tab.id === 'Notificaciones' && hasNotifications}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Navegación horizontal debajo */}
      <View style={styles.horizontalNav}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.navScroll}
          contentContainerStyle={styles.navContentContainer}
        >
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
        </ScrollView>
      </View>

      {/* Contenido dinámico */}
      <View style={styles.contentContainer}>
        <ActiveComponent />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    backgroundColor: '#141414',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 80,
  },
  netflixLogo: {
    color: '#E50914',
    fontSize: 28,
    fontWeight: 'bold',
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  horizontalNav: {
    backgroundColor: '#141414',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  navScroll: {
    flexGrow: 0,
  },
  navContentContainer: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  navItem: {
    marginRight: 20,
    paddingVertical: 12,
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
  iconNavItem: {
    marginLeft: 15,
    paddingVertical: 8,
    paddingHorizontal: 8,
    opacity: 0.7,
  },
  iconNavItemActive: {
    opacity: 1,
  },
  contentContainer: {
    flex: 1,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E50914',
  },
});

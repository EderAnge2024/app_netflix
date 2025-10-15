import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  Pressable,
  Linking,
  Alert,
} from "react-native";
import { API_KEY, BASE_URL, IMAGE_BASE_URL } from "@/service/apiThemoviedb";
import { useMyList, MediaItem } from "@/components/ui/logeadoDatos/MyListContext";

const { width } = Dimensions.get("window");

// 🔹 Extendemos MediaItem para películas y series
interface MovieOrSeries extends MediaItem {
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
}

export default function NovedadesPopulares() {
  // 🔹 Contexto de Mi Lista
  const { addToMyList, removeFromMyList, isInMyList, loading: listLoading } = useMyList();

  const [trending, setTrending] = useState<MovieOrSeries[]>([]);
  const [popularMovies, setPopularMovies] = useState<MovieOrSeries[]>([]);
  const [popularSeries, setPopularSeries] = useState<MovieOrSeries[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal
  const [selectedItem, setSelectedItem] = useState<MovieOrSeries | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trendingRes, moviesRes, seriesRes] = await Promise.all([
          fetch(`${BASE_URL}/trending/all/day?api_key=${API_KEY}&language=es-ES`),
          fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=es-ES&page=1`),
          fetch(`${BASE_URL}/tv/popular?api_key=${API_KEY}&language=es-ES&page=1`),
        ]);

        const trendingData = await trendingRes.json();
        const moviesData = await moviesRes.json();
        const seriesData = await seriesRes.json();

        setTrending(trendingData.results || []);
        setPopularMovies(moviesData.results || []);
        setPopularSeries(seriesData.results || []);
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ✅ Función para manejar Mi Lista
  const handleMyList = async (item: MovieOrSeries): Promise<void> => {
    try {
      if (isInMyList(item.id)) {
        await removeFromMyList(item);
        Alert.alert("✅ Removido", `${item.title || item.name} se eliminó de tu lista.`);
      } else {
        await addToMyList(item);
        Alert.alert("✅ Agregado", `${item.title || item.name} se agregó a tu lista.`);
      }
    } catch (error) {
      console.error("Error al actualizar mi lista:", error);
      Alert.alert("❌ Error", "No se pudo actualizar tu lista.");
    }
  };

  // 🔹 Abrir modal y buscar trailer
  const openModal = async (item: MovieOrSeries) => {
    setSelectedItem(item);
    setModalVisible(true);

    try {
      const type = item.title ? "movie" : "tv";
      const res = await fetch(`${BASE_URL}/${type}/${item.id}/videos?api_key=${API_KEY}&language=es-ES`);
      const data = await res.json();
      const trailer = data.results.find(
        (vid: { type: string; site: string; key: string }) => vid.type === "Trailer" && vid.site === "YouTube"
      );
      setTrailerKey(trailer ? trailer.key : null);
    } catch (err) {
      console.log("Error cargando trailer:", err);
      setTrailerKey(null);
    }
  };

  // 🔹 Cerrar modal
  const closeModal = (): void => {
    setModalVisible(false);
    setSelectedItem(null);
    setTrailerKey(null);
  };

  // 🔹 Render de cada tarjeta
  const renderItem = ({ item }: { item: MovieOrSeries }) => (
    <TouchableOpacity style={styles.card} onPress={() => openModal(item)}>
      {item.poster_path && (
        <Image
          source={{ uri: `${IMAGE_BASE_URL}${item.poster_path}` }}
          style={styles.poster}
        />
      )}
      <Text style={styles.title} numberOfLines={1}>
        {item.title || item.name}
      </Text>
    </TouchableOpacity>
  );

  if (loading || listLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E50914" />
        <Text style={styles.loadingText}>Cargando novedades...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#141414" }}>
      <ScrollView style={styles.container}>
        {/* Portada destacada */}
        {trending.length > 0 && (
          <View style={styles.featuredContainer}>
            {trending[0].backdrop_path && (
              <Image
                source={{ uri: `${IMAGE_BASE_URL}${trending[0].backdrop_path}` }}
                style={styles.featuredImage}
                resizeMode="cover"
              />
            )}
            <View style={styles.overlay}>
              <Text style={styles.featuredTitle}>{trending[0].title || trending[0].name}</Text>
              <Text style={styles.featuredOverview} numberOfLines={3}>{trending[0].overview}</Text>
              <TouchableOpacity style={styles.featuredButton} onPress={() => openModal(trending[0])}>
                <Text style={styles.featuredButtonText}>Ver Más</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Secciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tendencias del Día</Text>
          <FlatList
            data={trending}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.list}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Películas Populares</Text>
          <FlatList
            data={popularMovies}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.list}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Series Populares</Text>
          <FlatList
            data={popularSeries}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.list}
          />
        </View>
      </ScrollView>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={styles.modalBackground}>
          {selectedItem && (
            <View style={styles.modalContainer}>
              {selectedItem.backdrop_path && (
                <Image
                  source={{ uri: `${IMAGE_BASE_URL}${selectedItem.backdrop_path}` }}
                  style={styles.modalImage}
                />
              )}
              <Text style={styles.modalTitle}>{selectedItem.title || selectedItem.name}</Text>
              <Text style={styles.modalInfo}>
                ⭐ {selectedItem.vote_average?.toFixed(1) || "N/A"} | 🗓 {selectedItem.release_date || selectedItem.first_air_date || "Fecha no disponible"}
              </Text>
              <Text style={styles.modalOverview}>{selectedItem.overview || "Sin descripción disponible."}</Text>

              {/* 🔹 Botones de acción */}
              <View style={styles.modalButtonsContainer}>
                {/* Botón Mi Lista */}
                <Pressable
                  style={[
                    styles.myListButton,
                    isInMyList(selectedItem.id) && styles.myListButtonActive
                  ]}
                  onPress={() => handleMyList(selectedItem)}
                >
                  <Text style={styles.myListButtonText}>
                    {isInMyList(selectedItem.id) ? "Eliminar de Mi Lista" : "Agregar a Mi Lista"}
                  </Text>
                </Pressable>

                {/* Botón Ver Tráiler */}
                {trailerKey && (
                  <Pressable
                    style={styles.trailerButton}
                    onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${trailerKey}`)}
                  >
                    <Text style={styles.trailerButtonText}> Ver Tráiler</Text>
                  </Pressable>
                )}
              </View>

              <Pressable style={styles.modalCloseButton} onPress={closeModal}>
                <Text style={styles.modalCloseText}>Cerrar</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#141414", paddingTop: 10 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#141414" },
  loadingText: { color: "#fff", marginTop: 10 },

  section: { marginBottom: 25 },
  sectionTitle: { color: "#fff", fontSize: 20, fontWeight: "700", marginLeft: 15, marginBottom: 10 },
  list: { paddingHorizontal: 10 },

  card: { marginRight: 10, width: 120 },
  poster: { width: 120, height: 180, borderRadius: 10 },
  title: { color: "#fff", marginTop: 5, textAlign: "center", fontSize: 12 },

  featuredContainer: { width: "100%", height: 220, marginBottom: 20, position: "relative" },
  featuredImage: { width: "100%", height: "100%", borderRadius: 10 },
  overlay: { 
    position: "absolute", 
    bottom: 0, 
    left: 0, 
    right: 0, 
    backgroundColor: "rgba(0,0,0,0.5)", 
    padding: 15, 
    borderBottomLeftRadius: 10, 
    borderBottomRightRadius: 10 
  },
  featuredTitle: { color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 5 },
  featuredOverview: { color: "#fff", fontSize: 12, marginBottom: 10 },
  featuredButton: { 
    backgroundColor: "#E50914", 
    paddingVertical: 8, 
    paddingHorizontal: 15, 
    borderRadius: 5, 
    alignSelf: "flex-start" 
  },
  featuredButtonText: { color: "#fff", fontWeight: "bold", fontSize: 14 },

  modalBackground: { 
    flex: 1, 
    backgroundColor: "rgba(0,0,0,0.8)", 
    justifyContent: "center", 
    padding: 20 
  },
  modalContainer: { 
    backgroundColor: "#222", 
    borderRadius: 10, 
    padding: 20, 
    alignItems: "center" 
  },
  modalImage: { 
    width: width - 80, 
    height: 200, 
    borderRadius: 10, 
    marginBottom: 15 
  },
  modalTitle: { 
    color: "#fff", 
    fontSize: 24, 
    fontWeight: "bold", 
    marginBottom: 8, 
    textAlign: "center" 
  },
  modalInfo: { 
    color: "#ccc", 
    fontSize: 14, 
    marginBottom: 10 
  },
  modalOverview: { 
    color: "#ddd", 
    fontSize: 14, 
    lineHeight: 20, 
    textAlign: "center" 
  },

  // 🔹 Nuevos estilos para botones del modal
  modalButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 15,
    marginBottom: 10
  },
  myListButton: {
    flex: 1,
    backgroundColor: "#E50914",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginRight: 10, // separación entre botones (reemplaza 'gap')
  },
  myListButtonActive: {
    backgroundColor: "#2d2d2dff",
  },
  myListButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
  },
  trailerButton: {
    flex: 1,
    backgroundColor: "#E50914",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  trailerButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  modalCloseButton: { 
    marginTop: 10, 
    backgroundColor: "#E50914", 
    paddingVertical: 10, 
    paddingHorizontal: 25, 
    borderRadius: 8 
  },
  modalCloseText: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 16 
  },
});
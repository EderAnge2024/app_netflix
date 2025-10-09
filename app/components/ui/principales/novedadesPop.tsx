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
} from "react-native";

const API_KEY = "fa8d9fb775a751a64726e7a92e2061ff";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

const { width } = Dimensions.get("window");

export default function NovedadesPopulares() {
  const [trending, setTrending] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [popularSeries, setPopularSeries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

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
        console.error("Error al cargar datos de novedades populares:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const openModal = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => openModal(item)}>
      <Image
        source={{ uri: `${IMAGE_BASE_URL}${item.poster_path}` }}
        style={styles.poster}
      />
      <Text style={styles.title} numberOfLines={1}>
        {item.title || item.name}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
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
            <Image
              source={{ uri: `${IMAGE_BASE_URL}${trending[0].backdrop_path || trending[0].poster_path}` }}
              style={styles.featuredImage}
              resizeMode="cover"
            />
            <View style={styles.overlay}>
              <Text style={styles.featuredTitle}>
                {trending[0].title || trending[0].name}
              </Text>
              <Text style={styles.featuredOverview} numberOfLines={3}>
                {trending[0].overview}
              </Text>
              <TouchableOpacity
                style={styles.featuredButton}
                onPress={() => openModal(trending[0])}
              >
                <Text style={styles.featuredButtonText}>Ver Más</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Tendencias */}
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

        {/* Películas Populares */}
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

        {/* Series Populares */}
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

      {/* Modal de información */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          {selectedItem && (
            <View style={styles.modalContainer}>
              <Image
                source={{ uri: `${IMAGE_BASE_URL}${selectedItem.backdrop_path || selectedItem.poster_path}` }}
                style={styles.modalImage}
              />
              <Text style={styles.modalTitle}>{selectedItem.title || selectedItem.name}</Text>
              <Text style={styles.modalInfo}>
                ⭐ {selectedItem.vote_average?.toFixed(1) || "N/A"} | 🗓 {selectedItem.release_date || selectedItem.first_air_date || "Fecha no disponible"}
              </Text>
              <Text style={styles.modalOverview}>{selectedItem.overview || "Sin descripción disponible."}</Text>
              <Pressable
                style={styles.modalCloseButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCloseText}>Cerrar</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

// Estilos
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
  overlay: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.5)", padding: 15, borderBottomLeftRadius: 10, borderBottomRightRadius: 10 },
  featuredTitle: { color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 5 },
  featuredOverview: { color: "#fff", fontSize: 12, marginBottom: 10 },
  featuredButton: { backgroundColor: "#E50914", paddingVertical: 8, paddingHorizontal: 15, borderRadius: 5, alignSelf: "flex-start" },
  featuredButtonText: { color: "#fff", fontWeight: "bold", fontSize: 14 },

  modalBackground: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "center", padding: 20 },
  modalContainer: { backgroundColor: "#222", borderRadius: 10, padding: 20, alignItems: "center" },
  modalImage: { width: width - 80, height: 200, borderRadius: 10, marginBottom: 15 },
  modalTitle: { color: "#fff", fontSize: 24, fontWeight: "bold", marginBottom: 8, textAlign: "center" },
  modalInfo: { color: "#ccc", fontSize: 14, marginBottom: 10 },
  modalOverview: { color: "#ddd", fontSize: 14, lineHeight: 20, textAlign: "center" },
  modalCloseButton: { marginTop: 15, backgroundColor: "#E50914", paddingVertical: 10, paddingHorizontal: 25, borderRadius: 8 },
  modalCloseText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});

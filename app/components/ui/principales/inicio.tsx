// app/(tabs)/inicio.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ScrollView,
  Modal,
  Pressable,
  Dimensions,
} from "react-native";
import { API_KEY, BASE_URL, IMAGE_BASE_URL } from "@/service/apiThemoviedb";
import { useMyList } from "@/components/ui/logeadoDatos/MyListContext";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  // 🔹 My Lista Context
  const { addToMyList, removeFromMyList, isInMyList, loading: listLoading } = useMyList();

  // 🔹 Estados principales
  const [featured, setFeatured] = useState(null);
  const [movies, setMovies] = useState([]);
  const [series, setSeries] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Modal
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // 🔹 Carga inicial de datos
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [moviesRes, seriesRes, trendingRes] = await Promise.all([
          fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=es-ES`),
          fetch(`${BASE_URL}/tv/popular?api_key=${API_KEY}&language=es-ES`),
          fetch(`${BASE_URL}/trending/all/day?api_key=${API_KEY}&language=es-ES`),
        ]);

        const moviesData = await moviesRes.json();
        const seriesData = await seriesRes.json();
        const trendingData = await trendingRes.json();

        setMovies(moviesData.results);
        setSeries(seriesData.results);
        setTrending(trendingData.results);
        setFeatured(trendingData.results[0]);
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 🔹 Abrir modal
  const openModal = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  // 🔹 Render de cada tarjeta
  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => openModal(item)}>
      <Image source={{ uri: `${IMAGE_BASE_URL}${item.poster_path}` }} style={styles.poster} />
    </TouchableOpacity>
  );

  if (loading || listLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#141414" }}>
      <ScrollView style={styles.container}>
        {/* 🎬 Portada destacada */}
        {featured && (
          <View style={styles.banner}>
            <Image source={{ uri: `${IMAGE_BASE_URL}${featured.backdrop_path}` }} style={styles.bannerImage} />
            <View style={styles.bannerOverlay} />
            <View style={styles.bannerTextContainer}>
              <Text style={styles.bannerTitle}>{featured.title || featured.name}</Text>
              <Text style={styles.bannerInfo}>
                ⭐ {featured.vote_average?.toFixed(1) || "N/A"} | 🗓 {featured.release_date || "No disponible"}
              </Text>
              <Text style={styles.bannerDesc} numberOfLines={3}>
                {featured.overview || "Sin descripción disponible."}
              </Text>
            </View>
          </View>
        )}

        {/* 🔥 Secciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Películas populares</Text>
          <FlatList data={movies} renderItem={renderItem} keyExtractor={(item) => item.id.toString()} horizontal showsHorizontalScrollIndicator={false} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Series populares</Text>
          <FlatList data={series} renderItem={renderItem} keyExtractor={(item) => item.id.toString()} horizontal showsHorizontalScrollIndicator={false} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tendencias del día</Text>
          <FlatList data={trending} renderItem={renderItem} keyExtractor={(item) => item.id.toString()} horizontal showsHorizontalScrollIndicator={false} />
        </View>
      </ScrollView>

      {/* 🔹 Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackground}>
          {selectedItem && (
            <View style={styles.modalContainer}>
              <Image source={{ uri: `${IMAGE_BASE_URL}${selectedItem.backdrop_path || selectedItem.poster_path}` }} style={styles.modalImage} />
              <Text style={styles.modalTitle}>{selectedItem.title || selectedItem.name}</Text>
              <Text style={styles.modalInfo}>
                ⭐ {selectedItem.vote_average?.toFixed(1) || "N/A"} | 🗓 {selectedItem.release_date || "No disponible"}
              </Text>
              <Text style={styles.modalOverview}>{selectedItem.overview || "Sin descripción disponible."}</Text>

              {/* 🔹 Botón Mi Lista */}
              <TouchableOpacity
                style={[styles.myListButton, { backgroundColor: isInMyList(selectedItem.id) ? "#444" : "#E50914" }]}
                onPress={() => {
                  if (isInMyList(selectedItem.id)) {
                    removeFromMyList(selectedItem);
                  } else {
                    addToMyList(selectedItem);
                  }
                }}
              >
                <Text style={styles.myListText}>{isInMyList(selectedItem.id) ? "Eliminar de Mi Lista" : "Agregar a Mi Lista"}</Text>
              </TouchableOpacity>

              <Pressable style={styles.modalCloseButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCloseText}>Cerrar</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

// 🎨 Estilos
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#141414" },
  loadingText: { color: "#fff", marginTop: 10, textAlign: "center", fontSize: 18 },

  // Banner
  banner: { height: 500, position: "relative", marginBottom: 25 },
  bannerImage: { width: "100%", height: "100%", position: "absolute" },
  bannerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  bannerTextContainer: { position: "absolute", bottom: 60, left: 20, right: 20 },
  bannerTitle: { color: "#fff", fontSize: 32, fontWeight: "bold", marginBottom: 8 },
  bannerInfo: { color: "#ccc", fontSize: 16, marginBottom: 12 },
  bannerDesc: { color: "#ddd", fontSize: 14, marginBottom: 20, lineHeight: 20 },

  // Secciones
  section: { marginBottom: 25, paddingHorizontal: 15 },
  sectionTitle: { color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 12 },
  card: { marginRight: 12 },
  poster: { width: 120, height: 180, borderRadius: 8 },

  // Modal
  modalBackground: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "center", padding: 20 },
  modalContainer: { backgroundColor: "#222", borderRadius: 10, padding: 20, alignItems: "center" },
  modalImage: { width: width - 80, height: 200, borderRadius: 10, marginBottom: 15 },
  modalTitle: { color: "#fff", fontSize: 24, fontWeight: "bold", marginBottom: 8, textAlign: "center" },
  modalInfo: { color: "#ccc", fontSize: 14, marginBottom: 10 },
  modalOverview: { color: "#ddd", fontSize: 14, lineHeight: 20, textAlign: "center" },
  modalCloseButton: { marginTop: 15, backgroundColor: "#E50914", paddingVertical: 10, paddingHorizontal: 25, borderRadius: 8 },
  modalCloseText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

  // Botón Mi Lista
  myListButton: { paddingVertical: 10, paddingHorizontal: 25, borderRadius: 8, marginTop: 10 },
  myListText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});

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
  Alert,
} from "react-native";
import YoutubePlayer from "react-native-youtube-iframe";
import { API_KEY, BASE_URL, IMAGE_BASE_URL } from "@/service/apiThemoviedb";
import { useMyList, MediaItem } from "@/components/ui/logeadoDatos/MyListContext";

const { width, height } = Dimensions.get("window");

interface MovieOrSeries extends MediaItem {
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
}

export default function NovedadesPopulares() {
  const { addToMyList, removeFromMyList, isInMyList, loading: listLoading } = useMyList();

  const [trending, setTrending] = useState<MovieOrSeries[]>([]);
  const [popularMovies, setPopularMovies] = useState<MovieOrSeries[]>([]);
  const [popularSeries, setPopularSeries] = useState<MovieOrSeries[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal detalle
  const [selectedItem, setSelectedItem] = useState<MovieOrSeries | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  // Modal trailer
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [trailerVisible, setTrailerVisible] = useState<boolean>(false);

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

  const handleMyList = async (item: MovieOrSeries) => {
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

  const closeModal = () => {
    setModalVisible(false);
    setSelectedItem(null);
    setTrailerKey(null);
  };

  const openTrailerModal = () => {
    if (trailerKey) setTrailerVisible(true);
    else Alert.alert("Tráiler no disponible");
  };

  const closeTrailerModal = () => setTrailerVisible(false);

  const renderItem = ({ item }: { item: MovieOrSeries }) => (
    <TouchableOpacity style={styles.card} onPress={() => openModal(item)}>
      {item.poster_path && (
        <Image source={{ uri: `${IMAGE_BASE_URL}${item.poster_path}` }} style={styles.poster} />
      )}
      <Text style={styles.cardTitle} numberOfLines={1}>{item.title || item.name}</Text>
      <Text style={styles.cardSubtitle}>
        ⭐ {item.vote_average?.toFixed(1) || "N/A"} | 🗓 {item.release_date || item.first_air_date || "N/A"}
      </Text>
      {trailerKey && (
        <Pressable style={styles.playButtonCard} onPress={openTrailerModal}>
          <Text style={styles.playButtonCardText}>▶ Reproducir</Text>
        </Pressable>
      )}
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
      <ScrollView style={{ flex: 1 }}>
        {/* Portada destacada */}
        {trending[0] && (
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
              <Text style={{ color: "#ffcc00", marginBottom: 5 }}>
                ⭐ {trending[0].vote_average?.toFixed(1) || "N/A"} | 🗓 {trending[0].release_date || trending[0].first_air_date || "N/A"}
              </Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable style={styles.featuredButton} onPress={() => openModal(trending[0])}>
                  <Text style={styles.featuredButtonText}>Ver Más</Text>
                </Pressable>
                <Pressable style={styles.featuredButtonPlay} onPress={() => openModal(trending[0])}>
                  <Text style={styles.featuredButtonPlayText}>▶ Reproducir</Text>
                </Pressable>
              </View>
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
          />
        </View>
      </ScrollView>

      {/* Modal Detalle */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={styles.modalBackground}>
          {selectedItem && (
            <View style={styles.modalContainer}>
              {selectedItem.backdrop_path && (
                <Image source={{ uri: `${IMAGE_BASE_URL}${selectedItem.backdrop_path}` }} style={styles.modalImage} />
              )}
              <Text style={styles.modalTitle}>{selectedItem.title || selectedItem.name}</Text>
              <Text style={styles.modalInfo}>
                ⭐ {selectedItem.vote_average?.toFixed(1) || "N/A"} | 🗓 {selectedItem.release_date || selectedItem.first_air_date || "N/A"}
              </Text>
              <Text style={styles.modalOverview}>{selectedItem.overview || "Sin descripción disponible."}</Text>

              <View style={styles.modalButtonsContainer}>
                <Pressable
                  style={[styles.myListButton, isInMyList(selectedItem.id) && styles.myListButtonActive]}
                  onPress={() => handleMyList(selectedItem)}
                >
                  <Text style={styles.myListButtonText}>
                    {isInMyList(selectedItem.id) ? "Eliminar de Mi Lista" : "Agregar a Mi Lista"}
                  </Text>
                </Pressable>
                <Pressable style={styles.trailerButton} onPress={openTrailerModal}>
                  <Text style={styles.trailerButtonText}>▶ Reproducir</Text>
                </Pressable>
              </View>

              <Pressable style={styles.modalCloseButton} onPress={closeModal}>
                <Text style={styles.modalCloseText}>Cerrar</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Modal>

      {/* Modal Trailer */}
      <Modal visible={trailerVisible} animationType="slide" transparent onRequestClose={closeTrailerModal}>
        <View style={styles.trailerModalBackground}>
          <View style={styles.trailerContainer}>
            {trailerKey ? (
              <YoutubePlayer height={height * 0.4} width={width - 40} play videoId={trailerKey} />
            ) : (
              <Text style={{ color: "#fff" }}>Cargando tráiler...</Text>
            )}
            <Pressable style={styles.trailerCloseButton} onPress={closeTrailerModal}>
              <Text style={styles.trailerCloseText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 25 },
  sectionTitle: { color: "#fff", fontSize: 20, fontWeight: "700", marginLeft: 15, marginBottom: 10 },

  card: { width: 120, marginRight: 10 },
  poster: { width: 120, height: 180, borderRadius: 10 },
  cardTitle: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  cardSubtitle: { color: "#ffcc00", fontSize: 10 },
  playButtonCard: { marginTop: 5, backgroundColor: "#E50914", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  playButtonCardText: { color: "#fff", fontWeight: "bold", fontSize: 10 },

  featuredContainer: { width: "100%", height: 250, marginBottom: 20 },
  featuredImage: { width: "100%", height: "100%" },
  overlay: { position: "absolute", bottom: 10, left: 15, right: 15 },
  featuredTitle: { color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 5 },
  featuredOverview: { color: "#fff", fontSize: 12, marginBottom: 10 },
  featuredButton: { backgroundColor: "#E50914", padding: 8, borderRadius: 5 },
  featuredButtonText: { color: "#fff", fontWeight: "bold" },
  featuredButtonPlay: { backgroundColor: "#fff", padding: 8, borderRadius: 5 },
  featuredButtonPlayText: { color: "#000", fontWeight: "bold" },

  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#141414" },
  loadingText: { color: "#fff", marginTop: 10 },

  modalBackground: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", padding: 20 },
  modalContainer: { backgroundColor: "#222", borderRadius: 10, padding: 20, alignItems: "center" },
  modalImage: { width: width - 80, height: 200, borderRadius: 10, marginBottom: 15 },
  modalTitle: { color: "#fff", fontSize: 24, fontWeight: "bold", marginBottom: 8, textAlign: "center" },
  modalInfo: { color: "#ccc", fontSize: 14, marginBottom: 10 },
  modalOverview: { color: "#ddd", fontSize: 14, lineHeight: 20, textAlign: "center" },
  modalButtonsContainer: { flexDirection: "row", justifyContent: "space-between", width: "100%", marginTop: 15, gap: 10 },
  myListButton: { flex: 1, backgroundColor: "#E50914", paddingVertical: 12, borderRadius: 8, alignItems: "center" },
  myListButtonActive: { backgroundColor: "#2d2d2dff" },
  myListButtonText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  trailerButton: { flex: 1, backgroundColor: "#E50914", paddingVertical: 12, borderRadius: 8, alignItems: "center" },
  trailerButtonText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  modalCloseButton: { marginTop: 10, backgroundColor: "#E50914", paddingVertical: 10, paddingHorizontal: 25, borderRadius: 8 },
  modalCloseText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

  trailerModalBackground: { flex: 1, backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "center", alignItems: "center" },
  trailerContainer: { width: width - 40, backgroundColor: "#000", borderRadius: 10, overflow: "hidden", alignItems: "center" },
  trailerCloseButton: { marginTop: 10, backgroundColor: "#E50914", paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8 },
  trailerCloseText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});

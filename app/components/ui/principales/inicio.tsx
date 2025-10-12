import React, { useEffect, useState, useCallback } from "react";
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
} from "react-native";

const API_KEY = "fa8d9fb775a751a64726e7a92e2061ff";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

const { width } = Dimensions.get("window");

type MovieOrSeries = {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  backdrop_path?: string;
  overview?: string;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
};

const fetchFromApi = async (endpoint: string) => {
  const res = await fetch(`${BASE_URL}${endpoint}?api_key=${API_KEY}&language=es-ES&page=1`);
  return res.json();
};

const getTrailerKey = async (item: MovieOrSeries) => {
  try {
    const type = item.title ? "movie" : "tv";
    const res = await fetch(`${BASE_URL}/${type}/${item.id}/videos?api_key=${API_KEY}&language=es-ES`);
    const data = await res.json();
    const trailer = data.results?.find(
      (v: { type: string; site: string }) => v.type === "Trailer" && v.site === "YouTube"
    );
    return trailer ? trailer.key : null;
  } catch {
    return null;
  }
};

// 🔹 Componente reutilizable para tarjetas
const CardItem = ({ item, onPress }: { item: MovieOrSeries; onPress: () => void }) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    {item.poster_path ? (
      <Image source={{ uri: `${IMAGE_BASE_URL}${item.poster_path}` }} style={styles.poster} />
    ) : (
      <View style={[styles.poster, styles.noImage]}>
        <Text style={{ color: "#888", textAlign: "center" }}>Sin imagen</Text>
      </View>
    )}
    <Text style={styles.title} numberOfLines={1}>
      {item.title || item.name}
    </Text>
  </TouchableOpacity>
);

export default function NovedadesPopulares() {
  const [trending, setTrending] = useState<MovieOrSeries[]>([]);
  const [popularMovies, setPopularMovies] = useState<MovieOrSeries[]>([]);
  const [popularSeries, setPopularSeries] = useState<MovieOrSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [selectedItem, setSelectedItem] = useState<MovieOrSeries | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [trendingData, moviesData, seriesData] = await Promise.all([
          fetch(`${BASE_URL}/trending/all/day?api_key=${API_KEY}&language=es-ES`).then((r) => r.json()),
          fetchFromApi("/movie/popular"),
          fetchFromApi("/tv/popular"),
        ]);
        setTrending(trendingData.results || []);
        setPopularMovies(moviesData.results || []);
        setPopularSeries(seriesData.results || []);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const openModal = useCallback(async (item: MovieOrSeries) => {
    setSelectedItem(item);
    setModalVisible(true);
    const key = await getTrailerKey(item);
    setTrailerKey(key);
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#E50914" />
        <Text style={styles.loadingText}>Cargando novedades...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: "#fff" }}>Error al cargar datos. Intenta más tarde.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* 🔹 Portada principal */}
        {trending[0] && (
          <TouchableOpacity style={styles.featuredContainer} onPress={() => openModal(trending[0])}>
            <Image
              source={{ uri: `${IMAGE_BASE_URL}${trending[0].backdrop_path}` }}
              style={styles.featuredImage}
            />
            <View style={styles.overlay}>
              <Text style={styles.featuredTitle}>{trending[0].title || trending[0].name}</Text>
              <Text style={styles.featuredOverview} numberOfLines={3}>
                {trending[0].overview}
              </Text>
              <View style={styles.featuredButton}>
                <Text style={styles.featuredButtonText}>Ver Más</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* 🔹 Secciones */}
        {[
          { title: "Tendencias del Día", data: trending },
          { title: "Películas Populares", data: popularMovies },
          { title: "Series Populares", data: popularSeries },
        ].map((section) => (
          <View style={styles.section} key={section.title}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <FlatList
              data={section.data}
              renderItem={({ item }) => <CardItem item={item} onPress={() => openModal(item)} />}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.list}
            />
          </View>
        ))}
      </ScrollView>

      {/* 🔹 Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
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
                ⭐ {selectedItem.vote_average?.toFixed(1) || "N/A"} | 🗓{" "}
                {selectedItem.release_date || selectedItem.first_air_date || "Sin fecha"}
              </Text>
              <Text style={styles.modalOverview}>{selectedItem.overview || "Sin descripción disponible."}</Text>

              {trailerKey && (
                <TouchableOpacity
                  style={[styles.featuredButton, { marginTop: 10 }]}
                  onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${trailerKey}`)}
                >
                  <Text style={styles.featuredButtonText}>Ver Trailer</Text>
                </TouchableOpacity>
              )}

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#141414" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#141414" },
  loadingText: { color: "#fff", marginTop: 10 },

  section: { marginBottom: 25 },
  sectionTitle: { color: "#fff", fontSize: 20, fontWeight: "700", marginLeft: 15, marginBottom: 10 },
  list: { paddingHorizontal: 10 },

  card: { marginRight: 10, width: 120 },
  poster: { width: 120, height: 180, borderRadius: 10 },
  noImage: { backgroundColor: "#222", justifyContent: "center" },
  title: { color: "#fff", marginTop: 5, textAlign: "center", fontSize: 12 },

  featuredContainer: { width: "100%", height: 220, marginBottom: 20 },
  featuredImage: { width: "100%", height: "100%", borderRadius: 10 },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 15,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  featuredTitle: { color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 5 },
  featuredOverview: { color: "#fff", fontSize: 12, marginBottom: 10 },
  featuredButton: {
    backgroundColor: "#E50914",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignSelf: "flex-start",
  },
  featuredButtonText: { color: "#fff", fontWeight: "bold", fontSize: 14 },

  modalBackground: { flex: 1, backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "center", padding: 20 },
  modalContainer: { backgroundColor: "#222", borderRadius: 10, padding: 20, alignItems: "center" },
  modalImage: { width: width - 80, height: 200, borderRadius: 10, marginBottom: 15 },
  modalTitle: { color: "#fff", fontSize: 22, fontWeight: "bold", marginBottom: 8, textAlign: "center" },
  modalInfo: { color: "#ccc", fontSize: 14, marginBottom: 10 },
  modalOverview: { color: "#ddd", fontSize: 14, lineHeight: 20, textAlign: "center" },
  modalCloseButton: { marginTop: 15, backgroundColor: "#E50914", paddingVertical: 10, paddingHorizontal: 25, borderRadius: 8 },
  modalCloseText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});

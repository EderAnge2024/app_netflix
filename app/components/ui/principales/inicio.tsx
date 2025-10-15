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
  ListRenderItem,
  Linking,
  Alert,
} from "react-native";
import { API_KEY, BASE_URL, IMAGE_BASE_URL } from "@/service/apiThemoviedb";
import { useMyList } from "@/components/ui/logeadoDatos/MyListContext";

const { width } = Dimensions.get("window");

interface MediaItem {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string;
  backdrop_path?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
}

interface MyListContextType {
  addToMyList: (item: MediaItem) => void;
  removeFromMyList: (item: MediaItem) => void;
  isInMyList: (id: number) => boolean;
  loading: boolean;
}

export default function HomeScreen(): JSX.Element {
  const { addToMyList, removeFromMyList, isInMyList, loading: listLoading } =
    useMyList() as MyListContextType;

  const [featured, setFeatured] = useState<MediaItem | null>(null);
  const [movies, setMovies] = useState<MediaItem[]>([]);
  const [series, setSeries] = useState<MediaItem[]>([]);
  const [trending, setTrending] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);

  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

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

        setMovies(moviesData.results || []);
        setSeries(seriesData.results || []);
        setTrending(trendingData.results || []);
        setFeatured(trendingData.results?.[0] || null);
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchTrailer = async (item: MediaItem) => {
    try {
      const type = item.title ? "movie" : "tv";
      const res = await fetch(
        `${BASE_URL}/${type}/${item.id}/videos?api_key=${API_KEY}&language=es-ES`
      );
      const data = await res.json();
      const trailer = data.results?.find(
        (vid: any) => vid.type === "Trailer" && vid.site === "YouTube"
      );
      return trailer ? trailer.key : null;
    } catch (err) {
      console.log("Error cargando trailer:", err);
      return null;
    }
  };

  const openModal = async (item: MediaItem) => {
    setSelectedItem(item);
    setModalVisible(true);
    const key = await fetchTrailer(item);
    setTrailerKey(key);
  };

  const playTrailer = async (item: MediaItem) => {
    const key = await fetchTrailer(item);
    if (key) {
      Linking.openURL(`https://www.youtube.com/watch?v=${key}`);
    } else {
      Alert.alert("Tráiler no disponible", "Este título no tiene tráiler disponible.");
    }
  };

  const renderItem: ListRenderItem<MediaItem> = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => openModal(item)}>
      {item.poster_path && (
        <Image
          source={{ uri: `${IMAGE_BASE_URL}${item.poster_path}` }}
          style={styles.poster}
        />
      )}
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
        {/* 🎬 Banner principal */}
        {featured && (
          <View style={styles.banner}>
            {featured.backdrop_path && (
              <Image
                source={{ uri: `${IMAGE_BASE_URL}${featured.backdrop_path}` }}
                style={styles.bannerImage}
              />
            )}
            <View style={styles.bannerOverlay} />
            <View style={styles.bannerTextContainer}>
              <Text style={styles.bannerTitle}>
                {featured.title || featured.name}
              </Text>
              <Text style={styles.bannerInfo}>
                ⭐ {featured.vote_average?.toFixed(1) || "N/A"} | 🗓{" "}
                {featured.release_date ||
                  featured.first_air_date ||
                  "No disponible"}
              </Text>
              <Text style={styles.bannerDesc} numberOfLines={3}>
                {featured.overview || "Sin descripción disponible."}
              </Text>

              {/* 🔹 Botones en banner */}
              <View style={styles.bannerButtonsRow}>
                <TouchableOpacity
                  style={styles.bannerButton}
                  onPress={() => openModal(featured)}
                >
                  <Text style={styles.bannerButtonText}>Ver más</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.bannerButtonPlay}
                  onPress={() => playTrailer(featured)}
                >
                  <Text style={styles.bannerButtonPlayText}>▶ Reproducir</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* 🔥 Secciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Películas populares</Text>
          <FlatList
            data={movies}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Series populares</Text>
          <FlatList
            data={series}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tendencias del día</Text>
          <FlatList
            data={trending}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
          />
        </View>
      </ScrollView>

      {/* 🔹 Modal de información */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          {selectedItem && (
            <View style={styles.modalContainer}>
              {selectedItem.backdrop_path && (
                <Image
                  source={{
                    uri: `${IMAGE_BASE_URL}${
                      selectedItem.backdrop_path || selectedItem.poster_path
                    }`,
                  }}
                  style={styles.modalImage}
                />
              )}
              <Text style={styles.modalTitle}>
                {selectedItem.title || selectedItem.name}
              </Text>
              <Text style={styles.modalInfo}>
                ⭐ {selectedItem.vote_average?.toFixed(1) || "N/A"} | 🗓{" "}
                {selectedItem.release_date ||
                  selectedItem.first_air_date ||
                  "No disponible"}
              </Text>
              <Text style={styles.modalOverview}>
                {selectedItem.overview || "Sin descripción disponible."}
              </Text>

              {/* 🔹 Botón Mi Lista */}
              <TouchableOpacity
                style={[
                  styles.myListButton,
                  {
                    backgroundColor: isInMyList(selectedItem.id)
                      ? "#444"
                      : "#E50914",
                  },
                ]}
                onPress={() => {
                  if (isInMyList(selectedItem.id)) {
                    removeFromMyList(selectedItem);
                  } else {
                    addToMyList(selectedItem);
                  }
                }}
              >
                <Text style={styles.myListText}>
                  {isInMyList(selectedItem.id)
                    ? "Eliminar de Mi Lista"
                    : "Agregar a Mi Lista"}
                </Text>
              </TouchableOpacity>

              {trailerKey && (
                <TouchableOpacity
                  style={styles.trailerButton}
                  onPress={() =>
                    Linking.openURL(
                      `https://www.youtube.com/watch?v=${trailerKey}`
                    )
                  }
                >
                  <Text style={styles.trailerText}>Ver Tráiler</Text>
                </TouchableOpacity>
              )}

              <Pressable
                style={styles.modalCloseButton}
                onPress={() => {
                  setModalVisible(false);
                  setTrailerKey(null);
                }}
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

  bannerButtonsRow: { flexDirection: "row", gap: 10 },
  bannerButton: {
    backgroundColor: "#E50914",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 6,
  },
  bannerButtonPlay: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 6,
  },
  bannerButtonText: { color: "#fff", fontWeight: "bold" },
  bannerButtonPlayText: { color: "#000", fontWeight: "bold" },

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

  myListButton: { paddingVertical: 10, paddingHorizontal: 25, borderRadius: 8, marginTop: 10 },
  myListText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

  trailerButton: { marginTop: 15, backgroundColor: "#E50914", padding: 10, borderRadius: 8 },
  trailerText: { color: "#fff", fontWeight: "bold" },
});

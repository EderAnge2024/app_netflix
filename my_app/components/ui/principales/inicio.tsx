import React, { useEffect, useState, useRef, JSX } from "react";
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
  ActivityIndicator,
} from "react-native";
import { WebView } from "react-native-webview";
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

  const [featuredList, setFeaturedList] = useState<MediaItem[]>([]);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [movies, setMovies] = useState<MediaItem[]>([]);
  const [series, setSeries] = useState<MediaItem[]>([]);
  const [pageMovies, setPageMovies] = useState(1);
  const [pageSeries, setPageSeries] = useState(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [isTrailerLoading, setIsTrailerLoading] = useState(false);

  const bannerRef = useRef<FlatList<MediaItem> | null>(null);

  // Auto-scroll del banner (protección si featuredList está vacío)
  useEffect(() => {
    if (!featuredList || featuredList.length === 0) return;

    const timer = setInterval(() => {
      setFeaturedIndex((prev) => {
        const next = featuredList.length > 0 ? (prev + 1) % featuredList.length : prev;
        try {
          // scrollToIndex puede lanzar si el índice está fuera de rango
          bannerRef.current?.scrollToIndex({ index: next, animated: true } as any);
        } catch (e) {
          // Fallback: calcular offset
          bannerRef.current?.scrollToOffset?.({ offset: next * width, animated: true } as any);
        }
        return next;
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [featuredList]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [moviesRes, seriesRes, trendingRes] = await Promise.all([
          fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=es-ES&page=1`),
          fetch(`${BASE_URL}/tv/popular?api_key=${API_KEY}&language=es-ES&page=1`),
          fetch(`${BASE_URL}/trending/all/day?api_key=${API_KEY}&language=es-ES`),
        ]);

        const moviesData = await moviesRes.json();
        const seriesData = await seriesRes.json();
        const trendingData = await trendingRes.json();

        setMovies(moviesData.results || []);
        setSeries(seriesData.results || []);
        setFeaturedList(trendingData.results?.slice(0, 5) || []);
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const fetchMoreMovies = async () => {
    try {
      const nextPage = pageMovies + 1;
      const res = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=es-ES&page=${nextPage}`);
      const data = await res.json();
      if (Array.isArray(data.results) && data.results.length > 0) {
        setMovies((prev) => [...prev, ...data.results]);
        setPageMovies(nextPage);
      }
    } catch (err) {
      console.error("Error cargando más películas:", err);
    }
  };

  const fetchMoreSeries = async () => {
    try {
      const nextPage = pageSeries + 1;
      const res = await fetch(`${BASE_URL}/tv/popular?api_key=${API_KEY}&language=es-ES&page=${nextPage}`);
      const data = await res.json();
      if (Array.isArray(data.results) && data.results.length > 0) {
        setSeries((prev) => [...prev, ...data.results]);
        setPageSeries(nextPage);
      }
    } catch (err) {
      console.error("Error cargando más series:", err);
    }
  };

  const fetchTrailer = async (item: MediaItem) => {
    try {
      const type = item.title ? "movie" : "tv";
      const res = await fetch(`${BASE_URL}/${type}/${item.id}/videos?api_key=${API_KEY}&language=es-ES`);
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
    setIsTrailerLoading(true);
    const key = await fetchTrailer(item);
    setTrailerKey(key);
    setIsTrailerLoading(false);
  };

  if (loading || listLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E50914" />
        <Text style={styles.loadingText}>Cargando contenido...</Text>
      </View>
    );
  }

  const renderBanner = ({ item }: { item: MediaItem }) => (
    <View style={styles.bannerSlide}>
      {item.backdrop_path && (
        <Image
          source={{ uri: `${IMAGE_BASE_URL}${item.backdrop_path}` }}
          style={styles.bannerImage}
        />
      )}
      <View style={styles.bannerOverlay} />
      <View style={styles.bannerTextContainer}>
        <Text style={styles.bannerTitle}>{item.title || item.name}</Text>
        <Text style={styles.bannerDesc} numberOfLines={3}>
          {item.overview || "Sin descripción disponible."}
        </Text>
        <View style={styles.bannerButtonsRow}>
          <TouchableOpacity style={styles.bannerButton} onPress={() => openModal(item)}>
            <Text style={styles.bannerButtonText}>Ver más</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bannerButtonPlay} onPress={() => openModal(item)}>
            <Text style={styles.bannerButtonPlayText}>▶ Reproducir</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderItem = ({ item }: { item: MediaItem }) => (
    <TouchableOpacity style={styles.card} onPress={() => openModal(item)}>
      {item.poster_path && (
        <Image
          source={{ uri: `${IMAGE_BASE_URL}${item.poster_path}` }}
          style={styles.poster}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#141414" }}>
      <ScrollView style={styles.container}>
        {/* 🔹 Banner tipo carrusel */}
        <FlatList
          ref={bannerRef}
          data={featuredList}
          renderItem={renderBanner}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
        />

        {/* 🔹 Secciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Películas populares</Text>
          <FlatList
            data={movies}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            onEndReached={fetchMoreMovies}
            onEndReachedThreshold={0.5}
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
            onEndReached={fetchMoreSeries}
            onEndReachedThreshold={0.5}
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
              <Text style={styles.modalTitle}>{selectedItem.title || selectedItem.name}</Text>
              {isTrailerLoading ? (
                <ActivityIndicator color="#E50914" style={{ marginVertical: 15 }} />
              ) : trailerKey ? (
                <View style={styles.trailerContainer}>
                  <WebView
                    source={{ uri: `https://www.youtube.com/embed/${trailerKey}` }}
                    allowsFullscreenVideo
                    style={{ flex: 1 }}
                  />
                </View>
              ) : (
                <View style={styles.trailerContainer}>
                  <Image
                    source={{ 
                      uri: `${IMAGE_BASE_URL}${selectedItem.backdrop_path || selectedItem.poster_path}` 
                    }}
                    style={styles.fallbackImage}
                    resizeMode="cover"
                  />
                </View>
              )}

              <Text style={styles.modalOverview}>
                {selectedItem.overview || "Sin descripción disponible."}
              </Text>

              <TouchableOpacity
                style={[
                  styles.myListButton,
                  { backgroundColor: isInMyList(selectedItem.id) ? "#444" : "#E50914" },
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#141414",
  },
  loadingText: { color: "#fff", marginTop: 15, fontSize: 18 },

  // Banner
  bannerSlide: { width, height: 450, position: "relative" },
  bannerImage: { width: "100%", height: "100%", position: "absolute" },
  bannerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  bannerTextContainer: { position: "absolute", bottom: 60, left: 20, right: 20 },
  bannerTitle: { color: "#fff", fontSize: 28, fontWeight: "bold", marginBottom: 10 },
  bannerDesc: { color: "#ddd", fontSize: 14, marginBottom: 15 },
  bannerButtonsRow: { flexDirection: "row" },
  bannerButton: {
    backgroundColor: "#E50914",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 6,
    marginRight: 10,
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
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#222",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  trailerContainer: {
    width: width - 80,
    height: 220,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 15,
  },
  noTrailer: { color: "#ccc", marginBottom: 15 },
  modalOverview: {
    color: "#ddd",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 10,
  },
  modalCloseButton: {
    marginTop: 15,
    backgroundColor: "#E50914",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  modalCloseText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  myListButton: { paddingVertical: 10, paddingHorizontal: 25, borderRadius: 8, marginTop: 10 },
  myListText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  fallbackImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
});

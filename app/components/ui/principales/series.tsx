import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
  Pressable,
  Dimensions,
  Alert,
} from "react-native";
import { WebView } from "react-native-webview";
import { API_KEY, BASE_URL, IMAGE_BASE_URL } from "@/service/apiThemoviedb";
import { useMyList, MediaItem } from "@/components/ui/logeadoDatos/MyListContext";

const { width } = Dimensions.get("window");

interface Genre {
  id: number;
  name: string;
}

interface Video {
  id: string;
  key: string;
  type: string;
  site: string;
}

interface SeriesByGenre {
  [genreName: string]: MediaItem[];
}

const SeriesSection = () => {
  const { myList, addToMyList, removeFromMyList, isInMyList, loading: listLoading } = useMyList();

  // --- State ---
  const [genres, setGenres] = useState<Genre[]>([]);
  const [seriesByGenre, setSeriesByGenre] = useState<SeriesByGenre>({});
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);
  const [featuredSerie, setFeaturedSerie] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(true);

  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [selectedSerie, setSelectedSerie] = useState<MediaItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [trailerVisible, setTrailerVisible] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);

  const trailerUrl = useMemo(() => (trailerKey ? `https://www.youtube.com/embed/${trailerKey}` : null), [trailerKey]);

  // --- API helpers ---
  const fetchGenres = useCallback(async () => {
    const res = await fetch(`${BASE_URL}/genre/tv/list?api_key=${API_KEY}&language=es-ES`);
    const data = await res.json();
    setGenres(data.genres || []);
    return data.genres || [];
  }, []);

  const fetchSeriesByGenre = useCallback(async (genreId: number) => {
    const res = await fetch(`${BASE_URL}/discover/tv?api_key=${API_KEY}&language=es-ES&with_genres=${genreId}`);
    const data = await res.json();
    return data.results || [];
  }, []);

  const fetchTrailer = useCallback(async (serieId: number) => {
    const res = await fetch(`${BASE_URL}/tv/${serieId}/videos?api_key=${API_KEY}&language=es-ES`);
    const data = await res.json();
    const trailer = data.results.find((v: Video) => v.type === "Trailer" && v.site === "YouTube");
    return trailer ? trailer.key : null;
  }, []);

  // --- Handlers ---
  const handleMyList = useCallback(async (serie: MediaItem) => {
    const normalizedSerie: MediaItem = {
      id: serie.id,
      title: serie.name || serie.title || "Sin título",
      name: serie.name,
      poster_path: serie.poster_path || "",
      backdrop_path: serie.backdrop_path || "",
      overview: serie.overview || "Sin descripción disponible",
      vote_average: serie.vote_average || 0,
      release_date: serie.first_air_date || "",
    };

    if (isInMyList(serie.id)) {
      await removeFromMyList(normalizedSerie);
      Alert.alert("✅ Removido", `${normalizedSerie.name} se eliminó de tu lista.`);
    } else {
      await addToMyList(normalizedSerie);
      Alert.alert("✅ Agregado", `${normalizedSerie.name} se agregó a tu lista.`);
    }
  }, [isInMyList, addToMyList, removeFromMyList]);

  const openTrailer = useCallback(async (serieId: number) => {
    const key = await fetchTrailer(serieId);
    if (key) {
      setTrailerKey(key);
      setTrailerVisible(true);
    } else {
      Alert.alert("Tráiler no disponible", "Esta serie no tiene tráiler disponible.");
    }
  }, [fetchTrailer]);

  const openModal = useCallback((serie: MediaItem) => {
    setSelectedSerie(serie);
    setModalVisible(true);
  }, []);

  // --- Load data ---
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const loadedGenres = await fetchGenres();
        if (loadedGenres.length > 0) {
          setSelectedGenre(loadedGenres[0]);

          const results = await Promise.all(
            loadedGenres.map(async (genre) => ({
              name: genre.name,
              series: await fetchSeriesByGenre(genre.id),
            }))
          );

          const map: SeriesByGenre = {};
          results.forEach((r) => (map[r.name] = r.series));
          setSeriesByGenre(map);

          if (map[loadedGenres[0].name]?.length > 0) setFeaturedSerie(map[loadedGenres[0].name][0]);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchGenres, fetchSeriesByGenre]);

  const orderedGenres = useMemo(() => genres.map((g) => g.name), [genres]);

  const renderSerie = useCallback(
    ({ item }: { item: MediaItem }) => (
      <TouchableOpacity style={styles.serieCard} onPress={() => openModal(item)}>
        <Image
          source={{
            uri: item.poster_path
              ? `${IMAGE_BASE_URL}${item.poster_path}`
              : "https://via.placeholder.com/120x180.png?text=Sin+Imagen",
          }}
          style={styles.serieImage}
        />
        <Text style={styles.serieTitle} numberOfLines={1}>{item.name}</Text>
      </TouchableOpacity>
    ),
    [openModal]
  );

  // --- Loading ---
  if (loading || listLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#E50914" />
        <Text style={styles.loaderText}>Cargando series...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setDropdownVisible((v) => !v)}>
          <Text style={styles.headerTitle}>{selectedGenre?.name || "Series"} ▼</Text>
        </TouchableOpacity>
      </View>

      {/* Dropdown */}
      {dropdownVisible && (
        <View style={styles.dropdownMenu}>
          {genres.map((genre) => (
            <TouchableOpacity
              key={genre.id}
              style={styles.dropdownItem}
              onPress={() => {
                setSelectedGenre(genre);
                setDropdownVisible(false);
                setFeaturedSerie(seriesByGenre[genre.name]?.[0] || null);
              }}
            >
              <Text
                style={[
                  styles.dropdownText,
                  selectedGenre?.id === genre.id && styles.dropdownTextActive,
                ]}
              >
                {genre.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView>
        {/* Featured Serie */}
        {featuredSerie && (
          <View style={styles.featuredContainer}>
            <Image
              source={{ uri: `${IMAGE_BASE_URL}${featuredSerie.backdrop_path || featuredSerie.poster_path}` }}
              style={styles.featuredImage}
              resizeMode="cover"
            />
            <View style={styles.featuredInfoContainer}>
              <Text style={styles.featuredTitle}>{featuredSerie.name}</Text>
              <Text style={styles.featuredDetails}>
                ⭐ {featuredSerie.vote_average?.toFixed(1) || "N/A"} | 🗓 {featuredSerie.first_air_date || "Sin fecha"}
              </Text>
              <Text style={styles.featuredOverview} numberOfLines={4}>
                {featuredSerie.overview || "Sin descripción disponible."}
              </Text>

              <View style={styles.featuredButtonsRow}>
                <Pressable style={styles.featuredButton} onPress={() => openModal(featuredSerie)}>
                  <Text style={styles.featuredButtonText}>Ver más</Text>
                </Pressable>
                <Pressable style={styles.featuredButtonPlay} onPress={() => openTrailer(featuredSerie.id)}>
                  <Text style={styles.featuredButtonPlayText}>▶ Reproducir</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* Series por género */}
        {orderedGenres.map((genreName) => (
          <View key={genreName} style={styles.section}>
            <Text style={styles.sectionTitle}>{genreName}</Text>
            <FlatList
              data={seriesByGenre[genreName]}
              renderItem={renderSerie}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
            />
          </View>
        ))}
      </ScrollView>

      {/* Modal Serie */}
      <Modal visible={modalVisible} animationType="fade" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackground}>
          {selectedSerie && (
            <View style={styles.modalContainer}>
              <Image
                source={{ uri: `${IMAGE_BASE_URL}${selectedSerie.backdrop_path || selectedSerie.poster_path}` }}
                style={styles.modalImage}
              />
              <Text style={styles.modalTitle}>{selectedSerie.name}</Text>
              <Text style={styles.modalInfo}>
                ⭐ {selectedSerie.vote_average?.toFixed(1) || "N/A"} | 🗓 {selectedSerie.first_air_date || "Sin fecha"}
              </Text>
              <Text style={styles.modalOverview}>{selectedSerie.overview || "Sin descripción disponible."}</Text>

              <View style={styles.modalButtonsContainer}>
                <Pressable
                  style={[styles.addButton, isInMyList(selectedSerie.id) && styles.addButtonActive]}
                  onPress={() => handleMyList(selectedSerie)}
                >
                  <Text style={styles.addButtonText}>
                    {isInMyList(selectedSerie.id) ? "Eliminar de mi lista" : "Agregar a mi lista"}
                  </Text>
                </Pressable>

                <Pressable style={styles.trailerButton} onPress={() => openTrailer(selectedSerie.id)}>
                  <Text style={styles.trailerButtonText}>▶ Ver tráiler</Text>
                </Pressable>
              </View>

              <Pressable style={styles.modalCloseButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCloseText}>Cerrar</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Modal>

      {/* Modal Tráiler */}
      <Modal visible={trailerVisible} animationType="slide" transparent onRequestClose={() => setTrailerVisible(false)}>
        <View style={styles.trailerModalBackground}>
          <View style={styles.trailerContainer}>
            {trailerUrl ? (
              <WebView source={{ uri: `${trailerUrl}?autoplay=1` }} style={{ flex: 1, borderRadius: 10 }} allowsFullscreenVideo />
            ) : (
              <Text style={{ color: "#fff" }}>Cargando tráiler...</Text>
            )}
            <Pressable style={styles.trailerCloseButton} onPress={() => setTrailerVisible(false)}>
              <Text style={styles.trailerCloseText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#141414" },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loaderText: { color: "#fff", marginTop: 10 },
  header: { backgroundColor: "#141414", padding: 15 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  dropdownMenu: {
    position: "absolute",
    top: 50,
    left: 15,
    backgroundColor: "#1c1c1c",
    borderRadius: 6,
    width: 160,
    zIndex: 30,
  },
  dropdownItem: { paddingVertical: 8, paddingHorizontal: 12 },
  dropdownText: { color: "#ccc", fontSize: 15 },
  dropdownTextActive: { color: "#fff", fontWeight: "bold" },
  featuredContainer: { width: "100%", height: 500, marginBottom: 20 },
  featuredImage: { width: "100%", height: "100%" },
  featuredInfoContainer: { position: "absolute", bottom: 40, left: 25, right: 25 },
  featuredTitle: { color: "#fff", fontSize: 28, fontWeight: "bold" },
  featuredDetails: { color: "#ffcc00", fontSize: 14, marginBottom: 10 },
  featuredOverview: { color: "#fff", fontSize: 15, marginBottom: 15 },
  featuredButtonsRow: { flexDirection: "row", gap: 10 },
  featuredButton: { backgroundColor: "#E50914", padding: 10, borderRadius: 5 },
  featuredButtonText: { color: "#fff", fontWeight: "bold" },
  featuredButtonPlay: { backgroundColor: "#fff", padding: 10, borderRadius: 5 },
  featuredButtonPlayText: { color: "#000", fontWeight: "bold" },
  section: { marginBottom: 30 },
  sectionTitle: { color: "#fff", fontSize: 18, fontWeight: "bold", marginLeft: 15, marginBottom: 10 },
  serieCard: { marginHorizontal: 8, width: 120 },
  serieImage: { width: 120, height: 180, borderRadius: 8 },
  serieTitle: { color: "#fff", fontSize: 12, textAlign: "center", marginTop: 5 },
  modalBackground: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", padding: 20 },
  modalContainer: { backgroundColor: "#222", borderRadius: 10, padding: 20, alignItems: "center" },
  modalImage: { width: width - 80, height: 200, borderRadius: 10, marginBottom: 15 },
  modalTitle: { color: "#fff", fontSize: 24, fontWeight: "bold", marginBottom: 8, textAlign: "center" },
  modalInfo: { color: "#ccc", fontSize: 14, marginBottom: 10 },
  modalOverview: { color: "#ddd", fontSize: 14, textAlign: "center" },
  modalButtonsContainer: { flexDirection: "row", justifyContent: "center", marginTop: 15, gap: 10 },
  addButton: { backgroundColor: "#E50914", padding: 10, borderRadius: 8 },
  addButtonActive: { backgroundColor: "#393939" },
  addButtonText: { color: "#fff", fontWeight: "bold" },
  trailerButton: { backgroundColor: "#E50914", padding: 10, borderRadius: 8 },
  trailerButtonText: { color: "#fff", fontWeight: "bold" },
  modalCloseButton: { marginTop: 15, backgroundColor: "#E50914", padding: 10, borderRadius: 8 },
  modalCloseText: { color: "#fff", fontWeight: "bold" },
  trailerModalBackground: { flex: 1, backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "center", alignItems: "center" },
  trailerContainer: { width: width - 40, height: 250, backgroundColor: "#000", borderRadius: 10, overflow: "hidden" },
  trailerCloseButton: { position: "absolute", top: 10, right: 10, backgroundColor: "#E50914", padding: 6, borderRadius: 6 },
  trailerCloseText: { color: "#fff", fontWeight: "bold" },
});

export default SeriesSection;

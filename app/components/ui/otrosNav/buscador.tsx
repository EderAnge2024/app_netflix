import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  ScrollView,
  Keyboard,
  Modal,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import YoutubePlayer from "react-native-youtube-iframe";
import { API_KEY, BASE_URL, IMAGE_BASE_URL } from "@/service/apiThemoviedb";

interface SearchResult {
  id: number;
  media_type: "movie" | "tv" | "person";
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string;
  profile_path?: string;
  vote_average?: number;
}

interface ApiResponse<T> {
  results: T[];
}

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const [selectedTrailerName, setSelectedTrailerName] = useState<string | null>(null);

  // Función para buscar películas o series
  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(
        `${BASE_URL}/search/multi?api_key=${API_KEY}&language=es-ES&query=${encodeURIComponent(
          text
        )}`
      );
      const data: ApiResponse<SearchResult> = await res.json();
      setSearchResults(data.results || []);
      if (text.length > 0 && !recentSearches.includes(text)) {
        setRecentSearches((prev) => [text, ...prev.slice(0, 4)]);
      }
    } catch (error) {
      console.error("Error en búsqueda:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    Keyboard.dismiss();
  };

  // Función para obtener tráiler desde TMDB
  const obtenerTrailerReal = async (item: SearchResult) => {
    if (!item.id) return null;

    setLoadingVideo(true);
    try {
      const tipo = item.media_type === "movie" ? "movie" : "tv";
      const res = await fetch(
        `${BASE_URL}/${tipo}/${item.id}/videos?api_key=${API_KEY}&language=es-ES`
      );
      const data = await res.json();

      const trailer = data.results.find(
        (v: any) => v.type === "Trailer" && v.site === "YouTube"
      );

      if (trailer) return { key: trailer.key, name: trailer.name };
      return null;
    } catch (error) {
      console.error("Error buscando tráiler:", error);
      return null;
    } finally {
      setLoadingVideo(false);
    }
  };

  // Abrir modal con información y tráiler
  const openModal = async (item: SearchResult) => {
    setSelectedItem(item);
    setShowVideo(false);

    const trailerData = await obtenerTrailerReal(item);

    if (trailerData) {
      setVideoId(trailerData.key);
      setSelectedTrailerName(trailerData.name);
    } else {
      setVideoId(null);
      setSelectedTrailerName(null);
    }

    setModalVisible(true);
  };

  const renderMovieItem = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity style={styles.resultCard} onPress={() => openModal(item)}>
      <Image
        source={{ uri: `${IMAGE_BASE_URL}${item.poster_path}` }}
        style={styles.poster}
      />
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle}>{item.title || item.name}</Text>
        <Text style={styles.resultType}>
          🎬 {item.media_type === "movie" ? "Película" : "Serie"}
        </Text>
        <Text style={styles.resultRating}>
          ⭐ {item.vote_average?.toFixed(1) || "N/A"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderCategory = (title: string, data: SearchResult[]) =>
    data.length > 0 && (
      <View style={styles.categorySection}>
        <Text style={styles.categoryTitle}>
          {title} ({data.length})
        </Text>
        <FlatList
          data={data}
          renderItem={renderMovieItem}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
        />
      </View>
    );

  const movies = searchResults.filter((i) => i.media_type === "movie");
  const series = searchResults.filter((i) => i.media_type === "tv");

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.searchHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#aaa" />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Buscar películas o series..."
            placeholderTextColor="#aaa"
            value={searchQuery}
            onChangeText={handleSearch}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={20} color="#aaa" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Contenido */}
      <ScrollView style={styles.content}>
        {isSearching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#E50914" />
            <Text style={styles.loadingText}>Buscando...</Text>
          </View>
        ) : (
          <>
            {renderCategory("Películas", movies)}
            {renderCategory("Series", series)}
          </>
        )}
      </ScrollView>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setModalVisible(false);
                setShowVideo(false);
              }}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>

            {selectedItem && (
              <>
                <Image
                  source={{ uri: `${IMAGE_BASE_URL}${selectedItem.poster_path}` }}
                  style={styles.modalPoster}
                />
                <Text style={styles.modalTitle}>
                  {selectedItem.title || selectedItem.name}
                </Text>
                <Text style={styles.modalInfo}>
                  ⭐ {selectedItem.vote_average?.toFixed(1) || "N/A"}
                </Text>
                <Text style={styles.modalDescription}>
                  {selectedItem.overview || "Sin descripción disponible."}
                </Text>
              </>
            )}

            {!showVideo ? (
              <TouchableOpacity
                style={styles.trailerButton}
                onPress={() => setShowVideo(true)}
              >
                <Ionicons name="play-circle" size={28} color="#fff" />
                <Text style={styles.trailerText}>Ver tráiler</Text>
              </TouchableOpacity>
            ) : loadingVideo ? (
              <ActivityIndicator size="large" color="#E50914" />
            ) : videoId ? (
              Platform.OS !== "web" ? (
                <YoutubePlayer height={250} play={true} videoId={videoId} />
              ) : (
                <Text style={styles.noTrailer}>
                  🎬 El tráiler no está disponible en versión web.
                </Text>
              )
            ) : (
              <Text style={styles.noTrailer}>
                No se encontró un tráiler para "{selectedItem?.title || selectedItem?.name}" 😕
              </Text>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#141414" },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 15,
    paddingBottom: 15,
    backgroundColor: "#141414",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  backButton: { marginRight: 15 },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, color: "#fff", fontSize: 16, marginHorizontal: 8 },
  content: { flex: 1, paddingHorizontal: 15 },
  categorySection: { marginTop: 20 },
  categoryTitle: { color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  resultCard: { flexDirection: "row", backgroundColor: "#1a1a1a", borderRadius: 8, marginBottom: 10, padding: 12 },
  poster: { width: 80, height: 120, borderRadius: 6 },
  resultInfo: { flex: 1, marginLeft: 12, justifyContent: "center" },
  resultTitle: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  resultType: { color: "#ccc", fontSize: 14 },
  resultRating: { color: "#ffd700", fontSize: 14, marginTop: 4 },
  modalBackground: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)", justifyContent: "center", alignItems: "center" },
  modalContent: { width: "90%", borderRadius: 12, backgroundColor: "#000", padding: 20, alignItems: "center" },
  modalPoster: { width: 200, height: 300, borderRadius: 10, marginBottom: 10 },
  closeButton: { alignSelf: "flex-end" },
  modalTitle: { color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 5 },
  modalInfo: { color: "#ffd700", fontSize: 16, marginBottom: 10 },
  modalDescription: { color: "#ccc", fontSize: 14, textAlign: "center", marginBottom: 15 },
  trailerButton: { flexDirection: "row", alignItems: "center", backgroundColor: "#E50914", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  trailerText: { color: "#fff", fontSize: 16, marginLeft: 8 },
  noTrailer: { color: "#ccc", fontSize: 16, marginTop: 20, textAlign: "center" },
  loadingContainer: { alignItems: "center", paddingVertical: 40 },
  loadingText: { color: "#fff", fontSize: 16 },
});

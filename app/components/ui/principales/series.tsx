import React, { useEffect, useState } from "react";
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
import { useMyList } from "@/context/MyListContext";

const { width } = Dimensions.get("window");

const SeriesScreen = () => {
  const { addToMyList, removeFromMyList, isInMyList } = useMyList();
  const [series, setSeries] = useState([]);
  const [popularSeries, setPopularSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSerie, setSelectedSerie] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState(null);

  // 🔹 Cargar series al inicio
  useEffect(() => {
    const fetchSeries = async () => {
      try {
        const [popularRes, topRatedRes] = await Promise.all([
          fetch(`${BASE_URL}/tv/popular?api_key=${API_KEY}&language=es-ES&page=1`),
          fetch(`${BASE_URL}/tv/top_rated?api_key=${API_KEY}&language=es-ES&page=1`),
        ]);

        const popularData = await popularRes.json();
        const topRatedData = await topRatedRes.json();

        setPopularSeries(popularData.results || []);
        setSeries(topRatedData.results || []);
      } catch (error) {
        console.error("Error al cargar series:", error);
        Alert.alert("Error", "No se pudieron cargar las series.");
      } finally {
        setLoading(false);
      }
    };

    fetchSeries();
  }, []);

  // 🔹 Cargar tráiler de una serie
  const fetchTrailer = async (serieId) => {
    try {
      const res = await fetch(`${BASE_URL}/tv/${serieId}/videos?api_key=${API_KEY}&language=es-ES`);
      const data = await res.json();
      const trailer = data.results.find((v) => v.type === "Trailer" && v.site === "YouTube");
      if (trailer) setTrailerUrl(`https://www.youtube.com/embed/${trailer.key}`);
      else setTrailerUrl(null);
    } catch (error) {
      console.error("Error al cargar tráiler:", error);
      setTrailerUrl(null);
    }
  };

  // 🔹 Mostrar detalles de serie
  const handleShowDetails = async (serie) => {
    setSelectedSerie(serie);
    await fetchTrailer(serie.id);
    setModalVisible(true);
  };

  // 🔹 Agregar o quitar de Mi Lista
  const handleToggleMyList = async (serie) => {
    const item = {
      id: serie.id,
      title: serie.name || serie.title,
      name: serie.name,
      poster_path: serie.poster_path,
      backdrop_path: serie.backdrop_path,
      overview: serie.overview,
      vote_average: serie.vote_average,
      release_date: serie.first_air_date,
    };

    if (isInMyList(serie.id)) {
      await removeFromMyList(item);
      Alert.alert("Eliminado", `${item.title} fue quitado de Mi Lista`);
    } else {
      await addToMyList(item);
      Alert.alert("Agregado", `${item.title} fue agregado a Mi Lista`);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#E50914" />
        <Text style={styles.loaderText}>Cargando series...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* 🔹 Banner principal */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.bannerContainer}
      >
        {popularSeries.slice(0, 5).map((serie) => (
          <TouchableOpacity key={serie.id} onPress={() => handleShowDetails(serie)}>
            <Image
              source={{ uri: `${IMAGE_BASE_URL}${serie.backdrop_path}` }}
              style={styles.bannerImage}
            />
            <View style={styles.bannerOverlay}>
              <Text style={styles.bannerTitle}>{serie.name}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 🔹 Lista de series populares */}
      <Text style={styles.sectionTitle}>Series Populares</Text>
      <FlatList
        horizontal
        data={popularSeries}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleShowDetails(item)}>
            <Image
              source={{ uri: `${IMAGE_BASE_URL}${item.poster_path}` }}
              style={styles.posterImage}
            />
          </TouchableOpacity>
        )}
        showsHorizontalScrollIndicator={false}
      />

      {/* 🔹 Lista de series mejor valoradas */}
      <Text style={styles.sectionTitle}>Mejor Valoradas</Text>
      <FlatList
        horizontal
        data={series}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleShowDetails(item)}>
            <Image
              source={{ uri: `${IMAGE_BASE_URL}${item.poster_path}` }}
              style={styles.posterImage}
            />
          </TouchableOpacity>
        )}
        showsHorizontalScrollIndicator={false}
      />

      {/* 🔹 Modal de detalles */}
      {selectedSerie && (
        <Modal visible={modalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalContainer}>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <Image
                source={{ uri: `${IMAGE_BASE_URL}${selectedSerie.backdrop_path}` }}
                style={styles.modalImage}
              />
              <Text style={styles.modalTitle}>{selectedSerie.name}</Text>
              <Text style={styles.modalOverview}>{selectedSerie.overview}</Text>

              <View style={styles.modalButtons}>
                <Pressable
                  style={styles.myListButton}
                  onPress={() => handleToggleMyList(selectedSerie)}
                >
                  <Text style={styles.buttonText}>
                    {isInMyList(selectedSerie.id)
                      ? "Quitar de Mi Lista"
                      : "Agregar a Mi Lista"}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.buttonText}>Cerrar</Text>
                </Pressable>
              </View>

              {trailerUrl && (
                <View style={styles.trailerContainer}>
                  <WebView
                    source={{ uri: trailerUrl }}
                    style={styles.trailer}
                    allowsFullscreenVideo
                  />
                </View>
              )}
            </ScrollView>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
};

export default SeriesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  bannerContainer: {
    width,
    height: 220,
  },
  bannerImage: {
    width,
    height: 220,
    resizeMode: "cover",
  },
  bannerOverlay: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  bannerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginHorizontal: 10,
    marginTop: 15,
    marginBottom: 5,
  },
  posterImage: {
    width: 130,
    height: 190,
    marginHorizontal: 6,
    borderRadius: 6,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  loaderText: {
    color: "#fff",
    marginTop: 10,
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
  },
  modalContent: {
    padding: 15,
    alignItems: "center",
  },
  modalImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginVertical: 10,
    textAlign: "center",
  },
  modalOverview: {
    color: "#ddd",
    fontSize: 14,
    textAlign: "justify",
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 15,
  },
  myListButton: {
    backgroundColor: "#E50914",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  closeButton: {
    backgroundColor: "#555",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  trailerContainer: {
    width: "100%",
    height: 200,
    marginTop: 10,
  },
  trailer: {
    flex: 1,
  },
});

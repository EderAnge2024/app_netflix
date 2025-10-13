// app/search.tsx
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
  ListRenderItem,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { API_KEY, BASE_URL, IMAGE_BASE_URL } from "@/service/apiThemoviedb";

// 🔹 Definimos los tipos
interface SearchResult {
  id: number;
  media_type: 'movie' | 'tv' | 'person';
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string;
  backdrop_path?: string;
  profile_path?: string;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
}

interface ApiResponse<T> {
  results: T[];
}

interface CategorySectionProps {
  title: string;
  data: SearchResult[];
  renderItem: ListRenderItem<SearchResult>;
}

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);

  // Categorizar resultados
  const movies: SearchResult[] = searchResults.filter(item => item.media_type === 'movie');
  const series: SearchResult[] = searchResults.filter(item => item.media_type === 'tv');
  const people: SearchResult[] = searchResults.filter(item => item.media_type === 'person');

  const handleSearch = async (text: string): Promise<void> => {
    setSearchQuery(text);
    
    if (text.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(
        `${BASE_URL}/search/multi?api_key=${API_KEY}&language=es-ES&query=${encodeURIComponent(text)}`
      );
      const data: ApiResponse<SearchResult> = await res.json();
      setSearchResults(data.results || []);
      
      // Guardar búsqueda reciente
      if (text.length > 0 && !recentSearches.includes(text)) {
        setRecentSearches(prev => [text, ...prev.slice(0, 4)]);
      }
    } catch (error) {
      console.error("Error en búsqueda:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = (): void => {
    setSearchQuery("");
    setSearchResults([]);
    Keyboard.dismiss();
  };

  const goToDetails = (item: SearchResult): void => {
    if (item.media_type === 'person') {
      // Navegar a pantalla de persona
      router.push({
        pathname: "/person",
        params: { id: item.id.toString() }
      });
    } else {
      router.push({
        pathname: "/details",
        params: {
          id: item.id.toString(),
          title: item.title || item.name,
          overview: item.overview,
          image: item.backdrop_path,
          media_type: item.media_type,
        },
      });
    }
  };

  const renderMovieItem: ListRenderItem<SearchResult> = ({ item }) => (
    <TouchableOpacity style={styles.resultCard} onPress={() => goToDetails(item)}>
      <Image
        source={{ uri: `${IMAGE_BASE_URL}${item.poster_path}` }}
        style={styles.poster}
      />
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle}>{item.title || item.name}</Text>
        <Text style={styles.resultType}>🎬 {item.media_type === 'movie' ? 'Película' : 'Serie'}</Text>
        <Text style={styles.resultRating}>⭐ {item.vote_average?.toFixed(1) || 'N/A'}</Text>
        <Text style={styles.resultOverview} numberOfLines={2}>
          {item.overview}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderPersonItem: ListRenderItem<SearchResult> = ({ item }) => (
    <TouchableOpacity style={styles.personCard} onPress={() => goToDetails(item)}>
      <Image
        source={{ uri: `${IMAGE_BASE_URL}${item.profile_path}` }}
        style={styles.personImage}
      />
      <View style={styles.personInfo}>
        <Text style={styles.personName}>{item.name}</Text>
        <Text style={styles.personKnownFor}>Actor/Actriz</Text>
      </View>
    </TouchableOpacity>
  );

  const renderCategory = ({ title, data, renderItem }: CategorySectionProps): JSX.Element | null => {
    if (!data || data.length === 0) return null;
    
    return (
      <View style={styles.categorySection}>
        <Text style={styles.categoryTitle}>{title} ({data.length})</Text>
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item: SearchResult) => item.id.toString()}
          scrollEnabled={false}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: false,
        }}
      />
      
      {/* Header de búsqueda */}
      <View style={styles.searchHeader}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#aaa" />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Buscar películas, series, personas..."
            placeholderTextColor="#aaa"
            value={searchQuery}
            onChangeText={handleSearch}
            autoFocus={true}
            returnKeyType="search"
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
        {searchQuery.length === 0 ? (
          /* Estado inicial - Búsquedas recientes/sugerencias */
          <View style={styles.initialState}>
            <Text style={styles.sectionTitle}>Búsquedas recientes</Text>
            {recentSearches.map((search: string, index: number) => (
              <TouchableOpacity 
                key={index}
                style={styles.recentSearchItem}
                onPress={() => {
                  setSearchQuery(search);
                  handleSearch(search);
                }}
              >
                <Ionicons name="time-outline" size={20} color="#aaa" />
                <Text style={styles.recentSearchText}>{search}</Text>
              </TouchableOpacity>
            ))}
            
            {recentSearches.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={60} color="#444" />
                <Text style={styles.emptyStateText}>
                  Busca películas, series y más...
                </Text>
              </View>
            )}
          </View>
        ) : isSearching ? (
          /* Cargando */
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Buscando...</Text>
          </View>
        ) : searchResults.length > 0 ? (
          /* Resultados categorizados */
          <View style={styles.resultsContainer}>
            {renderCategory({ title: "Películas", data: movies, renderItem: renderMovieItem })}
            {renderCategory({ title: "Series", data: series, renderItem: renderMovieItem })}
            {renderCategory({ title: "Personas", data: people, renderItem: renderPersonItem })}
          </View>
        ) : (
          /* Sin resultados */
          <View style={styles.noResults}>
            <Ionicons name="search-outline" size={60} color="#444" />
            <Text style={styles.noResultsTitle}>No se encontraron resultados</Text>
            <Text style={styles.noResultsText}>
              Prueba con otras palabras o busca películas, series o personas.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#141414",
  },
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
  backButton: {
    marginRight: 15,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    marginLeft: 8,
    marginRight: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 15,
  },
  initialState: {
    paddingTop: 20,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  recentSearchItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  recentSearchText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 10,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    color: "#888",
    fontSize: 16,
    marginTop: 10,
    textAlign: "center",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
  },
  resultsContainer: {
    paddingTop: 20,
  },
  categorySection: {
    marginBottom: 25,
  },
  categoryTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  resultCard: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    marginBottom: 10,
    padding: 12,
  },
  poster: {
    width: 80,
    height: 120,
    borderRadius: 6,
  },
  resultInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  resultTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  resultType: {
    color: "#ccc",
    fontSize: 14,
    marginBottom: 2,
  },
  resultRating: {
    color: "#ffd700",
    fontSize: 14,
    marginBottom: 6,
  },
  resultOverview: {
    color: "#999",
    fontSize: 12,
    lineHeight: 16,
  },
  personCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    marginBottom: 10,
    padding: 12,
  },
  personImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  personInfo: {
    flex: 1,
    marginLeft: 12,
  },
  personName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  personKnownFor: {
    color: "#ccc",
    fontSize: 14,
  },
  noResults: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  noResultsTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 8,
  },
  noResultsText: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
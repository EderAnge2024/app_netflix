// components/ui/principales/MiLista.tsx
import React from "react";
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useMyList } from "@/components/ui/logeadoDatos/MyListContext";

export default function MiLista() {
  const { myList, removeFromMyList, loading } = useMyList();

  // 🔹 Spinner mientras se carga la lista
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Mi Lista</Text>
        <Text style={styles.message}>Cargando tu lista...</Text>
      </View>
    );
  }

  // 🔹 Render de cada item
  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Image source={{ uri: `https://image.tmdb.org/t/p/w500${item.poster_path}` }} style={styles.poster} />
      <View style={styles.info}>
        <Text style={styles.title}>{item.title || item.name}</Text>
        <TouchableOpacity onPress={() => removeFromMyList(item)}>
          <Text style={styles.remove}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Mi Lista</Text>
      {myList.length === 0 ? (
        <Text style={styles.message}>No tienes videos en tu lista.</Text>
      ) : (
        <FlatList
          data={myList}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

// 🎨 Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#141414",
    paddingHorizontal: 15,
    paddingTop: 50,
  },
  header: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  message: {
    color: "#ccc",
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
  item: {
    flexDirection: "row",
    marginBottom: 15,
    alignItems: "center",
    gap: 15,
    backgroundColor: "#1c1c1c",
    borderRadius: 10,
    padding: 10,
  },
  poster: {
    width: 80,
    height: 120,
    borderRadius: 8,
  },
  info: {
    flex: 1,
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  remove: {
    color: "#E50914",
    fontSize: 14,
    fontWeight: "bold",
  },
});

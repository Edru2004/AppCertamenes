import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const categorias = ['AMBIENTAL', 'ELECTRO', 'SISTEMAS', 'TURISMO', 'IA'];

  return (
    <View style={styles.container}>
      {/* Tarjeta de Total */}
      <View style={styles.cardTotal}>
        <Text style={styles.cardTitle}>Categorías registradas</Text>
        <Text style={styles.cardNumber}>11</Text>
      </View>

      {/* Sección Explorar Categorías */}
      <Text style={styles.sectionTitle}>Explorara categorias</Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsContainer}>
        {categorias.map((cat, index) => (
          <TouchableOpacity 
            key={index} 
            style={[styles.tag, index === 1 && styles.activeTag]}
          >
            <Text style={[styles.tagText, index === 1 && styles.activeTagText]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Barra de navegación inferior */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomTab}>
          <Ionicons name="star" size={20} color="#555" />
          <Text style={styles.tabText}>Categorías</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomTab}>
          <Ionicons name="star" size={20} color="#555" />
          <Text style={styles.tabText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomTab}>
          <Ionicons name="star" size={20} color="#555" />
          <Text style={styles.tabText}>Label</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 20,
  },
  cardTotal: {
    backgroundColor: '#9eb23b',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    color: '#000',
    fontWeight: '600',
  },
  cardNumber: {
    fontSize: 52,
    fontWeight: 'bold',
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 15,
  },
  tagsContainer: {
    paddingLeft: 20,
  },
  tag: {
    backgroundColor: '#eaf4ff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
    height: 36,
  },
  activeTag: {
    backgroundColor: '#007bff',
  },
  tagText: {
    color: '#007bff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  activeTagText: {
    color: '#fff',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 65,
    backgroundColor: '#f3ebfc',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  bottomTab: {
    alignItems: 'center',
  },
  tabText: {
    fontSize: 12,
    color: '#4a4a4a',
    marginTop: 2,
  },
});
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { DrawerContentScrollView } from 'expo-router/drawer';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CustomDrawer(props: any) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 20 }}>

        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => props.navigation.closeDrawer()}
        >
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>

        {/* Tarjeta de Perfil */}
        <View style={styles.profileCard}>
          <Image
            source={{ uri: 'https://via.placeholder.com/100' }}
            style={styles.avatar}
          />
          <View style={styles.nameBadge}>
            <Text style={styles.profileName}>Alison Cecilia Alonso Meneses</Text>
            <Text style={styles.profileRole}>Administrador</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.badge}>
              <Ionicons name="star" size={12} color="#005b96" />
              <Text style={styles.badgeText}>5</Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="chatbubble-outline" size={12} color="#005b96" />
              <Text style={styles.badgeText}>40</Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="time-outline" size={12} color="#005b96" />
              <Text style={styles.badgeText}>Mon-Sat / 9:00AM - 5:00PM</Text>
            </View>
          </View>
        </View>

        {/* Opciones del Menú */}
        <View style={styles.menuItemsContainer}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              props.navigation.closeDrawer();
              router.push('/');
            }}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="home-outline" size={22} color="#002b49" />
            </View>
            <Text style={styles.menuText}>Inicio (Dashboard)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              props.navigation.closeDrawer();
              router.push('/registroEvento' as any);
            }}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="trophy-outline" size={22} color="#002b49" />
            </View>
            <Text style={styles.menuText}>Certamenes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              props.navigation.closeDrawer();
              router.push('/categorias' as any);
            }}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="folder-open-outline" size={22} color="#002b49" />
            </View>
            <Text style={styles.menuText}>Categorías</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              props.navigation.closeDrawer();
              router.push('/desafios' as any);
            }}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="bulb-outline" size={22} color="#002b49" />
            </View>
            <Text style={styles.menuText}>Desafíos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.iconCircle}>
              <Ionicons name="easel-outline" size={22} color="#002b49" />
            </View>
            <Text style={styles.menuText}>Registro de Salas</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.iconCircle}>
              <Ionicons name="document-text-outline" size={22} color="#002b49" />
            </View>
            <Text style={styles.menuText}>Generación de constancias</Text>
          </TouchableOpacity>


          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              props.navigation.closeDrawer();
              router.push('/gesJurados' as any);
            }}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="people-outline" size={22} color="#002b49" />
            </View>
            <Text style={styles.menuText}>Jurado</Text>
          </TouchableOpacity>

        </View>

      </DrawerContentScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#002b45',
    paddingHorizontal: 15,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    padding: 10,
  },
  profileCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginBottom: 25,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  nameBadge: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 15,
    alignItems: 'center',
    width: '100%',
  },
  profileName: {
    color: '#809900',
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
  },
  profileRole: {
    color: '#666',
    fontSize: 11,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 5,
  },
  badge: {
    backgroundColor: '#fff',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 3,
  },
  badgeText: {
    fontSize: 10,
    color: '#005b96',
    fontWeight: 'bold',
  },
  menuItemsContainer: {
    gap: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  iconCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
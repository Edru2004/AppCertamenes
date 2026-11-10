import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function JuradoPerfil() {
  const router = useRouter();

  return (
    <View style={styles.page}>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >

        {/* HEADER */}

        <View style={styles.header}>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={25}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <Text style={styles.title}>
            Mi perfil
          </Text>

        </View>

        {/* PERFIL */}

        <View style={styles.profileCard}>

          <View style={styles.avatar}>
            <Ionicons
              name="person-outline"
              size={45}
              color="#FFFFFF"
            />
          </View>

          <Text style={styles.name}>
            Jurado
          </Text>

          <Text style={styles.role}>
            Jurado evaluador
          </Text>

        </View>

        {/* INFORMACIÓN */}

        <View style={styles.infoCard}>

          <View style={styles.infoRow}>
            <Ionicons
              name="person-outline"
              size={23}
              color="#0B4F6C"
            />

            <View>
              <Text style={styles.label}>
                Nombre
              </Text>

              <Text style={styles.value}>
                Jurado
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons
              name="shield-checkmark-outline"
              size={23}
              color="#0B4F6C"
            />

            <View>
              <Text style={styles.label}>
                Rol
              </Text>

              <Text style={styles.value}>
                Jurado
              </Text>
            </View>
          </View>

        </View>

      </ScrollView>

      {/* NAV */}

      <View style={styles.bottomNav}>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() =>
            router.replace('/(jurado)')
          }
        >
          <Ionicons
            name="home-outline"
            size={24}
            color="#64748B"
          />

          <Text style={styles.navText}>
            Inicio
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() =>
            router.push('/(jurado)/equipos')
          }
        >
          <Ionicons
            name="people-outline"
            size={24}
            color="#64748B"
          />

          <Text style={styles.navText}>
            Equipos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
        >
          <Ionicons
            name="person"
            size={24}
            color="#0B4F6C"
          />

          <Text style={styles.navTextActive}>
            Perfil
          </Text>
        </TouchableOpacity>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({

  page: {
    flex: 1,
    backgroundColor: '#F4F7FA',
  },

  container: {
    padding: 20,
    paddingBottom: 110,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },

  backButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#063B52',
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    color: '#063B52',
    fontSize: 27,
    fontWeight: '900',
    marginLeft: 14,
  },

  profileCard: {
    backgroundColor: '#063B52',
    borderRadius: 25,
    padding: 30,
    alignItems: 'center',
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#0879AD',
    alignItems: 'center',
    justifyContent: 'center',
  },

  name: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '900',
    marginTop: 15,
  },

  role: {
    color: '#B8D6E3',
    fontSize: 15,
    marginTop: 3,
  },

  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#DDE5EC',
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    paddingVertical: 10,
  },

  label: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
  },

  value: {
    color: '#172033',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 2,
  },

  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },

  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 78,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },

  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 75,
  },

  navText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },

  navTextActive: {
    color: '#0B4F6C',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 3,
  },

});
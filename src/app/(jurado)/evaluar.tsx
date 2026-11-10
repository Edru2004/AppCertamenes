// @ts-nocheck

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function EvaluarEquipo() {
  const router = useRouter();

  const params = useLocalSearchParams();

  const nombreEquipo =
    String(params?.nombreEquipo || 'Equipo');

  const idEquipo =
    String(params?.idEquipo || '');

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

          <View style={styles.headerText}>

            <Text style={styles.kicker}>
              EVALUACIÓN
            </Text>

            <Text style={styles.title}>
              {nombreEquipo}
            </Text>

          </View>

        </View>

        {/* EQUIPO */}

        <View style={styles.teamCard}>

          <View style={styles.teamIcon}>
            <Ionicons
              name="people"
              size={32}
              color="#FFFFFF"
            />
          </View>

          <View style={styles.teamInfo}>

            <Text style={styles.teamLabel}>
              EQUIPO A EVALUAR
            </Text>

            <Text style={styles.teamName}>
              {nombreEquipo}
            </Text>

            {idEquipo ? (
              <Text style={styles.teamId}>
                ID del equipo: {idEquipo}
              </Text>
            ) : null}

          </View>

        </View>

        {/* TÍTULO */}

        <Text style={styles.sectionTitle}>
          Rúbrica de evaluación
        </Text>

        <Text style={styles.description}>
          Selecciona la calificación correspondiente
          para cada criterio de evaluación.
        </Text>

        {/* CRITERIO 1 */}

        <View style={styles.criterionCard}>

          <Text style={styles.criterionNumber}>
            CRITERIO 1
          </Text>

          <Text style={styles.criterionTitle}>
            Propuesta e innovación
          </Text>

          <Text style={styles.criterionDescription}>
            Evalúa la calidad, creatividad y grado de
            innovación de la propuesta presentada.
          </Text>

          <View style={styles.scoreRow}>

            {[1, 2, 3, 4, 5].map((valor) => (
              <TouchableOpacity
                key={valor}
                style={styles.scoreButton}
              >
                <Text style={styles.scoreText}>
                  {valor}
                </Text>
              </TouchableOpacity>
            ))}

          </View>

        </View>

        {/* CRITERIO 2 */}

        <View style={styles.criterionCard}>

          <Text style={styles.criterionNumber}>
            CRITERIO 2
          </Text>

          <Text style={styles.criterionTitle}>
            Impacto de la solución
          </Text>

          <Text style={styles.criterionDescription}>
            Evalúa el impacto potencial de la solución
            propuesta frente al problema planteado.
          </Text>

          <View style={styles.scoreRow}>

            {[1, 2, 3, 4, 5].map((valor) => (
              <TouchableOpacity
                key={valor}
                style={styles.scoreButton}
              >
                <Text style={styles.scoreText}>
                  {valor}
                </Text>
              </TouchableOpacity>
            ))}

          </View>

        </View>

        {/* CRITERIO 3 */}

        <View style={styles.criterionCard}>

          <Text style={styles.criterionNumber}>
            CRITERIO 3
          </Text>

          <Text style={styles.criterionTitle}>
            Viabilidad
          </Text>

          <Text style={styles.criterionDescription}>
            Evalúa la posibilidad de implementar la
            solución propuesta.
          </Text>

          <View style={styles.scoreRow}>

            {[1, 2, 3, 4, 5].map((valor) => (
              <TouchableOpacity
                key={valor}
                style={styles.scoreButton}
              >
                <Text style={styles.scoreText}>
                  {valor}
                </Text>
              </TouchableOpacity>
            ))}

          </View>

        </View>

        {/* COMENTARIOS */}

        <View style={styles.commentsCard}>

          <Text style={styles.commentsTitle}>
            Comentarios del jurado
          </Text>

          <View style={styles.commentsBox}>

            <Text style={styles.commentsPlaceholder}>
              Escribe aquí tus observaciones...
            </Text>

          </View>

        </View>

        {/* GUARDAR */}

        <TouchableOpacity
          style={styles.saveButton}
          activeOpacity={0.85}
        >

          <Ionicons
            name="checkmark-circle-outline"
            size={24}
            color="#FFFFFF"
          />

          <Text style={styles.saveText}>
            Guardar evaluación
          </Text>

        </TouchableOpacity>

      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({

  page: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },

  container: {
    padding: 18,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  backButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#063B52',
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerText: {
    flex: 1,
    marginLeft: 13,
  },

  kicker: {
    color: '#0B719D',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  title: {
    color: '#063B52',
    fontSize: 23,
    fontWeight: '900',
    marginTop: 2,
  },

  teamCard: {
    backgroundColor: '#063B52',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },

  teamIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#0879AD',
    justifyContent: 'center',
    alignItems: 'center',
  },

  teamInfo: {
    flex: 1,
    marginLeft: 14,
  },

  teamLabel: {
    color: '#B8D6E3',
    fontSize: 10,
    fontWeight: '900',
  },

  teamName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 3,
  },

  teamId: {
    color: '#B8D6E3',
    fontSize: 11,
    marginTop: 4,
  },

  sectionTitle: {
    color: '#063B52',
    fontSize: 21,
    fontWeight: '900',
  },

  description: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
    marginBottom: 15,
  },

  criterionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DBE3EE',
    padding: 17,
    marginBottom: 14,
  },

  criterionNumber: {
    color: '#0879AD',
    fontSize: 10,
    fontWeight: '900',
  },

  criterionTitle: {
    color: '#172033',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 5,
  },

  criterionDescription: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },

  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },

  scoreButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    justifyContent: 'center',
    alignItems: 'center',
  },

  scoreText: {
    color: '#063B52',
    fontSize: 17,
    fontWeight: '900',
  },

  commentsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DBE3EE',
    padding: 17,
    marginBottom: 15,
  },

  commentsTitle: {
    color: '#172033',
    fontSize: 16,
    fontWeight: '900',
  },

  commentsBox: {
    height: 120,
    borderRadius: 13,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 12,
    padding: 13,
  },

  commentsPlaceholder: {
    color: '#94A3B8',
    fontSize: 12,
  },

  saveButton: {
    minHeight: 56,
    borderRadius: 15,
    backgroundColor: '#063B52',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 3,
  },

  saveText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    marginLeft: 9,
  },

});
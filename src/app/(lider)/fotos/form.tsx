// @ts-nocheck
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { subirFotosEquipo } from '../../../services/api';

const primerValor = (v: any) => (Array.isArray(v) ? v[0] : v);

export default function FotosFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ idEquipo?: string; nombreEquipo?: string }>();
  const idEquipo = Number(primerValor(params.idEquipo));
  const nombreEquipo = String(primerValor(params.nombreEquipo) || 'Equipo');

  const [imagenes, setImagenes] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [subiendo, setSubiendo] = useState(false);
  const [modalInfo, setModalInfo] = useState({
    visible: false,
    titulo: '',
    mensaje: '',
    exito: false,
  });

  const mostrarModal = (titulo: string, mensaje: string, exito = false) =>
    setModalInfo({ visible: true, titulo, mensaje, exito });

  const seleccionarDeGaleria = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      mostrarModal('Permiso requerido', 'Activa el acceso a tu galería para seleccionar fotos.', false);
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!res.canceled && res.assets?.length) {
      setImagenes((prev) => [...prev, ...res.assets]);
    }
  };

  const tomarFoto = async () => {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) {
      mostrarModal('Permiso requerido', 'Activa el permiso de cámara para tomar una foto.', false);
      return;
    }

    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!res.canceled && res.assets?.length) {
      setImagenes((prev) => [...prev, ...res.assets]);
    }
  };

  const quitarImagen = (idx: number) => {
    setImagenes((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubir = async () => {
    if (subiendo) return;
    if (!idEquipo || Number.isNaN(idEquipo)) {
      mostrarModal('Error', 'No se identificó el equipo seleccionado.', false);
      return;
    }
    if (imagenes.length === 0) {
      mostrarModal('Sin fotos', 'Selecciona o toma al menos una fotografía antes de subir.', false);
      return;
    }

    setSubiendo(true);
    try {
      const formData = new FormData();
      formData.append('Id_equipo', String(idEquipo));

      for (let i = 0; i < imagenes.length; i++) {
        const asset = imagenes[i];
        const ext = (asset.uri.split('.').pop() || 'jpg').toLowerCase();
        const mime = asset.mimeType || (ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg');
        const nombreArchivo = asset.fileName || `evidencia_${Date.now()}_${i}.${ext}`;

        if (Platform.OS === 'web') {
          const respBlob = await fetch(asset.uri);
          const blob = await respBlob.blob();
          formData.append('fotos[]', blob, nombreArchivo);
        } else {
          formData.append('fotos[]', {
            uri: asset.uri,
            name: nombreArchivo,
            type: mime,
          } as any);
        }
      }

      await subirFotosEquipo(formData);
      mostrarModal(
        '¡Fotos subidas!',
        `Se guardaron ${imagenes.length} evidencia(s) para ${nombreEquipo}.`,
        true
      );
    } catch (error: any) {
      mostrarModal(
        'No se pudieron subir',
        error?.message || 'Verifica tu conexión o que cada imagen pese menos de 5 MB.',
        false
      );
    } finally {
      setSubiendo(false);
    }
  };

  const cerrarModal = () => {
    const exito = modalInfo.exito;
    setModalInfo({ visible: false, titulo: '', mensaje: '', exito: false });
    if (exito) router.back();
  };

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="cloud-upload-outline" size={28} color="#fff" />
          </View>
          <Text style={styles.title}>Subir evidencias</Text>
          <Text style={styles.subtitle}>Equipo: {nombreEquipo}</Text>
        </View>

        <View style={styles.botonesPickerRow}>
          <TouchableOpacity style={styles.pickerBtn} onPress={seleccionarDeGaleria} disabled={subiendo}>
            <Ionicons name="images-outline" size={22} color="#0369a1" />
            <Text style={styles.pickerBtnText}>Galería</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.pickerBtn} onPress={tomarFoto} disabled={subiendo}>
            <Ionicons name="camera-outline" size={22} color="#0369a1" />
            <Text style={styles.pickerBtnText}>Cámara</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>
          Fotos seleccionadas <Text style={styles.count}>{imagenes.length}</Text>
        </Text>

        {imagenes.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="image-outline" size={34} color="#94a3b8" />
            <Text style={styles.emptyTitle}>Ninguna imagen seleccionada</Text>
            <Text style={styles.emptyText}>
              Usa los botones de arriba para elegir fotos de tu galería o tomarlas con la cámara (máx. 5 MB por foto).
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {imagenes.map((img, idx) => (
              <View key={`${img.uri}-${idx}`} style={styles.previewCard}>
                <Image source={{ uri: img.uri }} style={styles.previewImg} resizeMode="cover" />
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => quitarImagen(idx)}
                  disabled={subiendo}
                >
                  <Ionicons name="close-circle" size={24} color="#dc2626" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footerActions}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()} disabled={subiendo}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitBtn, (subiendo || imagenes.length === 0) && { opacity: 0.6 }]}
            onPress={() => void handleSubir()}
            disabled={subiendo || imagenes.length === 0}
          >
            {subiendo ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.submitText}>Subir fotos</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={modalInfo.visible} transparent animationType="fade" onRequestClose={cerrarModal}>
        <View style={styles.backdrop}>
          <View style={styles.modalCard}>
            <View style={[styles.modalIcon, modalInfo.exito ? styles.successIcon : styles.errorIcon]}>
              <Ionicons
                name={modalInfo.exito ? 'checkmark-circle-outline' : 'alert-circle-outline'}
                size={30}
                color={modalInfo.exito ? '#15803d' : '#b91c1c'}
              />
            </View>
            <Text style={styles.modalTitle}>{modalInfo.titulo}</Text>
            <Text style={styles.modalMessage}>{modalInfo.mensaje}</Text>
            <TouchableOpacity style={styles.confirmButton} onPress={cerrarModal}>
              <Text style={styles.confirmText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f1f5f9' },
  container: { padding: 16, paddingBottom: 40 },
  header: { alignItems: 'center', marginTop: 10, marginBottom: 18 },
  headerIcon: { width: 56, height: 56, borderRadius: 17, backgroundColor: '#002b45', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: '#002b45', marginTop: 9 },
  subtitle: { fontSize: 13, fontWeight: '700', color: '#0369a1', marginTop: 4 },
  botonesPickerRow: { flexDirection: 'row', gap: 12 },
  pickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#bae6fd',
    borderRadius: 12,
    paddingVertical: 14,
  },
  pickerBtnText: { fontSize: 14, fontWeight: '800', color: '#002b45' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#002b45', marginTop: 20, marginBottom: 10 },
  count: { fontSize: 13, color: '#0369a1' },
  emptyCard: { alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 24 },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: '#334155', marginTop: 8 },
  emptyText: { fontSize: 12, color: '#64748b', textAlign: 'center', marginTop: 4, lineHeight: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  previewCard: {
    width: '48%',
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
    position: 'relative',
  },
  previewImg: { width: '100%', height: '100%' },
  removeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  footerActions: { flexDirection: 'row', gap: 10, marginTop: 24 },
  cancelBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { color: '#334155', fontWeight: '700' },
  submitBtn: {
    flex: 2,
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: '#86a327',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.48)', justifyContent: 'center', padding: 18 },
  modalCard: { backgroundColor: '#fff', padding: 18, borderRadius: 15 },
  modalIcon: { alignSelf: 'center', width: 50, height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 9 },
  successIcon: { backgroundColor: '#dcfce7' },
  errorIcon: { backgroundColor: '#fee2e2' },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a', textAlign: 'center', marginBottom: 7 },
  modalMessage: { fontSize: 13, lineHeight: 19, color: '#475569', textAlign: 'center', marginBottom: 14 },
  confirmButton: { padding: 12, borderRadius: 9, backgroundColor: '#002b45', alignItems: 'center' },
  confirmText: { color: '#fff', fontWeight: '800' },
});
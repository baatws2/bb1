import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { withBase } from '@/lib/webPath';
import * as ImagePicker from 'expo-image-picker';
import type { CameraType } from 'expo-camera';
import { Camera, Image as ImageIcon, Calendar } from 'lucide-react-native';

export default function AddProductScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    current_quantity: '',
    unit: 'رفوف',
    category: '',
    barcode: '',
    location: '',
  });

  const [dateData, setDateData] = useState({
    day: '',
    month: '',
    year: '',
  });

  // Date picker modal state
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const today = new Date();
  const [tempDay, setTempDay] = useState<string>((today.getDate()).toString());
  const [tempMonth, setTempMonth] = useState<string>((today.getMonth() + 1).toString());
  const [tempYear, setTempYear] = useState<string>(today.getFullYear().toString());

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const applyPickedDate = () => {
    // Normalize and apply selected numbers to form state
    const d = Math.max(1, Math.min(31, parseInt(tempDay || '0')));
    const m = Math.max(1, Math.min(12, parseInt(tempMonth || '0')));
    const y = Math.max(2024, Math.min(2100, parseInt(tempYear || '0')));
    setDateData({ day: d.toString(), month: m.toString(), year: y.toString() });
    setDateModalVisible(false);
  };

  const pickImage = async (useCamera: boolean) => {
    try {
      let result;

      if (useCamera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('تنبيه', 'نحتاج إلى إذن الوصول للكاميرا');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('تنبيه', 'نحتاج إلى إذن الوصول للمعرض');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'حدث خطأ أثناء اختيار الصورة');
    }
  };

  const uploadImage = async (uri: string): Promise<string | null> => {
    try {
      setUploading(true);
      const response = await fetch(uri);
      const blob = await response.blob();
      const ext = uri.split('.').pop();
      const fileName = `${Date.now()}.${ext}`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (err: any) {
      console.error('Upload error:', err);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('اسم المنتج مطلوب');
      return;
    }

    if (!imageUri) {
      setError('الصورة مطلوبة');
      return;
    }

    if (!dateData.day || !dateData.month || !dateData.year) {
      setError('تاريخ الانتهاء مطلوب (اليوم والشهر والسنة)');
      return;
    }

    const day = parseInt(dateData.day);
    const month = parseInt(dateData.month);
    const year = parseInt(dateData.year);

    if (day < 1 || day > 31) {
      setError('اليوم يجب أن يكون بين 1 و 31');
      return;
    }

    if (month < 1 || month > 12) {
      setError('الشهر يجب أن يكون بين 1 و 12');
      return;
    }

    if (year < 2024 || year > 2100) {
      setError('السنة غير صحيحة');
      return;
    }

    const expiryDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

    setLoading(true);
    setError('');

    try {
      const imageUrl = await uploadImage(imageUri);

      if (!imageUrl) {
        throw new Error('فشل تحميل الصورة');
      }

      const { error } = await supabase.from('products').insert([
        {
          name: formData.name.trim(),
          description: formData.description.trim(),
          current_quantity: formData.current_quantity ? parseInt(formData.current_quantity) : null,
          minimum_quantity: 0,
          unit: formData.unit,
          category: formData.category.trim(),
          barcode: formData.barcode.trim(),
          image_url: imageUrl,
          expiry_date: expiryDate,
          location: formData.location.trim() || null,
          created_by: user?.id,
        },
      ]);

      if (error) throw error;

      Alert.alert('نجح', 'تم إضافة المنتج بنجاح', [
        {
          text: 'حسناً',
          onPress: () => {
            setFormData({
              name: '',
              description: '',
              current_quantity: '',
              unit: 'رفوف',
              category: '',
              barcode: '',
              location: '',
            });
            setDateData({
              day: '',
              month: '',
              year: '',
            });
            setImageUri(null);
            router.push('/(tabs)' as any);
          },
        },
      ]);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إضافة المنتج');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>إضافة منتج جديد</Text>
        <Text style={styles.headerSubtitle}>سوبر ماركت المهندس</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.formGroup}>
          <Text style={styles.label}>اسم المنتج *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(value) => updateField('name', value)}
            placeholder="أدخل اسم المنتج"
            textAlign="right"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>صورة المنتج *</Text>
          {imageUri ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.changeImageButton}
                onPress={() => setImageUri(null)}
              >
                <Text style={styles.changeImageText}>تغيير الصورة</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imagePickerContainer}>
              <TouchableOpacity
                style={styles.imagePickerButton}
                onPress={() => pickImage(false)}
              >
                <ImageIcon size={32} color="#007AFF" />
                <Text style={styles.imagePickerText}>اختر من الاستديو</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.imagePickerButton}
                onPress={() => pickImage(true)}
              >
                <Camera size={32} color="#007AFF" />
                <Text style={styles.imagePickerText}>التقط صورة</Text>
              </TouchableOpacity>
            </View>
          )}
          {uploading && (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.uploadingText}>جاري تحميل الصورة...</Text>
            </View>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>تاريخ الانتهاء *</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setDateModalVisible(true)}
            activeOpacity={0.8}
          >
            <Calendar size={20} color="#007AFF" />
            <Text style={styles.dateButtonText}>
              {dateData.day && dateData.month && dateData.year
                ? `${dateData.day.padStart(2, '0')} / ${dateData.month.padStart(2, '0')} / ${dateData.year}`
                : 'اختر التاريخ بالأرقام'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.helperText}>\u0627\u062e\u062a\u0631 \u0627\u0644\u0623\u0631\u0642\u0627\u0645 \u0645\u0628\u0627\u0631\u0632\u0629 (\u064a\u0648\u0645 / \u0634\u0647\u0631 / \u0633\u0646\u0629)</Text>
        </View>

        {/* Date numbers-only modal */}
        <Modal visible={dateModalVisible} transparent animationType="fade" onRequestClose={() => setDateModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>اختر التاريخ</Text>
              <View style={styles.modalColumns}>
                <View style={styles.modalColumn}>
                  <Text style={styles.modalLabel}>اليوم</Text>
                  <ScrollView style={styles.modalList}>
                    {Array.from({ length: 31 }, (_, i) => (i + 1).toString()).map((n) => (
                      <TouchableOpacity key={`d-${n}`} style={[styles.modalItem, tempDay === n && styles.modalItemActive]} onPress={() => setTempDay(n)}>
                        <Text style={[styles.modalItemText, tempDay === n && styles.modalItemTextActive]}>{n}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <View style={styles.modalColumn}>
                  <Text style={styles.modalLabel}>الشهر</Text>
                  <ScrollView style={styles.modalList}>
                    {Array.from({ length: 12 }, (_, i) => (i + 1).toString()).map((n) => (
                      <TouchableOpacity key={`m-${n}`} style={[styles.modalItem, tempMonth === n && styles.modalItemActive]} onPress={() => setTempMonth(n)}>
                        <Text style={[styles.modalItemText, tempMonth === n && styles.modalItemTextActive]}>{n}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <View style={[styles.modalColumn, { flex: 1.2 }]}>
                  <Text style={styles.modalLabel}>السنة</Text>
                  <ScrollView style={styles.modalList}>
                    {Array.from({ length: 2100 - 2024 + 1 }, (_, i) => (2024 + i).toString()).map((n) => (
                      <TouchableOpacity key={`y-${n}`} style={[styles.modalItem, tempYear === n && styles.modalItemActive]} onPress={() => setTempYear(n)}>
                        <Text style={[styles.modalItemText, tempYear === n && styles.modalItemTextActive]}>{n}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setDateModalVisible(false)}>
                  <Text style={styles.modalCancelText}>إلغاء</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSave} onPress={applyPickedDate}>
                  <Text style={styles.modalSaveText}>تم</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <View style={styles.formGroup}>
          <Text style={styles.label}>الوحدة / القسم *</Text>
          <View style={styles.unitContainer}>
            {['رفوف', 'ثلاجات', 'مستودع', 'شبس'].map((unit) => (
              <TouchableOpacity
                key={unit}
                style={[
                  styles.unitButton,
                  formData.unit === unit && styles.unitButtonActive,
                ]}
                onPress={() => updateField('unit', unit)}
              >
                <Text
                  style={[
                    styles.unitButtonText,
                    formData.unit === unit && styles.unitButtonTextActive,
                  ]}
                >
                  {unit}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>الوصف</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(value) => updateField('description', value)}
            placeholder="أدخل وصف المنتج"
            multiline
            numberOfLines={3}
            textAlign="right"
          />
        </View>

        <View style={styles.row}>
          <View style={styles.formGroupHalf}>
            <Text style={styles.label}>الكمية (اختياري)</Text>
            <TextInput
              style={styles.input}
              value={formData.current_quantity}
              onChangeText={(value) => updateField('current_quantity', value)}
              placeholder="0"
              keyboardType="numeric"
              textAlign="right"
            />
          </View>

          <View style={styles.formGroupHalf}>
            <Text style={styles.label}>الموقع (اختياري)</Text>
            <TextInput
              style={styles.input}
              value={formData.location}
              onChangeText={(value) => updateField('location', value)}
              placeholder="أدخل الموقع"
              textAlign="right"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>الفئة</Text>
          <TextInput
            style={styles.input}
            value={formData.category}
            onChangeText={(value) => updateField('category', value)}
            placeholder="مثال: مواد غذائية، مشروبات، إلخ"
            textAlign="right"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>الباركود</Text>
          <TextInput
            style={styles.input}
            value={formData.barcode}
            onChangeText={(value) => updateField('barcode', value)}
            placeholder="أدخل الباركود (اختياري)"
            textAlign="right"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, (loading || uploading) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading || uploading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'جاري الإضافة...' : uploading ? 'جاري التحميل...' : 'إضافة المنتج'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'right',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  formGroup: {
    marginBottom: 20,
  },
  formGroupHalf: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1A1A1A',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  imagePickerContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  imagePickerButton: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderStyle: 'dashed',
  },
  imagePickerText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  imagePreviewContainer: {
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  changeImageButton: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  changeImageText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  uploadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  dateInputGroup: {
    flex: 1,
    alignItems: 'center',
  },
  dateInputLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '600',
  },
  dateInput: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    width: '100%',
  },
  dateSeparator: {
    fontSize: 24,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 20,
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'right',
  },
  // Date button styles
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  unitContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  unitButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  unitButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  unitButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  unitButtonTextActive: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
  },
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'right',
  },
  modalColumns: {
    flexDirection: 'row',
    gap: 8,
  },
  modalColumn: {
    flex: 1,
  },
  modalLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'right',
    fontWeight: '600',
  },
  modalList: {
    maxHeight: 220,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalItemActive: {
    backgroundColor: '#EFF6FF',
  },
  modalItemText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#1F2937',
  },
  modalItemTextActive: {
    color: '#007AFF',
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  modalCancel: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  modalCancelText: {
    color: '#1F2937',
    fontWeight: '600',
  },
  modalSave: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalSaveText: {
    color: '#fff',
    fontWeight: '800',
  },
});

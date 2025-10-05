import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { supabase, Product } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { router, useLocalSearchParams } from 'expo-router';
import { withBase } from '@/lib/webPath';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Calendar, Save, Trash2, Image as ImageIcon, Camera } from 'lucide-react-native';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const productId = Array.isArray(id) ? id[0] : (id as string);
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    current_quantity: '',
    unit: 'رفوف',
    category: '',
    barcode: '',
    location: '',
  });

  const [dateData, setDateData] = useState({ day: '', month: '', year: '' });
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        Alert.alert('خطأ', 'المنتج غير موجود');
        router.back();
        return;
      }

      setProduct(data);
      setFormData({
        name: data.name,
        description: data.description || '',
        current_quantity: data.current_quantity?.toString() || '',
        unit: data.unit,
        category: data.category || '',
        barcode: data.barcode || '',
        location: data.location || '',
      });

      const date = new Date(data.expiry_date);
      setDateData({
        day: date.getDate().toString(),
        month: (date.getMonth() + 1).toString(),
        year: date.getFullYear().toString(),
      });
      setImageUri(data.image_url);
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر جلب المنتج');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const updateDateField = (field: 'day' | 'month' | 'year', value: string) => {
    const numValue = value.replace(/[^0-9]/g, '');
    if (field === 'day' && numValue && (parseInt(numValue) < 1 || parseInt(numValue) > 31)) return;
    if (field === 'month' && numValue && (parseInt(numValue) < 1 || parseInt(numValue) > 12)) return;
    if (field === 'year' && numValue.length > 4) return;
    setDateData((prev) => ({ ...prev, [field]: numValue }));
    setError('');
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

      const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (err) {
      console.error('Upload error:', err);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return setError('اسم المنتج مطلوب');
    if (!imageUri) return setError('الصورة مطلوبة');
    if (!dateData.day || !dateData.month || !dateData.year) return setError('تاريخ الانتهاء مطلوب');

    const day = parseInt(dateData.day);
    const month = parseInt(dateData.month);
    const year = parseInt(dateData.year);
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 2024 || year > 2100) {
      return setError('التاريخ غير صحيح');
    }
    const expiryDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

    setSaving(true);
    setError('');
    try {
      let imageUrl = imageUri;
      if (imageUri !== product?.image_url) {
        const uploaded = await uploadImage(imageUri);
        if (!uploaded) throw new Error('فشل تحميل الصورة');
        imageUrl = uploaded;
      }
      const { error } = await supabase
        .from('products')
        .update({
          name: formData.name.trim(),
          description: formData.description.trim(),
          current_quantity: formData.current_quantity ? parseInt(formData.current_quantity) : null,
          unit: formData.unit,
          category: formData.category.trim(),
          barcode: formData.barcode.trim(),
          image_url: imageUrl,
          expiry_date: expiryDate,
          location: formData.location.trim() || null,
        })
        .eq('id', productId);
      if (error) throw error;
      Alert.alert('نجاح', 'تم الحفظ بنجاح');
      setIsEditing(false);
      fetchProduct();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;
      // إزالة الصورة إن وجدت (اختياري)
      if (product?.image_url) {
        try {
          const u = new URL(product.image_url);
          const marker = '/object/public/product-images/';
          const idx = u.pathname.indexOf(marker);
          if (idx >= 0) {
            const path = u.pathname.slice(idx + marker.length);
            if (path) await supabase.storage.from('product-images').remove([path]);
          }
        } catch {}
      }
  router.replace(withBase('/(tabs)') as any);
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر الحذف');
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  const getDaysRemaining = (expiryDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  const isExpired = (expiryDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    return expiry < today;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }
  if (!product) return null;

  const daysRemaining = getDaysRemaining(product.expiry_date);
  const expired = isExpired(product.expiry_date);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>تفاصيل المنتج</Text>
            <Text style={styles.headerSubtitle}>سوبر ماركت المهندس</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          {!isEditing ? (
            <>
              <TouchableOpacity style={styles.actionButton} onPress={() => setIsEditing(true)}>
                <Text style={styles.actionButtonText}>تعديل</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => setConfirmOpen(true)}>
                <Trash2 size={18} color="#DC2626" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.actionButton} onPress={() => setIsEditing(false)}>
                <Text style={styles.actionButtonText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.saveButton]} onPress={handleSave} disabled={saving || uploading}>
                <Save size={18} color="#fff" />
                <Text style={styles.saveButtonText}>{saving ? 'جاري الحفظ...' : 'حفظ'}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* الحالة */}
        <View style={[styles.statusBadgeRow, expired ? styles.statusExpired : styles.statusGood]}>
          <Calendar size={20} color={expired ? '#7C3AED' : '#10B981'} />
          <Text style={[styles.statusTextBig, { color: expired ? '#7C3AED' : '#10B981' }]}>
            {expired ? 'منتهي' : `باقي ${daysRemaining} يوم`}
          </Text>
        </View>

        {/* الصورة */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>الصورة</Text>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} />
          ) : (
            <View style={[styles.image, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6' }]}>
              <ImageIcon size={32} color="#9CA3AF" />
            </View>
          )}
          {isEditing && (
            <View style={styles.imageActions}>
              <TouchableOpacity style={styles.pickBtn} onPress={() => pickImage(false)}>
                <ImageIcon size={18} color="#007AFF" />
                <Text style={styles.pickBtnText}>من المعرض</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pickBtn} onPress={() => pickImage(true)}>
                <Camera size={18} color="#007AFF" />
                <Text style={styles.pickBtnText}>التقاط صورة</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* الحقول */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>البيانات</Text>
          <View style={styles.fieldRow}>
            <Text style={styles.label}>اسم المنتج</Text>
            <TextInput style={styles.input} editable={isEditing} value={formData.name} onChangeText={(v) => updateField('name', v)} textAlign="right" />
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.label}>الوصف</Text>
            <TextInput style={[styles.input, { minHeight: 80 }]} editable={isEditing} value={formData.description} onChangeText={(v) => updateField('description', v)} textAlign="right" multiline />
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.label}>الكمية</Text>
            <TextInput style={styles.input} editable={isEditing} value={formData.current_quantity} onChangeText={(v) => updateField('current_quantity', v)} keyboardType="numeric" textAlign="right" />
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.label}>الوحدة</Text>
            <TextInput style={styles.input} editable={isEditing} value={formData.unit} onChangeText={(v) => updateField('unit', v)} textAlign="right" />
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.label}>الفئة</Text>
            <TextInput style={styles.input} editable={isEditing} value={formData.category} onChangeText={(v) => updateField('category', v)} textAlign="right" />
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.label}>الباركود</Text>
            <TextInput style={styles.input} editable={isEditing} value={formData.barcode} onChangeText={(v) => updateField('barcode', v)} textAlign="right" />
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.label}>الموقع</Text>
            <TextInput style={styles.input} editable={isEditing} value={formData.location} onChangeText={(v) => updateField('location', v)} textAlign="right" />
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.label}>تاريخ الانتهاء</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TextInput style={[styles.input, { width: 64 }]} editable={isEditing} value={dateData.day} onChangeText={(v) => updateDateField('day', v)} placeholder="يوم" keyboardType="number-pad" textAlign="center" />
              <TextInput style={[styles.input, { width: 64 }]} editable={isEditing} value={dateData.month} onChangeText={(v) => updateDateField('month', v)} placeholder="شهر" keyboardType="number-pad" textAlign="center" />
              <TextInput style={[styles.input, { width: 96 }]} editable={isEditing} value={dateData.year} onChangeText={(v) => updateDateField('year', v)} placeholder="سنة" keyboardType="number-pad" textAlign="center" />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* تأكيد الحذف */}
      {confirmOpen && (
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>حذف المنتج؟</Text>
            <Text style={styles.confirmText}>سيتم حذف المنتج نهائيًا.</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity onPress={() => setConfirmOpen(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn} disabled={deleting}>
                <Text style={styles.deleteText}>{deleting ? 'جاري الحذف...' : 'حذف'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingTop: 48, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, backgroundColor: '#F9FAFB' },
  headerTitles: { flex: 1, marginLeft: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  headerSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionButton: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff' },
  deleteButton: { borderColor: '#FEE2E2', backgroundColor: '#FEF2F2' },
  actionButtonText: { color: '#1F2937', fontSize: 14, fontWeight: '600' },
  saveButton: { backgroundColor: '#2563EB', borderColor: '#2563EB', flexDirection: 'row', alignItems: 'center', gap: 8 },
  saveButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  statusBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, marginBottom: 12 },
  statusGood: { backgroundColor: '#ECFDF5', borderColor: '#D1FAE5', borderWidth: 1 },
  statusExpired: { backgroundColor: '#F5F3FF', borderColor: '#EDE9FE', borderWidth: 1 },
  statusTextBig: { fontSize: 16, fontWeight: '700' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 8 },
  image: { width: '100%', height: 200, borderRadius: 12 },
  imageActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  pickBtn: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#DBEAFE', flexDirection: 'row', alignItems: 'center', gap: 6 },
  pickBtnText: { color: '#1F2937', fontWeight: '600' },
  fieldRow: { marginBottom: 12 },
  label: { fontSize: 12, color: '#6B7280', marginBottom: 6, textAlign: 'right' },
  input: { backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, fontSize: 14, color: '#1A1A1A' },
  errorText: { color: '#DC2626', fontSize: 14, marginBottom: 12, textAlign: 'center', backgroundColor: '#FEE2E2', padding: 10, borderRadius: 8 },
  confirmOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  confirmCard: { width: '90%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  confirmTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8, textAlign: 'right' },
  confirmText: { fontSize: 14, color: '#4B5563', marginBottom: 12, textAlign: 'right' },
  confirmActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  cancelBtn: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, backgroundColor: '#F3F4F6' },
  cancelText: { color: '#1F2937', fontWeight: '600' },
  deleteBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: '#DC2626' },
  deleteText: { color: '#fff', fontWeight: '800' },
});

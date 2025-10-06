import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Mail, User as UserIcon } from 'lucide-react-native';
import { router } from 'expo-router';
import { withBase } from '@/lib/webPath';
import { useState } from 'react';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = () => {
    // افتح نافذة التأكيد داخل التطبيق (تعمل على الويب والجوال)
    setConfirmOpen(true);
  };

  const confirmSignOut = async () => {
    try {
      setSigningOut(true);
  await signOut();
  setConfirmOpen(false);
  router.replace(withBase('/login') as any);
    } catch (error: any) {
      setSigningOut(false);
      Alert.alert('خطأ', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>الحساب</Text>
        <Text style={styles.headerSubtitle}>سوبر ماركت المهندس</Text>
      </View>

      <View style={styles.content}>
        {!isSupabaseConfigured && (
          <View style={[styles.infoCard, { borderColor: '#FCD34D', backgroundColor: '#FEF3C7' }]}> 
            <Text style={[styles.infoText, { color: '#92400E', textAlign: 'center' }]}>يعمل حالياً بوضع العرض التجريبي. لإعداد Supabase بسرعة، افتح رابط الموقع وأضف:
              {'\n'}?supabaseUrl=YOUR_URL&supabaseAnonKey=YOUR_KEY
            </Text>
          </View>
        )}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <UserIcon size={48} color="#007AFF" />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Text style={styles.userLabel}>البريد الإلكتروني</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>معلومات التطبيق</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              نظام تتبع التواريخ - سوبر ماركت المهندس
            </Text>
            <Text style={[styles.infoText, { marginTop: 12 }]}>
              يساعدك هذا التطبيق على تتبع تواريخ انتهاء صلاحية المنتجات في السوبر ماركت. يمكنك إضافة منتجات جديدة مع صورها وتواريخ انتهائها، والحصول على تنبيهات للمنتجات المنتهية أو القاربة على الانتهاء.
            </Text>
          </View>
        </View>

  <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <LogOut size={20} color="#DC2626" />
          <Text style={styles.signOutText}>تسجيل الخروج</Text>
        </TouchableOpacity>

        {/* نافذة تأكيد تسجيل الخروج */}
        <Modal transparent visible={confirmOpen} animationType="fade" onRequestClose={() => setConfirmOpen(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>تسجيل الخروج</Text>
              <Text style={styles.modalMessage}>هل أنت متأكد من تسجيل الخروج؟</Text>
              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalBtn, styles.modalCancel]} onPress={() => setConfirmOpen(false)} disabled={signingOut}>
                  <Text style={styles.modalCancelText}>إلغاء</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, styles.modalConfirm]} onPress={confirmSignOut} disabled={signingOut}>
                  <Text style={styles.modalConfirmText}>{signingOut ? 'جاري الخروج...' : 'تسجيل الخروج'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </View>
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
  content: {
    flex: 1,
    padding: 20,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  userInfo: {
    flex: 1,
  },
  userEmail: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'right',
    marginBottom: 4,
  },
  userLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'right',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'right',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
    textAlign: 'right',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    gap: 8,
    marginTop: 'auto',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '90%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  modalCancel: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  modalConfirm: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#111827',
  },
  modalConfirmText: {
    fontSize: 16,
    color: '#DC2626',
    fontWeight: '700',
  },
});

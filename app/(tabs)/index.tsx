import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { supabase, Product } from '@/lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/contexts/AuthContext';
import { TriangleAlert as AlertTriangle, Search, Package, Calendar, MapPin, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { withBase } from '@/lib/webPath';

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'expired' | 'expiring'>('all');
  const [unitFilter, setUnitFilter] = useState<'all' | 'رفوف' | 'شبس' | 'ثلاجات' | 'مستودع'>('all');
  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchProducts();

    const channel = supabase
      .channel('products-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchProducts();
      })
      .subscribe();

    const interval = setInterval(() => {
      fetchProducts();
    }, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  // أعِد الجلب عند عودة التركيز للشاشة (بعد إضافة/حذف)
  useFocusEffect(
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useCallback(() => {
      fetchProducts();
      return () => {};
    }, [])
  );


  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('expiry_date', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      console.error('Error fetching products:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const isExpiringSoon = (expiryDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    // يعتبر قارب على الانتهاء خلال شهر
    return diffDays <= 30 && diffDays > 0;
  };

  const isExpired = (expiryDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    return expiry < today;
  };

  const getDaysRemaining = (expiryDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getFilteredProducts = () => {
    let filtered = products;

    if (filter === 'expired') {
      filtered = filtered.filter((p) => isExpired(p.expiry_date));
    } else if (filter === 'expiring') {
      filtered = filtered.filter((p) => isExpiringSoon(p.expiry_date) && !isExpired(p.expiry_date));
    } else {
      // في تبويب "الكل" لا نعرض المنتهي
      filtered = filtered.filter((p) => !isExpired(p.expiry_date));
    }

    if (unitFilter !== 'all') {
      filtered = filtered.filter((p) => (p.unit || '').trim() === unitFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.category?.toLowerCase().includes(query) ||
          p.barcode?.toLowerCase().includes(query) ||
          p.location?.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const filteredProducts = getFilteredProducts();
  const expiredCount = products.filter((p) => isExpired(p.expiry_date)).length;
  const expiringCount = products.filter((p) => isExpiringSoon(p.expiry_date)).length;

  const renderProduct = ({ item }: { item: Product }) => {
    const expiringSoon = isExpiringSoon(item.expiry_date);
    const expired = isExpired(item.expiry_date);
    const daysRemaining = getDaysRemaining(item.expiry_date);

    return (
      <TouchableOpacity
        style={[styles.productCard, expired && styles.productCardExpired, expiringSoon && styles.productCardExpiring]}
  onPress={() => router.push({ pathname: withBase('/(tabs)/product/[id]') as any, params: { id: item.id } })}
        activeOpacity={0.8}
      >
        <View style={styles.productCardContent}>
          {item.image_url && (
            <Image source={{ uri: item.image_url }} style={styles.productImage} />
          )}
          <View style={styles.productDetails}>
            <View style={styles.productHeader}>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.name}</Text>
                {item.category && <Text style={styles.productCategory}>{item.category}</Text>}
              </View>
            </View>

            <View style={styles.expirySection}>
              <View style={styles.expiryDateContainer}>
                <Calendar size={18} color={expired ? '#7C3AED' : expiringSoon ? '#F59E0B' : '#10B981'} />
                <View>
                  <Text style={styles.expiryLabel}>تاريخ الانتهاء</Text>
                  <Text style={[styles.expiryDate, expired && styles.expiryDateExpired, expiringSoon && styles.expiryDateExpiring]}>
                    {new Date(item.expiry_date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </Text>
                </View>
              </View>
              <View style={[styles.statusBadge, expired && styles.statusBadgeExpired, expiringSoon && styles.statusBadgeExpiring, !expired && !expiringSoon && styles.statusBadgeGood]}>
                {expired ? (
                  <Text style={[styles.statusText, { color: '#7C3AED' }]}>منتهي</Text>
                ) : (
                  <Text style={[styles.statusText, { color: expiringSoon ? '#F59E0B' : '#10B981' }]}>باقي {daysRemaining} يوم</Text>
                )}
              </View>
            </View>

            <View style={styles.productMeta}>
              {item.location && (
                <View style={styles.metaRow}>
                  <MapPin size={16} color="#6B7280" />
                  <Text style={styles.metaText}>{item.location}</Text>
                </View>
              )}
              <View style={styles.metaRow}>
                <Text style={styles.unitBadge}>{item.unit}</Text>
              </View>
              {item.current_quantity !== null && (
                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>الكمية: {item.current_quantity}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>سوبر ماركت المهندس</Text>
        <Text style={styles.headerSubtitle}>نظام تتبع التواريخ</Text>
        {(expiredCount > 0 || expiringCount > 0) && (
          <View>
            {expiredCount > 0 && (
              <View style={[styles.alertBanner, { backgroundColor: '#F3E8FF' }]}>
                <AlertTriangle size={20} color="#7C3AED" />
                <Text style={[styles.alertText, { color: '#7C3AED' }]}>
                  {expiredCount} منتج منتهي الصلاحية
                </Text>
              </View>
            )}
            {expiringCount > 0 && (
              <View style={[styles.alertBanner, { backgroundColor: '#FEF3C7', marginTop: expiredCount > 0 ? 8 : 0 }]}>
                <AlertTriangle size={20} color="#F59E0B" />
                <Text style={[styles.alertText, { color: '#F59E0B' }]}>
                  {expiringCount} منتج قارب على الانتهاء
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="ابحث عن منتج..."
            placeholderTextColor="#9CA3AF"
            textAlign="right"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <X size={16} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterButtonText, filter === 'all' && styles.filterButtonTextActive]}>
            الكل ({products.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'expired' && styles.filterButtonActive, filter === 'expired' && { backgroundColor: '#7C3AED', borderColor: '#7C3AED' }]}
          onPress={() => setFilter('expired')}
        >
          <Text style={[styles.filterButtonText, filter === 'expired' && { color: '#fff' }]}>
            منتهي ({expiredCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'expiring' && styles.filterButtonActive, filter === 'expiring' && { backgroundColor: '#F59E0B', borderColor: '#F59E0B' }]}
          onPress={() => setFilter('expiring')}
        >
          <Text style={[styles.filterButtonText, filter === 'expiring' && { color: '#fff' }]}>
            قارب ({expiringCount})
          </Text>
        </TouchableOpacity>
        {/* وحدة/موقع المنتجات */}
        <TouchableOpacity style={styles.unitFilterButton} onPress={() => setUnitModalOpen(true)}>
          <Text style={styles.unitFilterText}>الوحدة: {unitFilter === 'all' ? 'الكل' : unitFilter}</Text>
        </TouchableOpacity>
      </View>

      {/* نافذة اختيار الوحدة */}
      <Modal transparent visible={unitModalOpen} animationType="fade" onRequestClose={() => setUnitModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>اختر الوحدة</Text>
            <ScrollView style={styles.modalList}>
              {(['all', 'رفوف', 'شبس', 'ثلاجات', 'مستودع'] as const).map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.modalItem, unitFilter === opt && styles.modalItemActive]}
                  onPress={() => {
                    setUnitFilter(opt);
                    setUnitModalOpen(false);
                  }}
                >
                  <Text style={[styles.modalItemText, unitFilter === opt && styles.modalItemTextActive]}>
                    {opt === 'all' ? 'الكل' : opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setUnitModalOpen(false)}>
                <Text style={styles.modalCancelText}>إغلاق</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Package size={64} color="#9CA3AF" />
            <Text style={styles.emptyText}>
              {filter === 'expired' ? 'لا توجد منتجات منتهية' : filter === 'expiring' ? 'لا توجد منتجات قاربت على الانتهاء' : 'لا توجد منتجات بعد'}
            </Text>
            <Text style={styles.emptySubtext}>
              {filter === 'all' ? 'ابدأ بإضافة منتج جديد لتتبع تاريخ انتهائه' : ''}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 4,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  alertText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '600',
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#F8F9FA',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    padding: 0,
  },
  clearBtn: {
    padding: 6,
    borderRadius: 9999,
    backgroundColor: 'transparent',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  unitFilterButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  unitFilterText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  filterButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  productCardExpired: {
    borderColor: '#7C3AED',
    borderWidth: 2,
    backgroundColor: '#F9F5FF',
  },
  productCardExpiring: {
    borderColor: '#F59E0B',
    borderWidth: 2,
    backgroundColor: '#FFFBEB',
  },
  productCardContent: {
    flexDirection: 'row',
  },
  productImage: {
    width: 120,
    height: 150,
    backgroundColor: '#F3F4F6',
  },
  productDetails: {
    flex: 1,
    padding: 16,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'right',
  },
  productCategory: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'right',
  },
  expirySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  expiryDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expiryLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  expiryDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  expiryDateExpired: {
    color: '#7C3AED',
  },
  expiryDateExpiring: {
    color: '#F59E0B',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeExpired: {
    backgroundColor: '#F3E8FF',
  },
  statusBadgeExpiring: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeGood: {
    backgroundColor: '#D1FAE5',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  productMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  unitBadge: {
    fontSize: 12,
    color: '#007AFF',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
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
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalList: {
    maxHeight: 300,
  },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  modalItemActive: {
    borderColor: '#007AFF',
    backgroundColor: '#EFF6FF',
  },
  modalItemText: {
    fontSize: 16,
    color: '#111827',
    textAlign: 'center',
  },
  modalItemTextActive: {
    color: '#007AFF',
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  modalCancel: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#111827',
  },
});

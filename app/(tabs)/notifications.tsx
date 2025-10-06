import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { supabase, Product } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, CircleAlert as AlertCircle, Package } from 'lucide-react-native';
import { router } from 'expo-router';
import { withBase } from '@/lib/webPath';

export default function NotificationsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchProducts();

    const channel = supabase
      .channel('notifications-changes')
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

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('expiry_date', { ascending: true });

      if (error) throw error;

  const alertProducts = data?.filter((p: Product) => {
        const daysRemaining = getDaysRemaining(p.expiry_date);
        return daysRemaining <= 30;
      }) || [];

      setProducts(alertProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
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

  const renderNotification = ({ item }: { item: Product }) => {
    const daysRemaining = getDaysRemaining(item.expiry_date);
    const expired = isExpired(item.expiry_date);

    return (
      <TouchableOpacity
        style={[styles.notificationCard, expired && styles.notificationCardExpired]}
  onPress={() => router.push({ pathname: withBase('/product/[id]') as any, params: { id: item.id } })}
        activeOpacity={0.85}
      >
        <View style={styles.notificationIconContainer}>
          {expired ? (
            <AlertCircle size={32} color="#7C3AED" />
          ) : (
            <Calendar size={32} color="#F59E0B" />
          )}
        </View>

        <View style={styles.notificationContent}>
          {item.image_url && (
            <Image source={{ uri: item.image_url }} style={styles.notificationImage} />
          )}

          <View style={styles.notificationInfo}>
            <Text style={styles.notificationTitle}>{item.name}</Text>

            <View style={styles.notificationMeta}>
              <View style={styles.metaItem}>
                <Package size={14} color="#6B7280" />
                <Text style={styles.metaText}>{item.unit}</Text>
              </View>
              {item.location && (
                <Text style={styles.metaText}>• {item.location}</Text>
              )}
            </View>

            <View style={styles.notificationFooter}>
              <Text style={styles.expiryDate}>
                {new Date(item.expiry_date).toLocaleDateString('ar-EG', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>

              {expired ? (
                <View style={[styles.badge, styles.badgeExpired]}>
                  <Text style={styles.badgeTextExpired}>منتهي الصلاحية</Text>
                </View>
              ) : (
                <View style={[styles.badge, styles.badgeExpiring]}>
                  <Text style={styles.badgeTextExpiring}>باقي {daysRemaining} يوم</Text>
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

  const expiredCount = products.filter((p) => isExpired(p.expiry_date)).length;
  const expiringCount = products.filter((p) => !isExpired(p.expiry_date)).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>التنبيهات</Text>
        <Text style={styles.headerSubtitle}>سوبر ماركت المهندس</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: '#F3E8FF' }]}>
          <Text style={[styles.statNumber, { color: '#7C3AED' }]}>{expiredCount}</Text>
          <Text style={[styles.statLabel, { color: '#7C3AED' }]}>منتهي</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
          <Text style={[styles.statNumber, { color: '#F59E0B' }]}>{expiringCount}</Text>
          <Text style={[styles.statLabel, { color: '#F59E0B' }]}>قارب</Text>
        </View>
      </View>

      {products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Calendar size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>لا توجد تنبيهات</Text>
          <Text style={styles.emptyText}>جميع المنتجات في حالة جيدة</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
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
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#FEF3C7',
    flexDirection: 'row',
    gap: 12,
  },
  notificationCardExpired: {
    borderColor: '#F3E8FF',
  },
  notificationIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  notificationImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  notificationInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'right',
    marginBottom: 4,
  },
  notificationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  expiryDate: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeExpired: {
    backgroundColor: '#F3E8FF',
  },
  badgeExpiring: {
    backgroundColor: '#FEF3C7',
  },
  badgeTextExpired: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7C3AED',
  },
  badgeTextExpiring: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
});

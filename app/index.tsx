import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { withBase } from '@/lib/webPath';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  useEffect(() => {
    if (!user) router.replace(withBase('/login') as any);
    else router.replace(withBase('/') as any);
  }, [user]);

  return null;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

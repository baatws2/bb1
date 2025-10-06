import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
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

  // Use typed route groups for internal navigation so the URL stays clean:
  // - '/(auth)/login' becomes '/login'
  // - '/(tabs)' becomes '/'
  if (!user) return <Redirect href={withBase('/login') as any} />;
  return <Redirect href={withBase('/') as any} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

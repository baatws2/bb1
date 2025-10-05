import { View, Text, StyleSheet, Pressable, Linking, Platform } from 'react-native';

export default function Welcome() {
  const isWeb = Platform.OS === 'web';
  const REPO_URL = 'https://github.com/baatws2/baatws2';
  const PAGES_URL = 'https://baatws2.github.io/baatws2/';
  return (
    <View style={styles.container}>
      <Text style={styles.title}>أهلاً بك في برنامج الترحيب!</Text>
      <Text style={styles.subtitle}>تم إعداد هذه الصفحة كمثال مبسط.</Text>
      <Text style={styles.instructions}>
        لتشغيل البرنامج:
        {'\n'}1) npm install
        {'\n'}2) npx vite
        {'\n'}ثم افتح: http://localhost:5173
      </Text>
      <Pressable style={[styles.button, { backgroundColor: '#10b981' }]} onPress={() => Linking.openURL(REPO_URL)}>
        <Text style={styles.buttonText}>مستودع GitHub</Text>
      </Pressable>
      <Pressable style={[styles.button, { backgroundColor: '#6b7280' }]} onPress={() => Linking.openURL(PAGES_URL)}>
        <Text style={styles.buttonText}>GitHub Pages</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 18,
    color: '#222',
  },
  subtitle: {
    fontSize: 17,
    color: '#666',
    marginBottom: 10,
  },
  instructions: {
    marginTop: 20,
    fontSize: 15,
    color: '#333',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 18,
  },
  button: {
    marginTop: 10,
    paddingHorizontal: 18,
    paddingVertical: 11,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

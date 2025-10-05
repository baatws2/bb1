import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Package } from 'lucide-react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('admin@admin.com');
  const [password, setPassword] = useState('admin123');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signUp } = useAuth();

  const handleAuth = async () => {
    if (!email || !password) {
      setError('الرجاء إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        await signUp(email, password);
        Alert.alert('نجح التسجيل', 'تم إنشاء الحساب بنجاح');
      } else {
        try {
          await signIn(email, password);
        } catch (signInError: any) {
          if (signInError.message?.includes('Invalid login credentials')) {
            await signUp(email, password);
            await signIn(email, password);
          } else {
            throw signInError;
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ، الرجاء المحاولة مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Package size={64} color="#007AFF" strokeWidth={2} />
          <Text style={styles.title}>نظام تتبع المنتجات</Text>
          <Text style={styles.subtitle}>إدارة المخزون والمنتجات</Text>
        </View>

        <View style={styles.form}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TextInput
            style={styles.input}
            placeholder="البريد الإلكتروني"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            textAlign="right"
          />

          <TextInput
            style={styles.input}
            placeholder="كلمة المرور"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textAlign="right"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleAuth}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'جاري التحميل...' : isSignUp ? 'إنشاء حساب' : 'تسجيل الدخول'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
          >
            <Text style={styles.switchText}>
              {isSignUp ? 'لديك حساب؟ تسجيل الدخول' : 'ليس لديك حساب؟ إنشاء حساب'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchText: {
    color: '#007AFF',
    fontSize: 14,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
  },
});

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { AuthService } from '../../services/auth';

export default function RegisterScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleRegister = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin");
      return;
    }
    if (formData.password.length < 6) {
      Alert.alert("Lỗi", "Mật khẩu phải từ 6 ký tự trở lên");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);
    try {
      await AuthService.register(formData, router);
    } catch (error) {
      Alert.alert("Lỗi", "Đăng ký thất bại, email có thể đã tồn tại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1557683316-973673baf926' }}
      style={styles.container}
      blurRadius={50}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
               <Ionicons name="person-add" size={60} color="#fff" />
            </View>
            <Text style={styles.title}>Tạo tài khoản</Text>
            <Text style={styles.subtitle}>Bắt đầu hành trình kỷ luật của bạn</Text>
          </View>

          {/* Form Section */}
          <View style={styles.form}>
            {/* Họ và tên */}
            <View style={styles.inputArea}>
              <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Họ và tên"
                placeholderTextColor="#999"
                onChangeText={(t) => setFormData({ ...formData, name: t })}
              />
            </View>

            {/* Email */}
            <View style={styles.inputArea}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                onChangeText={(t) => setFormData({ ...formData, email: t })}
              />
            </View>

            {/* Mật khẩu */}
            <View style={styles.inputArea}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Mật khẩu"
                placeholderTextColor="#999"
                secureTextEntry={!showPass}
                onChangeText={(t) => setFormData({ ...formData, password: t })}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={20} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Nhập lại mật khẩu */}
            <View style={styles.inputArea}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Xác nhận mật khẩu"
                placeholderTextColor="#999"
                secureTextEntry={!showPass}
                onChangeText={(t) => setFormData({ ...formData, confirmPassword: t })}
              />
            </View>

            {/* Register Button */}
            <TouchableOpacity
              disabled={loading}
              style={[styles.registerButton, loading && { opacity: 0.7 }]}
              onPress={handleRegister}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.registerButtonText}>ĐĂNG KÝ NGAY</Text>
              )}
            </TouchableOpacity>

            {/* Footer Link */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Đã có tài khoản?{' '}
                <Text style={styles.linkText} onPress={() => router.back()}>
                  Đăng nhập
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    padding: 25 
  },
  header: { 
    alignItems: 'center', 
    marginBottom: 30 
  },
  logoContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 15,
    borderRadius: 30,
    marginBottom: 10
  },
  title: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 10
  },
  subtitle: { 
    fontSize: 16, 
    color: 'rgba(255,255,255,0.8)', 
    marginTop: 8 
  },
  form: { 
    width: '100%', 
    backgroundColor: '#fff', 
    padding: 25, 
    borderRadius: 30,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 55,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, height: '100%', fontSize: 16, color: '#333' },
  registerButton: {
    width: '100%',
    height: 55,
    backgroundColor: '#34C759',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  registerButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  footer: { marginTop: 25, alignItems: 'center' },
  footerText: { fontSize: 14, color: '#666' },
  linkText: { color: '#007AFF', fontWeight: 'bold', textDecorationLine: 'underline' },
});
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthService } from '../../services/auth';
import { auth, db } from '../../services/firebaseConfig';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [userData, setUserData] = useState({ name: '', email: '', avatarUrl: '' });
  const [editType, setEditType] = useState('avatar');

  useEffect(() => { loadUserData(); }, []);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) setUserData(userDoc.data());
      }
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleUpdateProfile = async (updates) => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        await updateDoc(userRef, updates);
        setUserData(prev => ({ ...prev, ...updates }));
        setModalVisible(false);
      }
    } catch (error) { Alert.alert("Lỗi", "Không thể cập nhật"); }
  };

  const pickImageFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      return Alert.alert("Quyền truy cập", "Ứng dụng cần quyền truy cập thư viện ảnh.");
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.3,
      base64: true,
    });

    if (!result.canceled) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      handleUpdateProfile({ avatarUrl: base64Image });
    }
  };

  const openRenameModal = () => {
    setEditType('name');
    setUrlInput(userData.name);
    setModalVisible(true);
  };

  const openAvatarModal = () => {
    setEditType('avatar');
    setUrlInput(userData.avatarUrl?.startsWith('http') ? userData.avatarUrl : '');
    setModalVisible(true);
  };

  const handleSaveFromModal = () => {
    if (!urlInput.trim()) return Alert.alert("Lỗi", "Nội dung không được để trống");
    if (editType === 'name') handleUpdateProfile({ name: urlInput });
    else handleUpdateProfile({ avatarUrl: urlInput });
  };

  const changeToIcon = (iconName, color) => {
    handleUpdateProfile({ avatarUrl: `icon:${iconName}:${color}` });
  };

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      { text: "Đăng xuất", style: "destructive", onPress: () => AuthService.logout(router) }
    ]);
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#007AFF" /></View>;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>{editType === 'name' ? 'Đổi tên hiển thị' : 'Dán link ảnh đại diện'}</Text>
            <TextInput style={styles.urlInput} placeholder={editType === 'name' ? "Nhập tên của bạn" : "https://example.com/image.jpg"} value={urlInput} onChangeText={setUrlInput} autoFocus={true} />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}><Text style={{ color: '#666' }}>Hủy</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleSaveFromModal} style={styles.saveBtn}><Text style={{ color: 'white', fontWeight: 'bold' }}>Lưu lại</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={26} color="#333" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Thông tin cá nhân</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <View style={styles.avatarWrapper}>
            {userData.avatarUrl && (userData.avatarUrl.startsWith('http') || userData.avatarUrl.startsWith('data:image')) ? (
              <Image source={{ uri: userData.avatarUrl }} style={styles.avatarImage} />
            ) : userData.avatarUrl && userData.avatarUrl.startsWith('icon:') ? (
              <Ionicons name={userData.avatarUrl.split(':')[1]} size={100} color={userData.avatarUrl.split(':')[2]} />
            ) : (
              <Ionicons name="person-circle" size={100} color="#007AFF" />
            )}

            <View style={styles.avatarActionButtons}>
              <TouchableOpacity onPress={pickImageFromGallery} style={styles.actionCircle}>
                <Ionicons name="images" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity onPress={openAvatarModal} style={[styles.actionCircle, { backgroundColor: '#34C759' }]}>
                <Ionicons name="link" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionLabel}>Thông tin tài khoản</Text>
          <TouchableOpacity style={styles.infoCard} onPress={openRenameModal}>
            <View style={styles.infoIcon}><Ionicons name="person-outline" size={22} color="#007AFF" /></View>
            <View style={styles.infoTextWrapper}>
              <Text style={styles.infoLabel}>Họ và tên</Text>
              <Text style={styles.infoValue}>{userData.name || 'Chưa cập nhật'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CCC" />
          </TouchableOpacity>

          <View style={[styles.infoCard, { opacity: 0.7 }]}>
            <View style={styles.infoIcon}><Ionicons name="mail-outline" size={22} color="#007AFF" /></View>
            <View style={styles.infoTextWrapper}>
              <Text style={styles.infoLabel}>Email (Không thể sửa)</Text>
              <Text style={styles.infoValue}>{userData.email}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Đổi nhanh biểu tượng:</Text>
        <View style={styles.avatarPicker}>
          {[{ icon: 'rocket', color: '#ff9f43' }, { icon: 'leaf', color: '#2ecc71' }, { icon: 'sunny', color: '#f1c40f' }, { icon: 'heart', color: '#ff4757' }].map((item, index) => (
            <TouchableOpacity key={index} style={styles.pickerItem} onPress={() => changeToIcon(item.icon, item.color)}>
              <Ionicons name={item.icon} size={28} color={item.color} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#ff4d4f" />
          <Text style={styles.logoutText}>Đăng xuất tài khoản</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#FFF' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A' },
  profileSection: { alignItems: 'center', paddingVertical: 30, backgroundColor: '#FFF' },
  avatarWrapper: { position: 'relative', width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#EEE' },
  avatarActionButtons: {flexDirection: 'row', position: 'absolute', bottom: -10, gap: 10},
  actionCircle: {backgroundColor: '#007AFF',width: 36,height: 36,borderRadius: 18,justifyContent: 'center',alignItems: 'center',borderWidth: 3,borderColor: 'white',elevation: 3},
  infoSection: { marginTop: 20, paddingHorizontal: 20 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#888', marginBottom: 10, textTransform: 'uppercase', paddingHorizontal: 20, marginTop: 10 },
  infoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 15, marginBottom: 12, elevation: 2 },
  infoIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#EBF5FF', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  infoTextWrapper: { flex: 1 },
  infoLabel: { fontSize: 12, color: '#999', marginBottom: 2 },
  infoValue: { fontSize: 16, fontWeight: '500', color: '#333' },
  avatarPicker: { flexDirection: 'row', justifyContent: 'center', gap: 15, marginBottom: 30, marginTop: 5 },
  pickerItem: { padding: 12, backgroundColor: '#FFF', borderRadius: 12, elevation: 1 },
  logoutBtn: { marginHorizontal: 20, marginVertical: 20, padding: 16, backgroundColor: '#FFF', borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FFEBEB' },
  logoutText: { color: '#ff4d4f', fontWeight: 'bold', marginLeft: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalView: { width: '85%', backgroundColor: 'white', borderRadius: 20, padding: 25, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  urlInput: { width: '100%', height: 50, backgroundColor: '#f0f0f0', borderRadius: 10, paddingHorizontal: 15, marginBottom: 20 },
  modalButtons: { flexDirection: 'row', gap: 10 },
  cancelBtn: { padding: 12, flex: 1, alignItems: 'center' },
  saveBtn: { backgroundColor: '#007AFF', padding: 12, borderRadius: 10, flex: 1, alignItems: 'center' }
});
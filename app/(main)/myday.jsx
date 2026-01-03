import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { collection, getDocs, query } from "firebase/firestore";
import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, ImageBackground, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Taskitem from '../../components/Taskitem';
import { auth, db } from '../../services/firebaseConfig';
import { TaskService } from '../../services/taskService';

const PRESET_BGS = [
  { id: 'p1', name: 'Rừng xanh', uri: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=60' },
  { id: 'p2', name: 'Núi tuyết', uri: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=60' },
  { id: 'p3', name: 'Biển xanh', uri: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=60' },
  { id: 'p4', name: 'Thành phố', uri: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=800&q=60' },
  { id: 'p5', name: 'Hoàng hôn', uri: 'https://image.vnbackup.com/K9g7PhRZqhXnZ02cb49728bba3fe2fa0/tuyet-dep-canh-hoang-hon-tren-bien-2.jpg?auto=format&fit=crop&w=800&q=60' },
];

export default function MyDayScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const userId = auth.currentUser?.uid;

  const [tasks, setTasks] = useState([]);
  const [allOtherTasks, setAllOtherTasks] = useState([]);
  const [isPickerVisible, setPickerVisible] = useState(false);
  const [isMenuVisible, setMenuVisible] = useState(false);
  
  const [bgImage, setBgImage] = useState(PRESET_BGS[0].uri);
  const [customBgs, setCustomBgs] = useState([]);
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedBg = await AsyncStorage.getItem(`@myday_bg_${userId}`);
        if (savedBg) setBgImage(savedBg);

        const savedCustom = await AsyncStorage.getItem(`@myday_custom_list_${userId}`);
        if (savedCustom) setCustomBgs(JSON.parse(savedCustom));
      } catch (e) { console.error(e); }
    };
    loadSavedData();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const unsubscribe = TaskService.subscribeTasks(userId, 'myday', (data) => {
      setTasks(data);
    });
    return () => unsubscribe();
  }, [userId]);

  const handleUpdateBg = async (uri, isNewCustom = false) => {
    setBgImage(uri);
    await AsyncStorage.setItem(`@myday_bg_${userId}`, uri);

    if (isNewCustom) {
      const newCustomList = [uri, ...customBgs.filter(item => item !== uri)].slice(0, 6);
      setCustomBgs(newCustomList);
      await AsyncStorage.setItem(`@myday_custom_list_${userId}`, JSON.stringify(newCustomList));
    }
    setMenuVisible(false);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Thông báo', 'Cần quyền truy cập ảnh để đổi hình nền!');
      return;
    }
    
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.7,
    });

    if (!result.canceled) {
      handleUpdateBg(result.assets[0].uri, true);
    }
  };

  const handleDeleteCustomBg = (uriToDelete) => {
    Alert.alert("Xóa ảnh", "Bạn có chắc muốn xóa ảnh này khỏi danh sách tùy chỉnh?", [
      { text: "Hủy", style: "cancel" },
      { 
        text: "Xóa", 
        style: "destructive", 
        onPress: async () => {
          const updatedList = customBgs.filter(uri => uri !== uriToDelete);
          setCustomBgs(updatedList);
          await AsyncStorage.setItem(`@myday_custom_list_${userId}`, JSON.stringify(updatedList));

          if (bgImage === uriToDelete) {
            const defaultBg = PRESET_BGS[0].uri;
            setBgImage(defaultBg);
            await AsyncStorage.setItem(`@myday_bg_${userId}`, defaultBg);
          }
        } 
      }
    ]);
  };

  const openPicker = async () => {
    try {
      const q = query(collection(db, "users", userId, "tasks"));
      const querySnapshot = await getDocs(q);
      const allTasks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const existingIds = new Set(tasks.map(t => t.id));
      const available = allTasks.filter(t => !existingIds.has(t.id) && !t.completed);
      setAllOtherTasks(available);
      setPickerVisible(true);
    } catch (error) { console.error(error); }
  };

  const addToMyDay = async (item) => {
    await TaskService.updateTask(userId, item.id, { listId: 'myday' });
    setPickerVisible(false);
  };

  return (
    <ImageBackground source={{ uri: bgImage }} style={{ flex: 1 }}>
      <View style={[styles.overlay, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-back" size={28} color="white" /></TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={styles.title}>Ngày của tôi</Text>
            <Text style={styles.subtitle}>{new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          </View>
          <TouchableOpacity onPress={() => setMenuVisible(true)}><Ionicons name="ellipsis-horizontal" size={26} color="white" /></TouchableOpacity>
        </View>

        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Taskitem 
              item={item}
              color="#fff"
              onToggleComplete={(i) => TaskService.updateTask(userId, i.id, { completed: !i.completed })}
              onToggleImportant={(i) => TaskService.updateTask(userId, i.id, { important: !i.important })}
              onDelete={(id) => TaskService.deleteTask(userId, id)}
              onPress={() => router.push(`/task/${item.id}`)}
            />
          )}
          contentContainerStyle={{ padding: 20 }}
        />
        
        <TouchableOpacity style={styles.fab} onPress={openPicker}>
          <Ionicons name="add" size={32} color="white" />
        </TouchableOpacity>

        <Modal visible={isMenuVisible} transparent animationType="slide">
          <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setMenuVisible(false)}>
            <View style={styles.menuContainer}>
              <View style={styles.menuIndicator} />
              <Text style={styles.menuTitle}>Chỉnh sửa chủ đề</Text>
              
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                {customBgs.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>Ảnh của bạn</Text>
                    <View style={styles.gridBgs}>
                      {customBgs.map((uri, index) => (
                        <View key={index} style={styles.bgCard}>
                          <TouchableOpacity style={{ flex: 1 }} onPress={() => handleUpdateBg(uri)}>
                            <Image source={{ uri }} style={[styles.thumb, bgImage === uri && styles.activeThumb]} />
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.deleteBadge} onPress={() => handleDeleteCustomBg(uri)}>
                            <Ionicons name="close-circle" size={20} color="#ff4d4f" />
                          </TouchableOpacity>
                        </View>
                      ))}
                      <TouchableOpacity style={[styles.bgCard, styles.addCard]} onPress={pickImage}>
                        <Ionicons name="camera-outline" size={24} color="#666" />
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                <Text style={styles.sectionTitle}>Mẫu mặc định</Text>
                <View style={styles.gridBgs}>
                  {PRESET_BGS.map((item) => (
                    <TouchableOpacity key={item.id} style={styles.bgCard} onPress={() => handleUpdateBg(item.uri)}>
                      <Image source={{ uri: item.uri }} style={[styles.thumb, bgImage === item.uri && styles.activeThumb]} />
                    </TouchableOpacity>
                  ))}
                </View>

                {customBgs.length === 0 && (
                  <TouchableOpacity style={styles.customBtn} onPress={pickImage}>
                    <Ionicons name="images-outline" size={24} color="#007AFF" />
                    <Text style={styles.customBtnText}>Tải ảnh lên từ máy</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        <Modal visible={isPickerVisible} animationType="slide" transparent>
          <View style={styles.pickerModal}>
            <Text style={styles.modalTitle}>Thêm tác vụ vào ngày hôm nay</Text>
            <FlatList
              data={allOtherTasks}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.pickItem} onPress={() => addToMyDay(item)}>
                  <Text style={styles.pickTitle}>{item.title}</Text>
                  <Ionicons name="add-circle-outline" size={26} color="#007AFF" />
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => setPickerVisible(false)} style={styles.closeBtn}><Text style={styles.closeTxt}>Đóng</Text></TouchableOpacity>
          </View>
        </Modal>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  header: { flexDirection: 'row', padding: 20, alignItems: 'center' },
  title: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  subtitle: { color: 'white', fontSize: 14, opacity: 0.9 },
  fab: { position: 'absolute', bottom: 40, alignSelf: 'center', backgroundColor: '#007AFF', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  menuContainer: { backgroundColor: 'white', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, maxHeight: '85%' },
  menuIndicator: { width: 40, height: 5, backgroundColor: '#ddd', borderRadius: 3, alignSelf: 'center', marginBottom: 15 },
  menuTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 14, color: '#666', marginBottom: 12, fontWeight: '600', marginTop: 10 },
  gridBgs: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  bgCard: { width: '30%', height: 120, marginBottom: 15, position: 'relative' },
  thumb: { width: '100%', height: '100%', borderRadius: 10, borderWidth: 2, borderColor: 'transparent' },
  activeThumb: { borderColor: '#007AFF' },
  addCard: { backgroundColor: '#f5f5f5', borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#ccc' },
  deleteBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: 'white', borderRadius: 10 },
  customBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f7ff', padding: 15, borderRadius: 12, justifyContent: 'center', marginTop: 10 },
  customBtnText: { marginLeft: 10, color: '#007AFF', fontWeight: 'bold' },
  pickerModal: { flex: 1, marginTop: 100, backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  pickItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  pickTitle: { fontSize: 16 },
  closeBtn: { marginTop: 20, padding: 15, backgroundColor: '#f5f5f5', borderRadius: 10 },
  closeTxt: { textAlign: 'center', color: '#007AFF', fontWeight: 'bold' }
});
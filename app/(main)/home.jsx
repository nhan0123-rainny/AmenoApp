import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useFocusEffect, useRouter } from 'expo-router';
import { collection, doc, getDoc, onSnapshot } from "firebase/firestore";
import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, db } from '../../services/firebaseConfig';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: Platform.OS !== 'android',
    shouldShowBanner: Platform.OS === 'android',
    shouldShowList: Platform.OS === 'android',
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [userData, setUserData] = useState({ name: 'Người dùng', email: '', avatarUrl: '' });
  const [customLists, setCustomLists] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState([
    { id: 'myday', title: 'Ngày của tôi', icon: 'sunny-outline', color: '#60a5fa', count: 0 },
    { id: 'important', title: 'Quan trọng', icon: 'star-outline', color: '#f87171', count: 0 },
    { id: 'planned', title: 'Đã lập kế hoạch', icon: 'calendar-outline', color: '#34d399', count: 0 },
    { id: 'tasks', title: 'Tác vụ', icon: 'home-outline', color: '#818cf8', count: 0 },
  ]);

  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Ameno App 🔔",
            body: "Hệ thống thông báo đã sẵn sàng!",
          },
          trigger: {
            seconds: 2,
            channelId: 'default',
          },
        });
      } catch (e) {
        console.log("Lỗi test thông báo:", e);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  async function registerForPushNotificationsAsync() {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      if (existingStatus !== 'granted') await Notifications.requestPermissionsAsync();
    }
  }

  const updateData = useCallback(async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) setUserData(userDoc.data());

      const tasksRef = collection(db, "users", currentUser.uid, "tasks");
      const unsubscribeTasks = onSnapshot(tasksRef, async (snapshot) => {
        const allTasks = snapshot.docs.map(doc => doc.data());

        setCategories(prev => prev.map(cat => ({
          ...cat,
          count: allTasks.filter(t => {
            if (cat.id === 'myday') return t.listId === 'myday' && !t.completed;
            if (cat.id === 'important') return t.important && !t.completed;
            if (cat.id === 'planned') return t.dueDate && !t.completed;
            if (cat.id === 'tasks') return t.listId === 'tasks' && !t.completed;
            return false;
          }).length
        })));

        const customVal = await AsyncStorage.getItem('@custom_lists');
        if (customVal) {
          const parsedLists = JSON.parse(customVal);
          setCustomLists(parsedLists.map(list => ({
            ...list,
            count: allTasks.filter(t => t.listId === list.id && !t.completed).length
          })));
        } else {
          setCustomLists([]);
        }
      });
      return () => unsubscribeTasks();
    } catch (e) {
      console.error("Lỗi cập nhật dữ liệu:", e);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    updateData();
  }, [updateData]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await updateData();
    setRefreshing(false);
  }, [updateData]);

  const deleteCustomList = (listId, listTitle) => {
    Alert.alert(
      "Xóa danh sách",
      `Bạn có chắc muốn xóa danh sách "${listTitle}"?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            const currentLists = await AsyncStorage.getItem('@custom_lists');
            if (currentLists) {
              const filtered = JSON.parse(currentLists).filter(l => l.id !== listId);
              await AsyncStorage.setItem('@custom_lists', JSON.stringify(filtered));
              updateData();
            }
          }
        }
      ]
    );
  };

  const renderAvatar = () => {
    const { avatarUrl } = userData;
    if (avatarUrl && (avatarUrl.startsWith('http') || avatarUrl.startsWith('data:image'))) {
      return <Image source={{ uri: avatarUrl }} style={styles.avtImg} />;
    }
    if (avatarUrl && avatarUrl.startsWith('icon:')) {
      const [_, iconName, iconColor] = avatarUrl.split(':');
      return (
        <View style={[styles.avtImg, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }]}>
          <Ionicons name={iconName} size={28} color={iconColor} />
        </View>
      );
    }
    return <Ionicons name="person-circle-outline" size={45} color="#007AFF" />;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.headerLeft} onPress={() => router.push('users/profile')}>
          {renderAvatar()}
          <View style={styles.textContainer}>
            <Text style={styles.welcomeText}>Chào, {userData.name}!</Text>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'short' })}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/search')}>
          <Ionicons name="search-outline" size={26} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007AFF']}
            tintColor={'#007AFF'}
          />
        }
      >
        <View style={styles.section}>
          {categories.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.categoryItem}
              onPress={() => router.push({
                pathname: item.id === 'tasks' ? '/tasks' : `/${item.id}`,
                params: { listId: item.id, title: item.title, color: item.color }
              })}
            >
              <View style={styles.categoryLeft}>
                <Ionicons name={item.icon} size={24} color={item.color} />
                <Text style={styles.categoryTitle}>{item.title}</Text>
              </View>
              {item.count > 0 && <Text style={styles.categoryCount}>{item.count}</Text>}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.divider} />

        {customLists.map((item) => (
          <View key={item.id} style={styles.categoryItem}>
            <TouchableOpacity
              style={styles.categoryLeft}
              onPress={() => router.push({
                pathname: '/tasks',
                params: {
                  listId: item.id,
                  title: item.title,
                  color: item.color
                }
              })}
            >
              <Ionicons name={item.icon || 'list-outline'} size={24} color={item.color || '#818cf8'} />
              <Text style={styles.categoryTitle}>{item.title}</Text>
            </TouchableOpacity>

            <View style={styles.categoryRight}>
              {item.count > 0 && <Text style={styles.categoryCount}>{item.count}</Text>}
              <TouchableOpacity
                onPress={() => deleteCustomList(item.id, item.title)}
                style={styles.deleteBtn}
              >
                <Ionicons name="trash-outline" size={18} color="#ff4d4f" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/newlist')}>
        <Ionicons name="add" size={28} color="white" />
        <Text style={styles.fabText}>Danh sách mới</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  avtImg: { width: 45, height: 45, borderRadius: 22.5 },
  textContainer: { marginLeft: 12 },
  welcomeText: { fontSize: 20, fontWeight: 'bold' },
  dateText: { fontSize: 13, color: '#888' },
  content: { paddingHorizontal: 20, paddingBottom: 100 },
  section: { marginTop: 10 },
  categoryItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  categoryLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  categoryRight: { flexDirection: 'row', alignItems: 'center' },
  categoryTitle: { fontSize: 17, marginLeft: 15, color: '#333' },
  categoryCount: { fontSize: 15, color: '#888' },
  deleteBtn: { marginLeft: 15, padding: 4 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 10 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 40,
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  fabText: { color: 'white', fontWeight: 'bold', marginLeft: 8 }
});
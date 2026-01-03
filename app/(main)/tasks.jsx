import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert, Keyboard, KeyboardAvoidingView, Modal, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Customheader from '../../components/Customheader';
import Taskitem from '../../components/Taskitem';
import { auth } from '../../services/firebaseConfig';
import { TaskService } from '../../services/taskService';
import { cancelNotification, scheduleTaskNotification } from '../../utils/notifications';

export default function TasksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { listId, title, color } = useLocalSearchParams();
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [tempDueDate, setTempDueDate] = useState(null);
  const [tempReminder, setTempReminder] = useState(null);
  const [tempRepeat, setTempRepeat] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [kbVisible, setKbVisible] = useState(false);
  const userId = auth.currentUser?.uid;
  const scrollRef = useRef(null);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => setKbVisible(true));
    const hideSub = Keyboard.addListener("keyboardDidHide", () => setKbVisible(false));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  useEffect(() => {
    if (!userId) return;
    const unsubscribe = TaskService.subscribeTasks(userId, listId || 'tasks', (data) => {
      setTasks(data.sort((a, b) => (a.completed === b.completed ? b.createdAt?.localeCompare(a.createdAt) : a.completed ? 1 : -1)));
    });
    return () => unsubscribe();
  }, [userId, listId]);

  const handleDelete = (item) => {
    Alert.alert("Xóa tác vụ", `Bạn có chắc muốn xóa "${item.title}"?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa", style: "destructive", onPress: async () => {
          try {
            if (item.notificationId) await cancelNotification(item.notificationId);
            await TaskService.deleteTask(userId, item.id);
          } catch (e) { console.log(e); }
        }
      }
    ]);
  };

  const addTask = async () => {
    if (!newTaskTitle.trim() || !userId) return;
    const taskObj = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      completed: false,
      important: false,
      subtasks: [],
      dueDate: tempDueDate,
      reminder: tempReminder,
      repeat: tempRepeat,
      listId: listId || 'tasks',
      createdAt: new Date().toISOString(),
      notificationId: null
    };

    try {
      if (taskObj.reminder) {
        try {
          const nid = await scheduleTaskNotification({
            title: taskObj.title,
            reminder: taskObj.reminder,
            dueDate: taskObj.dueDate,
            repeat: taskObj.repeat
          });
          taskObj.notificationId = nid;
        } catch (err) {
          console.log("Lỗi khi tạo thông báo cho Task mới:", err);
        }
      }
      await TaskService.addTask(userId, taskObj);
      setNewTaskTitle('');
      setTempDueDate(null);
      setTempReminder(null);
      setTempRepeat(null);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
    } catch (e) {
      Alert.alert("Lỗi", "Không thể thêm tác vụ vào danh sách.");
    }
  };

  return (
    <View style={styles.container}>
      <Customheader title={title || 'Tác vụ'} color={color} onBack={() => router.back()} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'android' ? 0.7 : 0}
      >
        <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
          {tasks.map((item) => (
            <Taskitem
              key={item.id} item={item} color={color}
              onToggleComplete={(i) => TaskService.updateTask(userId, i.id, { completed: !i.completed })}
              onToggleImportant={(i) => TaskService.updateTask(userId, i.id, { important: !i.important })}
              onDelete={() => handleDelete(item)}
              onPress={() => router.push({ pathname: `/task/${item.id}`, params: { listId: listId || 'tasks' } })}
            />
          ))}
        </ScrollView>

        <View style={[styles.inputWrapper, { paddingBottom: kbVisible ? 10 : (insets.bottom || 15) }]}>
          <TextInput
            placeholder="Thêm tác vụ..."
            style={styles.input}
            value={newTaskTitle}
            onChangeText={setNewTaskTitle}
            onSubmitEditing={addTask}
            placeholderTextColor="#999"
          />
          <View style={styles.toolBar}>
            <View style={styles.toolLeft}>
              <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.toolItem}>
                <Ionicons name="calendar-outline" size={22} color={tempDueDate ? (color || "#007AFF") : "#666"} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.toolItem}>
                <Ionicons name="notifications-outline" size={22} color={tempReminder ? (color || "#007AFF") : "#666"} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setActiveMenu('repeat')} style={styles.toolItem}>
                <Ionicons name="repeat-outline" size={22} color={tempRepeat ? (color || "#007AFF") : "#666"} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={addTask}>
              <Ionicons name="arrow-up-circle" size={42} color={color || '#007AFF'} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={activeMenu !== null} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setActiveMenu(null)}>
          <View style={styles.menuContent}>
            {["Hàng ngày", "Hàng tuần", "Hàng tháng", "Hàng năm"].map(opt => (
              <TouchableOpacity key={opt} style={styles.menuItem} onPress={() => { setTempRepeat(opt); setActiveMenu(null); }}>
                <Text style={{ textAlign: 'center' }}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {showDatePicker && <DateTimePicker value={new Date()} mode="date" onChange={(e, d) => { setShowDatePicker(false); if (d) setTempDueDate(`${d.getDate()}/${d.getMonth() + 1}`); }} />}
      {showTimePicker && <DateTimePicker value={new Date()} mode="time" is24Hour={true} onChange={(e, d) => { setShowTimePicker(false); if (d) setTempReminder(`${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`); }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inputWrapper: { backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee', paddingHorizontal: 15, paddingTop: 10, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 3 },
  input: { fontSize: 16, marginBottom: 8, color: '#333', backgroundColor: '#f9f9f9', padding: 12, borderRadius: 10 },
  toolBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toolLeft: { flexDirection: 'row', gap: 15 },
  toolItem: { backgroundColor: '#f5f5f5', padding: 8, borderRadius: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  menuContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  menuItem: { paddingVertical: 15, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
});
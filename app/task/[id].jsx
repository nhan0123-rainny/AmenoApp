import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Modal, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, db } from "../../services/firebaseConfig";
import { TaskService } from "../../services/taskService";
import { cancelNotification, scheduleTaskNotification } from "../../utils/notifications";

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const userId = auth.currentUser?.uid;

  const [task, setTask] = useState(null);
  const [originalTask, setOriginalTask] = useState(null);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showRepeatMenu, setShowRepeatMenu] = useState(false);

  useEffect(() => {
    const loadTask = async () => {
      if (!userId || !id) return;
      const docSnap = await getDoc(doc(db, "users", userId, "tasks", id));
      if (docSnap.exists()) {
        const data = {
          id: docSnap.id,
          ...docSnap.data(),
          subtasks: Array.isArray(docSnap.data().subtasks) ? docSnap.data().subtasks : []
        };
        setTask(data);
        setOriginalTask(JSON.parse(JSON.stringify(data)));
      }
    };
    loadTask();
  }, [id, userId]);


  const handleSave = async () => {
    if (!userId || !task) return;
    let finalSubtasks = [...(task.subtasks || [])];
    if (subtaskInput.trim()) {
      finalSubtasks.push({
        id: Date.now().toString(),
        title: subtaskInput.trim(),
        completed: false
      });
    }
    const cleanSubtasks = finalSubtasks.map(sub => ({
      id: sub.id,
      title: sub.title,
      completed: !!sub.completed
    }));

    let finalNotificationId = task.notificationId;

    try {
      const hasTimeChanged =
        task.reminder !== originalTask?.reminder ||
        task.dueDate !== originalTask?.dueDate ||
        task.repeat !== originalTask?.repeat;

      if (task.completed) {
        if (task.notificationId) await cancelNotification(task.notificationId);
        finalNotificationId = null;
      } else if (hasTimeChanged || task.title !== originalTask?.title) {
        if (task.notificationId) await cancelNotification(task.notificationId);
        if (task.reminder) {
          finalNotificationId = await scheduleTaskNotification(task);
        }
      }
    } catch (e) {
      console.warn("Sự cố thông báo (vẫn sẽ lưu dữ liệu):", e);
    }

    try {
      console.log("🔥 UPDATE TASK PAYLOAD:", {
        title: task.title,
        subtasks: cleanSubtasks
      });

      await TaskService.updateTask(userId, id, {
        title: task.title,
        subtasks: cleanSubtasks,
        notes: task.notes ?? "",
        notificationId: finalNotificationId ?? null,
        updatedAt: new Date().toISOString()
      });

      router.back();
    } catch (err) {
      Alert.alert("Lỗi", "Không thể đồng bộ với máy chủ.");
    }
  };

  const addSubtask = () => {
    if (!subtaskInput.trim()) return;
    const newSub = { id: Date.now().toString(), title: subtaskInput.trim(), completed: false };
    setTask(prev => ({
      ...prev,
      subtasks: [...(prev.subtasks || []), newSub]
    }));
    setSubtaskInput('');
  };

  if (!task) return null;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#f8f9fa' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.headerBtn}>Hủy</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết</Text>
        <TouchableOpacity onPress={handleSave}><Text style={[styles.headerBtn, { color: '#007AFF', fontWeight: 'bold' }]}>Lưu</Text></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 15 }} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.row}>
            <TouchableOpacity onPress={() => setTask({ ...task, completed: !task.completed })}>
              <Ionicons name={task.completed ? "checkmark-circle" : "ellipse-outline"} size={28} color={task.completed ? "#34C759" : "#ccc"} />
            </TouchableOpacity>
            <TextInput style={[styles.titleInput, task.completed && styles.completedText]} value={task.title} onChangeText={t => setTask({ ...task, title: t })} multiline />
          </View>
          <View style={styles.divider} />
          {task.subtasks.map(sub => (
            <View key={sub.id} style={styles.subtaskRow}>
              <TouchableOpacity onPress={() => {
                const updated = task.subtasks.map(s => s.id === sub.id ? { ...s, completed: !s.completed } : s);
                setTask({ ...task, subtasks: updated });
              }}>
                <Ionicons name={sub.completed ? "checkmark-circle" : "ellipse-outline"} size={22} color={sub.completed ? "#34C759" : "#aaa"} />
              </TouchableOpacity>
              <Text style={[styles.subtaskText, sub.completed && styles.completedText]}>{sub.title}</Text>
              <TouchableOpacity onPress={() => setTask({ ...task, subtasks: task.subtasks.filter(s => s.id !== sub.id) })}><Ionicons name="close-circle-outline" size={20} color="#ff4d4f" /></TouchableOpacity>
            </View>
          ))}
          <View style={styles.inputWrapperSub}>
            <Ionicons name="add" size={24} color="#007AFF" />
            <TextInput placeholder="Thêm bước con..." style={styles.addInput} value={subtaskInput} onChangeText={setSubtaskInput} onSubmitEditing={addSubtask} />
          </View>
        </View>

        <View style={styles.card}>
          <TouchableOpacity style={styles.optRow} onPress={() => setShowDatePicker(true)}>
            <Ionicons name="calendar-outline" size={22} color={task.dueDate ? "#007AFF" : "#666"} />
            <Text style={[styles.optText, task.dueDate && { color: '#007AFF' }]}>{task.dueDate || "Thêm ngày hạn"}</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.optRow} onPress={() => setShowTimePicker(true)}>
            <Ionicons name="notifications-outline" size={22} color={task.reminder ? "#007AFF" : "#666"} />
            <Text style={[styles.optText, task.reminder && { color: '#007AFF' }]}>{task.reminder || "Nhắc tôi"}</Text>
          </TouchableOpacity>
          <View style={styles.divider} />

          <TouchableOpacity style={styles.optRow} onPress={() => setShowRepeatMenu(true)}>
            <Ionicons name="repeat-outline" size={22} color={task.repeat ? "#007AFF" : "#666"} />
            <Text style={[styles.optText, task.repeat && { color: '#007AFF' }]}>{task.repeat || "Lặp lại"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <TextInput placeholder="Thêm ghi chú..." multiline style={styles.notes} value={task.notes || ''} onChangeText={t => setTask({ ...task, notes: t })} textAlignVertical="top" />
        </View>
      </ScrollView>

      <Modal visible={showRepeatMenu} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowRepeatMenu(false)}>
          <View style={styles.menuContent}>
            <Text style={styles.modalHeader}>Tần suất lặp lại</Text>
            {["Hàng ngày", "Hàng tuần", "Hàng tháng", "Hàng năm"].map(opt => (
              <TouchableOpacity key={opt} style={styles.menuItem} onPress={() => {
                setTask({ ...task, repeat: opt });
                setShowRepeatMenu(false);
              }}>
                <Text style={styles.menuText}>{opt}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.menuItem} onPress={() => {
              setTask({ ...task, repeat: null });
              setShowRepeatMenu(false);
            }}>
              <Text style={[styles.menuText, { color: 'red' }]}>Bỏ chọn</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {showDatePicker && (<DateTimePicker value={new Date()} mode="date" display="default" onChange={(e, d) => { setShowDatePicker(false); if (d) setTask({ ...task, dueDate: `${d.getDate()}/${d.getMonth() + 1}` }); }} />)}
      {showTimePicker && (<DateTimePicker value={new Date()} mode="time" is24Hour={true} display="default" onChange={(e, d) => { setShowTimePicker(false); if (d) setTask({ ...task, reminder: `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}` }); }} />)}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, height: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  headerBtn: { fontSize: 16, color: '#666' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15 },
  row: { flexDirection: 'row', alignItems: 'center' },
  titleInput: { fontSize: 20, fontWeight: 'bold', marginLeft: 15, flex: 1, color: '#333' },
  completedText: { textDecorationLine: 'line-through', color: '#aaa' },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 15 },
  subtaskRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  subtaskText: { fontSize: 16, marginLeft: 12, color: '#444', flex: 1 },
  inputWrapperSub: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', padding: 10, borderRadius: 8, marginTop: 10 },
  addInput: { flex: 1, marginLeft: 10, color: '#007AFF', fontSize: 16 },
  optRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  optText: { marginLeft: 15, fontSize: 16, color: '#444' },
  notes: { minHeight: 120, fontSize: 16, backgroundColor: '#f9f9f9', borderRadius: 8, padding: 10 },
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  menuContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  modalHeader: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  menuItem: { paddingVertical: 15, borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0' },
  menuText: { fontSize: 16, textAlign: 'center' },
});
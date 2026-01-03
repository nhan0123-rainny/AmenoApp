import { useRouter } from 'expo-router';
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { auth, db } from '../../services/firebaseConfig';
import { TaskService } from '../../services/taskService';

import Customheader from '../../components/Customheader';
import Taskitem from '../../components/Taskitem';

export default function ImportantScreen() {
  const router = useRouter();
  const [importantTasks, setImportantTasks] = useState([]);
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, "users", userId, "tasks"), where("important", "==", true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setImportantTasks(data);
    });
    return () => unsubscribe();
  }, [userId]);

  return (
    <View style={styles.container}>
      <Customheader 
        title="Quan trọng" 
        color="#f87171" 
        onBack={() => router.back()} 
      />

      <FlatList
        data={importantTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Taskitem 
            item={item}
            color="#f87171"
            onToggleComplete={(i) => TaskService.updateTask(userId, i.id, { completed: !i.completed })}
            onToggleImportant={(i) => TaskService.updateTask(userId, i.id, { important: !i.important })}
            onDelete={(id) => TaskService.deleteTask(userId, id)}
            onPress={() => router.push({ pathname: `/task/${item.id}`, params: { listId: item.listId } })}
          />
        )}
        contentContainerStyle={{ padding: 20 }}
        ListEmptyComponent={<Text style={styles.empty}>Chưa có tác vụ quan trọng nào</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  empty: { textAlign: 'center', marginTop: 50, color: '#ccc', fontSize: 16 }
});
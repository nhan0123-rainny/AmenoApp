import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, getDocs, query } from "firebase/firestore";
import { useState } from 'react';
import { FlatList, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Taskitem from '../../components/Taskitem';
import { auth, db } from '../../services/firebaseConfig';
import { TaskService } from '../../services/taskService';

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const userId = auth.currentUser?.uid;

  const performSearch = async (text) => {
    setSearchQuery(text);
    if (!text.trim() || !userId) {
      setResults([]);
      return;
    }

    try {
      const q = query(collection(db, "users", userId, "tasks"));
      const querySnapshot = await getDocs(q);
      const allTasks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const filtered = allTasks.filter(t => 
        t.title.toLowerCase().includes(text.toLowerCase())
      );
      setResults(filtered);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#007AFF" />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#888" />
          <TextInput
            placeholder="Tìm kiếm tác vụ..."
            style={styles.input}
            value={searchQuery}
            onChangeText={performSearch}
            autoFocus
          />
        </View>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Taskitem 
            item={item}
            onToggleComplete={(i) => TaskService.updateTask(userId, i.id, { completed: !i.completed })}
            onToggleImportant={(i) => TaskService.updateTask(userId, i.id, { important: !i.important })}
            onDelete={(id) => TaskService.deleteTask(userId, id)}
            onPress={() => { Keyboard.dismiss(); router.push({ pathname: `/task/${item.id}` }); }}
          />
        )}
        contentContainerStyle={{ padding: 20 }}
        ListEmptyComponent={searchQuery.length > 0 && <Text style={styles.emptyText}>Không tìm thấy kết quả</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  backBtn: { marginRight: 10 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f3f5', borderRadius: 10, paddingHorizontal: 12, height: 45 },
  input: { flex: 1, marginLeft: 8, fontSize: 16 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' }
});
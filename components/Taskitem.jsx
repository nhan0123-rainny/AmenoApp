import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Taskitem({ item, color, onToggleComplete, onToggleImportant, onDelete, onPress }) {
  return (
    <View style={styles.cardContainer}>
      <TouchableOpacity style={styles.taskMain} onPress={onPress}>
        <TouchableOpacity onPress={() => onToggleComplete(item)}>
          <Ionicons 
            name={item.completed ? "checkmark-circle" : "ellipse-outline"} 
            size={26} 
            color={item.completed ? "#34d399" : "#ccc"} 
          />
        </TouchableOpacity>

        <View style={styles.textWrapper}>
          <Text style={[styles.taskText, item.completed && styles.completedText]}>
            {item.title}
          </Text>
          
          <View style={styles.badgeRow}>
            <Text style={[styles.badgeText, { fontWeight: 'bold', color: color || '#818cf8' }]}>
              {item.listName || 'Tác vụ'}
            </Text>

            {item.dueDate && (
              <View style={styles.badgeItem}>
                <Text style={styles.dot}> • </Text>
                <Ionicons name="calendar-outline" size={12} color="#888" />
                <Text style={styles.badgeText}> {item.dueDate}</Text>
              </View>
            )}
            
            {item.reminder && (
              <View style={styles.badgeItem}>
                <Text style={styles.dot}> • </Text>
                <Ionicons name="notifications-outline" size={12} color="#888" />
                <Text style={styles.badgeText}> {item.reminder}</Text>
              </View>
            )}

            {item.repeat && (
              <View style={styles.badgeItem}>
                <Text style={styles.dot}> • </Text>
                <Ionicons name="repeat-outline" size={12} color="#888" />
                <Text style={styles.badgeText}> {item.repeat}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.rightActions}>
        <TouchableOpacity onPress={() => onToggleImportant(item)}>
          <Ionicons 
            name={item.important ? "star" : "star-outline"} 
            size={24} 
            color={item.important ? "#f1c40f" : "#ccc"} 
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(item.id)} style={{ marginLeft: 15 }}>
          <Ionicons name="trash-outline" size={20} color="#ff4d4f" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', padding: 15, borderRadius: 15, marginBottom: 12 },
  taskMain: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  textWrapper: { marginLeft: 12, flex: 1 },
  taskText: { fontSize: 17, color: '#333' },
  completedText: { textDecorationLine: 'line-through', color: '#aaa' },
  badgeRow: { flexDirection: 'row', marginTop: 5, flexWrap: 'wrap', alignItems: 'center' },
  badgeItem: { flexDirection: 'row', alignItems: 'center' },
  badgeText: { fontSize: 11, color: '#888' },
  dot: { fontSize: 11, color: '#888' },
  rightActions: { flexDirection: 'row', alignItems: 'center' },
});
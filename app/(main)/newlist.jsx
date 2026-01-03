import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Customheader from '../../components/Customheader';

const COLORS = ['#818cf8', '#60a5fa', '#f87171', '#34d399', '#fbbf24', '#a78bfa', '#ec4899', '#14b8a6'];
const ICONS = ['list-outline', 'cart-outline', 'star-outline', 'book-outline', 'airplane-outline', 'gift-outline', 'briefcase-outline', 'fitness-outline'];

export default function NewListScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState('#818cf8');
  const [selectedIcon, setSelectedIcon] = useState('list-outline');

  const handleCreate = async () => {
    if (!title.trim()) return;
    const newList = { 
      id: `list_${Date.now()}`, 
      title: title.trim(), 
      icon: selectedIcon, 
      color: selectedColor 
    };
    const existing = await AsyncStorage.getItem('@custom_lists');
    const listArray = existing ? JSON.parse(existing) : [];
    await AsyncStorage.setItem('@custom_lists', JSON.stringify([...listArray, newList]));
    router.back(); 
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Customheader 
        title="Tạo danh sách" 
        onBack={() => router.back()}
        rightComponent={
          <TouchableOpacity onPress={handleCreate} disabled={!title.trim()}>
            <Text style={[styles.done, { color: title.trim() ? selectedColor : '#ccc' }]}>Xong</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inputSection}>
          <View style={[styles.iconPreview, { backgroundColor: selectedColor + '15' }]}>
            <Ionicons name={selectedIcon} size={32} color={selectedColor} />
          </View>
          <TextInput
            placeholder="Tên danh sách"
            placeholderTextColor="#aaa"
            style={[styles.input, { borderBottomColor: selectedColor }]}
            autoFocus
            value={title}
            onChangeText={setTitle}
            maxLength={25}
          />
        </View>

        <Text style={styles.label}>Màu sắc</Text>
        <View style={styles.pickerGrid}>
          {COLORS.map(color => (
            <TouchableOpacity 
              key={color}
              onPress={() => setSelectedColor(color)}
              style={[
                styles.colorDot, 
                { backgroundColor: color },
                selectedColor === color && styles.activeBorder
              ]}
            />
          ))}
        </View>

        <Text style={styles.label}>Biểu tượng</Text>
        <View style={styles.pickerGrid}>
          {ICONS.map(icon => (
            <TouchableOpacity 
              key={icon}
              onPress={() => setSelectedIcon(icon)}
              style={[
                styles.iconBox,
                selectedIcon === icon ? { backgroundColor: selectedColor + '15', borderColor: selectedColor } : null
              ]}
            >
              <Ionicons name={icon} size={24} color={selectedIcon === icon ? selectedColor : '#888'} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 25 },
  done: { fontSize: 17, fontWeight: 'bold', paddingRight: 5 },
  inputSection: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 40,
    marginTop: 10 
  },
  iconPreview: { 
    width: 60, 
    height: 60, 
    borderRadius: 15, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 20 
  },
  input: { 
    flex: 1,
    fontSize: 22, 
    fontWeight: '600', 
    borderBottomWidth: 2,
    paddingVertical: 8,
    color: '#333'
  },
  label: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#666', 
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  pickerGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 12, 
    marginBottom: 35 
  },
  colorDot: { 
    width: 38, 
    height: 38, 
    borderRadius: 19,
    borderWidth: 3,
    borderColor: 'transparent'
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: 'transparent'
  },
  activeBorder: {
    borderColor: '#e0e0e0',
    transform: [{ scale: 1.1 }]
  }
});
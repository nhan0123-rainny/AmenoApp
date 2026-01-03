import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Customheader({ title, color, onBack, rightComponent }) {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.header, { paddingTop: insets.top, backgroundColor: color || '#818cf8' }]}>
      <TouchableOpacity onPress={onBack}>
        <Ionicons name="chevron-back" size={28} color="white" />
      </TouchableOpacity>
      
      <Text style={styles.headerTitle}>{title}</Text>
      
      <View style={styles.rightPart}>
        {rightComponent}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 20, 
    paddingBottom: 20,
    height: 100 
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: 'white' },
  rightPart: { width: 28, alignItems: 'center' }
});
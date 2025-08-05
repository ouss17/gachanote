import { GACHAS } from '@/data/gachas';
import { toggleTheme } from '@/redux/slices/themeSlice';
import { RootState } from '@/redux/store';
import { useRouter } from 'expo-router';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

export default function HomeScreen() {
  const router = useRouter();
  const theme = useSelector((state: RootState) => state.theme.mode);
  const dispatch = useDispatch();
  const isDark = theme === 'dark';

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: isDark ? '#181818' : '#fff' }}>
      <Text style={[styles.title, { color: isDark ? '#fff' : '#181818' }]}>Gachanote</Text>
      <TouchableOpacity
        onPress={() => dispatch(toggleTheme())}
        style={{
          alignSelf: 'flex-end',
          marginBottom: 16,
          padding: 8,
          borderRadius: 8,
          backgroundColor: isDark ? '#333' : '#eee',
        }}
      >
        <Text style={{ color: isDark ? '#fff' : '#181818' }}>
          {isDark ? 'Mode clair' : 'Mode sombre'}
        </Text>
      </TouchableOpacity>
      <FlatList
        data={GACHAS}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.gachaItem,
              {
                backgroundColor: isDark ? '#232323' : '#fff',
                borderColor: isDark ? '#333' : '#ccc',
              },
            ]}
            onPress={() => router.push(`/gacha/${item.id}`)}
          >
            <Image source={item.logo} style={styles.logo} />
            <Text style={[styles.gachaName, { color: isDark ? '#fff' : '#181818' }]}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  gachaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
  },
  logo: { 
    width: 72,
    height: 72,
    marginRight: 20,
    borderRadius: 12,
  },
  gachaName: { fontSize: 20 },
});

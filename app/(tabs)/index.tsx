import { GACHAS } from '@/data/gachas';
import { toggleTheme } from '@/redux/slices/themeSlice';
import { RootState } from '@/redux/store';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

export default function HomeScreen() {
  const router = useRouter();
  const theme = useSelector((state: RootState) => state.theme.mode);
  const dispatch = useDispatch();
  const isDark = theme === 'dark';

  const [search, setSearch] = useState('');

  // Filtrage des gachas selon la recherche (insensible à la casse)
  const filteredGachas = GACHAS.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#181818' : '#fff' }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
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

      {/* Champ de recherche */}
      <TextInput
        placeholder="Rechercher un gacha..."
        placeholderTextColor={isDark ? '#aaa' : '#888'}
        value={search}
        onChangeText={setSearch}
        style={{
          backgroundColor: isDark ? '#232323' : '#f2f2f2',
          color: isDark ? '#fff' : '#181818',
          borderRadius: 8,
          padding: 10,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: isDark ? '#333' : '#ccc',
        }}
      />

      <FlatList
        data={filteredGachas}
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
            <Image source={item.logo} style={[styles.logo, {
              backgroundColor: isDark ? "transparent" : 'gray',
            }]} resizeMode='contain' />
            <Text style={[styles.gachaName, { color: isDark ? '#fff' : '#181818' }]}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
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
    width: 100,
    height: 72,
    marginRight: 20,
    borderRadius: 12,
  },
  gachaName: { fontSize: 20 },
});

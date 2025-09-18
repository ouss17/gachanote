import { GACHAS } from '@/data/gachas';
import { setNationality } from '@/redux/slices/nationalitySlice';
import { setOnboardingSeen } from '@/redux/slices/onboardingSlice';
import { toggleTheme } from '@/redux/slices/themeSlice';
import { RootState } from '@/redux/store';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import DemoScreen from '../DemoScreen';

/**
 * Écran d'accueil principal de l'application.
 * Permet de sélectionner la nationalité, de changer le thème, de rechercher un gacha
 * et d'accéder à la démo si l'utilisateur ne l'a pas encore vue.
 */
export default function HomeScreen() {
  const router = useRouter();
  const theme = useSelector((state: RootState) => state.theme.mode);
  const dispatch = useDispatch();
  const isDark = theme === 'dark';

  const [search, setSearch] = useState('');
  const [showSelect, setShowSelect] = useState(false);

  // Filtrage des gachas selon la recherche (insensible à la casse)
  const filteredGachas = GACHAS.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  const nationality = useSelector((state: RootState) => state.nationality);

  // Liste des nationalités disponibles avec leurs drapeaux et devises
  const flags = [
    { country: 'fr', currency: '€', label: 'France', icon: require('@/assets/flags/fr.png') },
    { country: 'us', currency: '$', label: 'USA', icon: require('@/assets/flags/us.png') },
    { country: 'jp', currency: '¥', label: 'Japon', icon: require('@/assets/flags/jp.png') },
    // Ajoute d'autres pays si besoin
  ];

  // Affiche la démo si l'utilisateur ne l'a pas encore vue
  const onboardingSeen = useSelector((state: RootState) => state.onboarding.seen);
  if (!onboardingSeen) {
    return <DemoScreen onFinish={() => dispatch(setOnboardingSeen())} />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#181818' : '#fff' }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Titre principal */}
      <Text style={[styles.title, { color: isDark ? '#fff' : '#181818', marginTop: 8 }]}>
        Gachanote
      </Text>

      {/* Sélecteur de nationalité et bouton de thème */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        {/* Sélecteur de nationalité */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: isDark ? '#333' : '#ccc',
              borderRadius: 8,
              paddingHorizontal: 8,
              paddingVertical: 4,
              backgroundColor: isDark ? '#232323' : '#fff',
            }}
            onPress={() => setShowSelect(true)}
          >
            <Image
              source={flags.find(f => f.country === nationality.country)?.icon}
              style={{ width: 32, height: 24, borderRadius: 6, marginRight: 8 }}
            />
            <Text style={{ color: isDark ? '#fff' : '#181818' }}>
              {flags.find(f => f.country === nationality.country)?.label}
            </Text>
          </TouchableOpacity>
        </View>
        {/* Bouton mode sombre/clair à droite */}
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <TouchableOpacity
            onPress={() => dispatch(toggleTheme())}
            style={{
              padding: 8,
              borderRadius: 8,
              backgroundColor: isDark ? '#333' : '#eee',
            }}
          >
            {isDark ? (
              <Feather name="sun" size={24} color="#FFD700" />
            ) : (
              <Feather name="moon" size={24} color="#181818" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal pour sélectionner la nationalité */}
      {showSelect && (
        <View style={{
          position: 'absolute',
          top: 60,
          left: 20,
          right: 20,
          backgroundColor: isDark ? '#232323' : '#fff',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: isDark ? '#333' : '#ccc',
          zIndex: 100,
          padding: 16,
        }}>
          {flags.map(flag => (
            <TouchableOpacity
              key={flag.country}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 8,
              }}
              onPress={() => {
                dispatch(setNationality({ country: flag.country, currency: flag.currency }));
                setShowSelect(false);
              }}
            >
              <Image source={flag.icon} style={{ width: 32, height: 24, borderRadius: 6, marginRight: 8 }} />
              <Text style={{ color: isDark ? '#fff' : '#181818' }}>{flag.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Champ de recherche pour filtrer les gachas */}
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

      {/* Liste des gachas filtrés */}
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

/**
 * Styles pour l'écran d'accueil.
 */
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

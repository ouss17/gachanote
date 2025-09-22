import { GACHAS } from '@/data/gachas';
import { setOnboardingSeen } from '@/redux/slices/onboardingSlice';
import { RootState } from '@/redux/store';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
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

  const fontSize = useSelector((state: RootState) => state.settings.fontSize);

  function getFontSize(base: number) {
    if (fontSize === 'small') return base * 0.85;
    if (fontSize === 'large') return base * 1.25;
    return base;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#181818' : '#fff' }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Titre principal */}
      <Text style={[styles.title, { color: isDark ? '#fff' : '#181818', marginTop: 8, fontSize: getFontSize(32) }]}>
        Gachanote
      </Text>

    
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
          fontSize: getFontSize(16), // ← adapte la taille du texte ici
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
            <Text style={{ color: isDark ? '#fff' : '#181818', fontSize: getFontSize(20) }}>
              {item.name}
            </Text>
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

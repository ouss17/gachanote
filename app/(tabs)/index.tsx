import { Theme } from '@/constants/Themes';
import { GACHAS } from '@/data/gachas';
import { setOnboardingSeen } from '@/redux/slices/onboardingSlice';
import { RootState } from '@/redux/store';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import DemoScreen from '../DemoScreen';

export default function HomeScreen() {
  const router = useRouter();
  const theme = useSelector((state: RootState) => state.theme.mode);
  const dispatch = useDispatch();
  const isDark = theme === 'dark';
  const colors =
    theme === 'night'
      ? Theme.night
      : theme === 'dark'
        ? Theme.dark
        : Theme.light;

  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const STORAGE_KEY = '@gachanote:favorites';

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const arr: string[] = JSON.parse(raw);
          setFavorites(new Set(arr));
        }
      } catch (e) {
      }
    })();
  }, []);

  const toggleFavorite = async (id: string) => {
    const next = new Set(favorites);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setFavorites(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
    } catch (e) {
    }
  };

  const filteredGachas = GACHAS.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()) || g.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
  );

  const displayedGachas = showOnlyFavorites ? filteredGachas.filter(g => favorites.has(g.id)) : filteredGachas;

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

  // traduction & accessibilité
  const lang = useSelector((state: any) => state.nationality?.country) || 'fr';
  const texts = require('@/data/texts.json');
  const t = (key: string) => texts[key]?.[lang] || texts[key]?.fr || key;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Titre principal */}
      {/* <Text
        style={[styles.title, { color: colors.text, fontSize: getFontSize(32) }]}
        accessible={true}
        accessibilityRole="header"
        accessibilityLabel={t('navBar.home')}
      >
        {t('navBar.home')}
      </Text> */}
      {/* Logo (petit) */}
      <Image
        source={theme === 'light' ? require('@/assets/images/icon_full.png') : require('@/assets/images/icone.png')}
        style={{ width: 115, height: 115, alignSelf: 'center', marginBottom: 5, borderRadius: 20 }}
        accessible={true}
        accessibilityRole="image"
        accessibilityLabel={t('navBar.home')}
      />

      {/* Champ de recherche + filtre favoris */}
      <View style={[
        styles.searchContainer,
        { backgroundColor: colors.surface, borderColor: colors.border }
      ]}>
        <Ionicons name="search-outline" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          placeholder={t('home.searchPlaceholder')}
          placeholderTextColor={colors.placeholder}
          value={search}
          onChangeText={setSearch}
          style={[
            styles.searchInput,
            {
              color: colors.text,
              fontSize: getFontSize(16),
            },
          ]}
          accessible={true}
          accessibilityLabel={t('home.searchPlaceholder')}
          accessibilityHint={t('simulationsTab.searchPlaceholder')}
        />
        {search.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearch('')}
            accessibilityLabel={t('common.reset')}
            accessibilityRole="button"
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} style={styles.clearIcon} />
          </TouchableOpacity>
        )}
        {/* favorites filter toggle */}
        <TouchableOpacity
          onPress={() => setShowOnlyFavorites(s => !s)}
          accessibilityRole="button"
          accessibilityLabel={showOnlyFavorites ? t('home.showAll') || 'Show all' : t('home.showFavorites') || 'Show favorites'}
          style={{ marginLeft: 8, padding: 6 }}
        >
          <Ionicons name={showOnlyFavorites ? 'star' : 'star-outline'} size={22} color={showOnlyFavorites ? colors.primary : colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayedGachas}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.gachaItem,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={() => router.push(`/gacha/${item.id}`)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={item.name}
            accessibilityHint={`${t('demo.selectGacha.title')} — ${item.name}`}
          >
            {/* zone logo avec fond violet */}
            <View style={styles.logoContainer}>
              <Image
                source={item.logo}
                style={styles.logo}
                resizeMode="contain"
                accessible={true}
                accessibilityRole="image"
                accessibilityLabel={`${item.name} logo`}
              />
            </View>

            {/* zone titre / infos */}
            <View style={styles.infoContainer}>
              <Text style={[styles.gachaName, { color: colors.text, fontSize: getFontSize(20) }]}>
                {item.name}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => toggleFavorite(item.id)}
              accessibilityRole="button"
              accessibilityLabel={favorites.has(item.id) ? t('home.unfavorite') || 'Remove favorite' : t('home.favorite') || 'Add favorite'}
              style={styles.starButton}
            >
              <Ionicons name={favorites.has(item.id) ? 'star' : 'star-outline'} size={22} color={favorites.has(item.id) ? colors.primary : colors.textSecondary} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 6,
    marginBottom: 16,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  gachaItem: {
    flexDirection: 'row',
    alignItems: 'stretch',
    height: 88,
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  logoContainer: {
    width: 88,
    backgroundColor: '#2d166398',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    padding: 6, 
  },
  logo: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  infoContainer: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: 14,
    paddingLeft: 12,
    justifyContent: 'center',
  },
  gachaName: {
    fontWeight: '600',
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
    borderRadius: 20,
  },
  clearIcon: {
  },
  starButton: {
    position: 'absolute',
    top: 3,
    right: 6,
    padding: 6,
    borderRadius: 20,
  },
});

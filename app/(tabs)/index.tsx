import { Theme } from '@/constants/Themes';
import { GACHAS } from '@/data/gachas';
import { setOnboardingSeen } from '@/redux/slices/onboardingSlice';
import { RootState } from '@/redux/store';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
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

  const filteredGachas = GACHAS.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

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
      <Text
        style={[styles.title, { color: colors.text, fontSize: getFontSize(32) }]}
        accessible={true}
        accessibilityRole="header"
        accessibilityLabel={t('navBar.home')}
      >
        {t('navBar.home')}
      </Text>

      {/* Champ de recherche */}
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
          accessibilityHint={t('simulationsTab.searchPlaceholder') /* closest hint available */ }
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
      </View>

      {/* Liste des gachas filtrés */}
      <FlatList
        data={filteredGachas}
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
            <Image source={item.logo} style={styles.logo} resizeMode="contain" />
            <Text style={[styles.gachaName, { color: colors.text, fontSize: getFontSize(20) }]}>
              {item.name}
            </Text>
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
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 12,
  },
  logo: {
    width: 80,
    height: 60,
    marginRight: 16,
    borderRadius: 12,
    backgroundColor: 'transparent',
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
    // optional adjustments
  },
});

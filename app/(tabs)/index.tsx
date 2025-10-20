import { Theme } from '@/constants/Themes';
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

  // translation (like other screens)
  const lang = useSelector((state: any) => state.nationality?.country) || 'fr';
  const texts = require('@/data/texts.json');
  const t = (key: string) => texts[key]?.[lang] || texts[key]?.fr || key;

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

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      accessible={true}
      accessibilityLabel="Home screen"
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Titre principal */}
      <Text
        style={[styles.title, { color: colors.text, fontSize: getFontSize(32) }]}
        accessibilityRole="header"
        accessible={true}
        accessibilityLabel="Gachanote"
      >
        Gachanote
      </Text>

      {/* Champ de recherche */}
      <TextInput
        placeholder={t('home.searchPlaceholder')}
        placeholderTextColor={colors.placeholder}
        value={search}
        onChangeText={setSearch}
        style={[
          styles.searchInput,
          {
            backgroundColor: colors.surface,
            color: colors.text,
            borderColor: colors.border,
            fontSize: getFontSize(16),
          },
        ]}
        accessible={true}
        accessibilityLabel={t('home.searchPlaceholder')}
        accessibilityHint="Filter the list of gachas by name"
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
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={() => router.push(`/gacha/${item.id}`)}
            accessibilityRole="button"
            accessible={true}
            accessibilityLabel={`Open ${item.name}`}
            accessibilityHint={`Open the ${item.name} gacha details`}
          >
            <Image
              source={item.logo}
              style={styles.logo}
              resizeMode="contain"
              accessible={true}
              accessibilityLabel={`${item.name} logo`}
            />
            <Text
              style={[styles.gachaName, { color: colors.text, fontSize: getFontSize(20) }]}
              accessible={false}
            >
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
  searchInput: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
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
});

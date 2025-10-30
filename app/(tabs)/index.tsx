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
    g.name.toLowerCase().includes(search.toLowerCase()) || g.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
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
          accessibilityHint={t('simulationsTab.searchPlaceholder') /* closest hint available */}
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
  // item container: no internal padding so left logo area can span full height
  gachaItem: {
    flexDirection: 'row',
    alignItems: 'stretch',
    height: 88,
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden', // ensure left bg doesn't overflow rounded corners
  },
  // left "logo" area that fills the item height
  logoContainer: {
    width: 88,
    backgroundColor: '#2d166398',
    alignItems: 'center',
    justifyContent: 'center',
    // round only left corners to match item's radius
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    padding: 6, // small padding around the image
  },
  // image is centered inside logoContainer and sized with percentages so bg is visible
  logo: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  // right area contains title / info and provides padding
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
    // optional adjustments
  },
});

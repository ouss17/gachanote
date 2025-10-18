import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import Onboarding from 'react-native-onboarding-swiper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DEMO_LANG_KEY = 'demo_language';

/**
 * Composant d'onboarding/démo affiché au premier lancement de l'application.
 * Présente les principales fonctionnalités de Gachanote à l'utilisateur.
 *
 * @param onFinish Fonction appelée à la fin ou lors du skip de la démo.
 */
export default function DemoScreen({ onFinish }: { onFinish: () => void }) {
  const insets = useSafeAreaInsets();

  const [lang, setLang] = useState<'en' | 'fr' | 'jp'>('fr');
  const texts = require('@/data/texts.json');
  const t = (key: string) => texts[key]?.[lang] || texts[key]?.fr || key;

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(DEMO_LANG_KEY);
        if (saved === 'en' || saved === 'fr' || saved === 'jp') setLang(saved);
      } catch (e) { /* ignore */ }
    })();
  }, []);

  const onChangeLang = async (next: 'en' | 'fr' | 'jp') => {
    setLang(next);
    try { await AsyncStorage.setItem(DEMO_LANG_KEY, next); } catch (e) { /* ignore */ }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Language selector */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', padding: 12, marginTop: insets.top }}>
        {(['fr','en','jp'] as const).map(code => (
          <TouchableOpacity
            key={code}
            onPress={() => onChangeLang(code)}
            style={{
              marginHorizontal: 8,
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 20,
              backgroundColor: lang === code ? '#6C4BFF' : '#EEE'
            }}
          >
            <Text style={{ color: lang === code ? '#fff' : '#333', fontWeight: '600' }}>
              {code.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Onboarding
        onDone={onFinish}
        onSkip={onFinish}
        bottomBarHighlight={false}
        containerStyles={{ flex: 1 }}
        bottomBarColor="#fff"
        bottomBarHeight={72 + insets.bottom}
        pages={[
          {
            backgroundColor: '#fff',
            image: <Image source={require('@/assets/images/icon.png')} style={{ width: 120, height: 120 }} />,
            title: t('demo.welcome.title'),
            subtitle: t('demo.welcome.subtitle'),
          },
          {
            backgroundColor: '#fff',
            image: <Image source={require('@/assets/demo/accueilv2.jpg')} style={{ width: 220, height: 400, borderRadius: 16 }} />,
            title: t('demo.selectGacha.title'),
            subtitle: t('demo.selectGacha.subtitle'),
          },
          {
            backgroundColor: '#fff',
            image: <Image source={require('@/assets/demo/rollsv2.jpg')} style={{ width: 220, height: 400, borderRadius: 16 }} />,
            title: t('demo.gachaDetail.title'),
            subtitle: t('demo.gachaDetail.subtitle'),
          },
          {
            backgroundColor: '#fff',
            image: <Image source={require('@/assets/demo/form_rolls.jpg')} style={{ width: 220, height: 400, borderRadius: 16 }} />,
            title: t('demo.addRoll.title'),
            subtitle: t('demo.addRoll.subtitle'),
          },
          {
            backgroundColor: '#fff',
            image: <Image source={require('@/assets/demo/rolls_result.jpg')} style={{ width: 220, height: 400, borderRadius: 16 }} />,
            title: t('demo.savedResults.title'),
            subtitle: t('demo.savedResults.subtitle'),
          },

          // Simulation pages
          {
            backgroundColor: '#fff',
            image: <Image source={require('@/assets/demo/simulationsv2.jpg')} style={{ width: 220, height: 400, borderRadius: 16 }} />,
            title: t('demo.simulations.title'),
            subtitle: t('demo.simulations.subtitle'),
          },
          {
            backgroundColor: '#fff',
            image: <Image source={require('@/assets/demo/simulation_form.jpg')} style={{ width: 220, height: 400, borderRadius: 16 }} />,
            title: t('demo.simulationForm.title'),
            subtitle: t('demo.simulationForm.subtitle'),
          },
          {
            backgroundColor: '#fff',
            image: <Image source={require('@/assets/demo/simulation_result.jpg')} style={{ width: 220, height: 400, borderRadius: 16 }} />,
            title: t('demo.simulationResult.title'),
            subtitle: t('demo.simulationResult.subtitle'),
          },

          {
            backgroundColor: '#fff',
            image: <Image source={require('@/assets/demo/moneyv2.jpg')} style={{ width: 220, height: 400, borderRadius: 16 }} />,
            title: t('demo.moneyTab.title'),
            subtitle: t('demo.moneyTab.subtitle'),
          },
          {
            backgroundColor: '#fff',
            image: <Image source={require('@/assets/demo/detail_4v2.jpg')} style={{ width: 220, height: 400, borderRadius: 16 }} />,
            title: t('demo.gachaStats.title'),
            subtitle: t('demo.gachaStats.subtitle'),
          },
          {
            backgroundColor: '#fff',
            image: <Image source={require('@/assets/demo/statsv2.jpg')} style={{ width: 220, height: 400, borderRadius: 16 }} />,
            title: t('demo.globalStats.title'),
            subtitle: t('demo.globalStats.subtitle'),
          },

          // Settings page
          {
            backgroundColor: '#fff',
            image: <Image source={require('@/assets/demo/settingsv2.jpg')} style={{ width: 220, height: 420, borderRadius: 16 }} />,
            title: t('demo.settings.title'),
            subtitle: t('demo.settings.subtitle'),
          },
        ]}
      />
    </View>
  );
}
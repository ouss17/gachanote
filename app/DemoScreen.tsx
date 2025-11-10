import { setNationality } from '@/redux/slices/nationalitySlice';
import { RootState } from '@/redux/store';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import Onboarding from 'react-native-onboarding-swiper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

// Demo uses app nationalitySlice for language selection
export default function DemoScreen({ onFinish }: { onFinish: () => void }) {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const lang = useSelector((s: RootState) => s.nationality.country) || 'fr';
  const texts = require('@/data/texts.json');
  const t = (key: string) => texts[key]?.[lang] || texts[key]?.fr || key;
  // style commun pour remonter les images
  const imageStyleLarge = { width: 220, height: 400, borderRadius: 16, marginTop: -28 };
  const imageStyleTall = { width: 220, height: 420, borderRadius: 16, marginTop: -28 };

  const onChangeLang = (next: 'en' | 'fr' | 'jp') => {
    dispatch(setNationality({ country: next }));
  };

  return (
    <View
      style={{ flex: 1, backgroundColor: '#fff' }}
      accessible={true}
      accessibilityLabel={t('settings.general.title') || 'Demo onboarding'}
    >
      {/* Language selector (uses nationalitySlice) */}
      <View
        style={{ flexDirection: 'row', justifyContent: 'center', padding: 12, marginTop: insets.top }}
        accessible={true}
        accessibilityLabel={t('settings.language')}
      >
        {(['fr','en','jp'] as const).map(code => (
          <TouchableOpacity
            key={code}
            accessibilityRole="button"
            accessible={true}
            accessibilityLabel={`${t('settings.language')} ${code.toUpperCase()}`}
            accessibilityState={{ selected: lang === code }}
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
        // remonte le contenu (image + texte) vers le haut
        containerStyles={{ flex: 1, justifyContent: 'flex-start', paddingTop: insets.top + 12 }}
        // rapproche les titres et sous-titres de l'image
        titleStyles={{ marginTop: 8 }}
        subTitleStyles={{ marginTop: 4 }}
        bottomBarColor="#fff"
        bottomBarHeight={72 + insets.bottom}
        pages={[
          {
            backgroundColor: '#fff',
            image: <Image accessible={true} accessibilityLabel={t('demo.welcome.title')} source={require('@/assets/images/icon_full.png')} style={{ width: 120, height: 120, marginTop: -12 }} />,
            title: t('demo.welcome.title'),
            subtitle: t('demo.welcome.subtitle'),
          },
          {
            backgroundColor: '#fff',
            image: <Image accessible={true} accessibilityLabel={t('demo.selectGacha.title')} source={require('@/assets/demo/accueilv2.jpg')} style={imageStyleLarge} />,
            title: t('demo.selectGacha.title'),
            subtitle: t('demo.selectGacha.subtitle'),
          },
          {
            backgroundColor: '#fff',
            image: <Image accessible={true} accessibilityLabel={t('demo.gachaDetail.title')} source={require('@/assets/demo/rollsv2.jpg')} style={imageStyleLarge} />,
            title: t('demo.gachaDetail.title'),
            subtitle: t('demo.gachaDetail.subtitle'),
          },
          {
            backgroundColor: '#fff',
            image: <Image accessible={true} accessibilityLabel={t('demo.addRoll.title')} source={require('@/assets/demo/form_rolls.jpg')} style={imageStyleLarge} />,
            title: t('demo.addRoll.title'),
            subtitle: t('demo.addRoll.subtitle'),
          },
          // {
          //   backgroundColor: '#fff',
          //   image: <Image accessible={true} accessibilityLabel={t('demo.savedResults.title')} source={require('@/assets/demo/rolls_result.jpg')} style={imageStyleLarge} />,
          //   title: t('demo.savedResults.title'),
          //   subtitle: t('demo.savedResults.subtitle'),
          // },

          // Simulation pages
          // {
          //   backgroundColor: '#fff',
          //   image: <Image accessible={true} accessibilityLabel={t('demo.simulations.title')} source={require('@/assets/demo/simulationsv2.jpg')} style={imageStyleLarge} />,
          //   title: t('demo.simulations.title'),
          //   subtitle: t('demo.simulations.subtitle'),
          // },
          // {
          //   backgroundColor: '#fff',
          //   image: <Image accessible={true} accessibilityLabel={t('demo.simulationForm.title')} source={require('@/assets/demo/simulation_form.jpg')} style={imageStyleLarge} />,
          //   title: t('demo.simulationForm.title'),
          //   subtitle: t('demo.simulationForm.subtitle'),
          // },
          // {
          //   backgroundColor: '#fff',
          //   image: <Image accessible={true} accessibilityLabel={t('demo.simulationResult.title')} source={require('@/assets/demo/simulation_result.jpg')} style={imageStyleLarge} />,
          //   title: t('demo.simulationResult.title'),
          //   subtitle: t('demo.simulationResult.subtitle'),
          // },

          {
            backgroundColor: '#fff',
            image: <Image accessible={true} accessibilityLabel={t('demo.moneyTab.title')} source={require('@/assets/demo/moneyv2.jpg')} style={imageStyleLarge} />,
            title: t('demo.moneyTab.title'),
            subtitle: t('demo.moneyTab.subtitle'),
          },
          {
            backgroundColor: '#fff',
            image: <Image accessible={true} accessibilityLabel={t('demo.gachaStats.title')} source={require('@/assets/demo/detail_4v2.jpg')} style={imageStyleLarge} />,
            title: t('demo.gachaStats.title'),
            subtitle: t('demo.gachaStats.subtitle'),
          },
          {
            backgroundColor: '#fff',
            image: <Image accessible={true} accessibilityLabel={t('demo.globalStats.title')} source={require('@/assets/demo/statsv2.jpg')} style={imageStyleLarge} />,
            title: t('demo.globalStats.title'),
            subtitle: t('demo.globalStats.subtitle'),
          }

          // {
          //   backgroundColor: '#fff',
          //   image: <Image accessible={true} accessibilityLabel={t('demo.settings.title')} source={require('@/assets/demo/settingsv2.jpg')} style={imageStyleTall} />,
          //   title: t('demo.settings.title'),
          //   subtitle: t('demo.settings.subtitle'),
          // },
        ]}
      />
    </View>
  );
}
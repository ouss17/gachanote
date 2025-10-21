import ExportDataButton from '@/components/ExportDataButton';
import ExportGachaButton from '@/components/ExportGachaButton';
import { Theme } from '@/constants/Themes';
import { setDevise } from '@/redux/slices/deviseSlice';
import { addMoney, resetMoney } from '@/redux/slices/moneySlice';
import { setNationality } from '@/redux/slices/nationalitySlice';
import { setOnboardingSeen } from '@/redux/slices/onboardingSlice';
import { addRoll, resetRolls } from '@/redux/slices/rollsSlice';
import { setFontSize, setSounds, setVibrations } from '@/redux/slices/settingsSlice';
import { addBanner, addSimulationRoll, resetSimulations } from '@/redux/slices/simulationsSlice';
import { setTheme } from '@/redux/slices/themeSlice';
import { RootState } from '@/redux/store';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import React, { useState } from 'react';
import { Alert, Image, Modal, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import DemoScreen from '../DemoScreen';

const LANGUAGES = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'jp', label: '日本語' },
];

const currencies = [
  { currency: '€', label: 'Euro', symbol: '€' },
  { currency: '$', label: 'Dollar', symbol: '$' },
  { currency: '¥', label: 'Yen', symbol: '¥' },
];


const themeModes = [
  { key: 'light', icon: 'sun' }, // soleil
  { key: 'dark', icon: 'moon', style: { transform: [{ scaleX: -1 }] } }, // dark = demi-lune (miroir)
  { key: 'night', icon: 'circle' }, // night = pleine lune (cercle plein)
];

const Settings = () => {
  const dispatch = useDispatch();
  const [showDemo, setShowDemo] = useState(false);
  const theme = useSelector((state: RootState) => state.theme.mode);
  const themeColors = Theme[theme as keyof typeof Theme];
  const nationality = useSelector((state: RootState) => state.nationality.country);
  const fontSize = useSelector((state: RootState) => state.settings.fontSize);
  const sounds = useSelector((state: RootState) => state.settings.sounds);
  const vibrations = useSelector((state: RootState) => state.settings.vibrations);
  const devise = useSelector((state: RootState) => state.devise.currency);
  const rolls = useSelector((state: RootState) => state.rolls.rolls);
  const moneyEntries = useSelector((state: RootState) => state.money.entries);
  const banners = useSelector((state: RootState) => state.simulations.banners);
  const [showImportExport, setShowImportExport] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [feedbackText, setFeedbackText] = useState('');

  // Fonction utilitaire pour la taille de police
  const getFontSize = (base: number) => {
    if (fontSize === 'small') return base * 0.85;
    if (fontSize === 'large') return base * 1.25;
    return base;
  };

  // Reset data
  const handleReset = () => {
    Alert.alert(
      'Confirmation',
      'Voulez-vous vraiment réinitialiser toutes vos données ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: () => {
            dispatch(setNationality({ country: 'fr' }));
            dispatch(resetRolls());
            dispatch(resetMoney());
            dispatch(resetSimulations());
          },
        },
      ]
    );
  };

  // Export/Import (placeholders)
  const handleImportFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets?.[0]?.uri) return;

      const uri = result.assets[0].uri;
      const content = await FileSystem.readAsStringAsync(uri, { encoding: 'utf8' });
      const data = JSON.parse(content);

      // Récupère les tableaux à l'intérieur des slices
      const rollsArray = data.rolls?.rolls ?? [];
      const moneyArray = data.money?.entries ?? [];
      const simulationsArray = data.simulations?.banners ?? [];

      // Vérifie qu'au moins une donnée est présente
      if (!Array.isArray(rollsArray) && !Array.isArray(moneyArray) && !Array.isArray(simulationsArray)) {
        Alert.alert('Erreur', "Le fichier n'est pas au format attendu (au moins une des clés 'rolls', 'money', 'simulations' doit contenir un tableau).");
        return;
      }

      // LOG pour debug
      console.log('Import JSON:', { rollsArray, moneyArray, simulationsArray });

      // Import rolls
      let importedRolls = 0;
      if (Array.isArray(rollsArray)) {
        const existingRollIds = new Set(rolls.map(r => r.id));
        const newRolls = rollsArray.filter((r: any) => !existingRollIds.has(r.id));
        newRolls.forEach((r: any) => dispatch(addRoll(r)));
        importedRolls = newRolls.length;
      }

      // Import money
      let importedMoney = 0;
      if (Array.isArray(moneyArray)) {
        const existingMoneyIds = new Set(moneyEntries.map(e => e.id));
        const newMoney = moneyArray.filter((e: any) => !existingMoneyIds.has(e.id));
        newMoney.forEach((e: any) => dispatch(addMoney(e)));
        importedMoney = newMoney.length;
      }

      // Import simulations
      let importedSimulations = 0;
      if (Array.isArray(simulationsArray)) {
        const existingBannerIds = new Set(banners.map(b => b.id));
        simulationsArray.forEach((banner: any) => {
          if (!existingBannerIds.has(banner.id)) {
            dispatch(addBanner(banner));
            importedSimulations++;
          } else {
            // Bannière déjà présente, on ajoute seulement les rolls non présents
            const existingBanner = banners.find(b => b.id === banner.id);
            const existingRollIds = new Set(existingBanner?.rolls.map(r => r.id));
            const newRolls = banner.rolls.filter((r: any) => !existingRollIds.has(r.id));
            newRolls.forEach((r: any) => dispatch(addSimulationRoll({ bannerId: banner.id, roll: r })));
            if (newRolls.length > 0) importedSimulations++;
          }
        });
      }

      if (importedRolls + importedMoney + importedSimulations === 0) {
        Alert.alert('Import terminé', "Aucune donnée importée : tout existe déjà.");
        setShowImportExport(false);
        return;
      }

      Alert.alert(
        'Import réussi',
        `${importedRolls} roll(s), ${importedMoney} entrée(s) d'argent, ${importedSimulations} bannière(s)/tirage(s) simulé(s) importé(s) avec succès.`
      );
      setShowImportExport(false);
    } catch (e) {
      console.log('Import error:', e);
      Alert.alert('Erreur', "Le fichier n'est pas un JSON valide ou une erreur est survenue.");
    }
  };

  // Envoyer le feedback
  const handleSendFeedback = () => {
    // Logique pour envoyer le feedback (e.g., appel API)
    console.log('Feedback envoyé :', feedbackText);
    setFeedbackText('');
    setShowFeedbackModal(false);
    Alert.alert('Merci !', 'Votre feedback a été envoyé. Merci de contribuer à l\'amélioration de l\'app.');
  };

  let lang = nationality || 'fr';
  const texts = require('@/data/texts.json');
  const t = (key: string) => texts[key]?.[lang] || texts[key]?.fr || key;

  // Update FONT_SIZES with translations
  const FONT_SIZES_LOCALIZED = [
    { key: 'small', label: t('settings.fontSize.small'), example: 'Aa' },
    { key: 'normal', label: t('settings.fontSize.normal'), example: 'Aa' },
    { key: 'large', label: t('settings.fontSize.large'), example: 'Aa' },
  ];

  // Update flags with translations
  const flags = [
    { country: 'fr', label: 'Français', icon: require('@/assets/flags/fr.png') },
    { country: 'en', label: 'English', icon: require('@/assets/flags/us.png') },
    { country: 'jp', label: '日本語', icon: require('@/assets/flags/jp.png') },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: themeColors.background }}
      accessible={true}
      accessibilityLabel={t('settings.general.title') || 'Settings'}
    >
      <View style={{ padding: 20 }}>
        {/* Section Paramètres généraux */}
        <Text style={[styles.sectionTitle, { color: themeColors.primary, fontSize: getFontSize(18) }]}>
          {t('settings.general.title')}
        </Text>
        {/* Langue */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: themeColors.text, fontSize: getFontSize(16) }]}>
            {t('settings.language')}
          </Text>
          <View style={{ flexDirection: 'row' }}>
            {flags.map(flag => (
              <TouchableOpacity
                key={flag.country}
                accessibilityRole="button"
                accessible={true}
                accessibilityLabel={t('settings.language') + ` ${flag.label}`}
                accessibilityState={{ selected: nationality === flag.country }}
                style={[
                  styles.chip,
                  {
                    backgroundColor: nationality === flag.country
                      ? themeColors.primary
                      : themeColors.card,
                    flexDirection: 'row',
                    alignItems: 'center',
                    minWidth: 48,
                    justifyContent: 'center',
                  },
                ]}
                onPress={() => dispatch(setNationality({ country: flag.country }))} >
                <Image
                  source={flag.icon}
                  style={{
                    width: 28,
                    height: 20,
                    borderRadius: 6,
                    marginRight: 0,
                    borderWidth: nationality === flag.country ? 2 : 0,
                    borderColor: nationality === flag.country
                      ? themeColors.background
                      : 'transparent',
                  }}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {/* --- DEVISE --- */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: themeColors.text, fontSize: getFontSize(16) }]}
          >
            {t('settings.currency')}
          </Text>
          <View style={{ flexDirection: 'row' }}>
            {currencies.map(cur => (
              <TouchableOpacity
                key={cur.currency}
                accessibilityRole="button"
                accessible={true}
                accessibilityLabel={`${t('settings.currency')} ${cur.label}`}
                accessibilityState={{ selected: devise === cur.currency }}
                style={[
                  styles.chip,
                  {
                    backgroundColor: devise === cur.currency
                      ? themeColors.primary
                      : themeColors.card,
                    flexDirection: 'row',
                    alignItems: 'center',
                    minWidth: 48,
                    justifyContent: 'center',
                  },
                ]}
                onPress={() => dispatch(setDevise({ currency: cur.currency }))} >
                <Text
                  style={{
                    fontSize: getFontSize(22),
                    color: devise === cur.currency
                      ? themeColors.background
                      : themeColors.text,
                    fontWeight: devise === cur.currency ? 'bold' : 'normal',
                  }}
                >
                  {cur.symbol}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {/* Thème */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: themeColors.text, fontSize: getFontSize(16) }]}>{t('settings.theme')}</Text>
          <View style={{ flexDirection: 'row' }}>
            {themeModes.map(mode => (
              <TouchableOpacity
                key={mode.key}
                accessibilityRole="button"
                accessible={true}
                accessibilityLabel={`${t('settings.theme')} ${mode.key}`}
                accessibilityState={{ selected: theme === mode.key }}
                style={[
                  styles.chip,
                  {
                    backgroundColor: theme === mode.key
                      ? themeColors.primary
                      : themeColors.card,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 48,
                  },
                ]}
                onPress={() => dispatch(setTheme(mode.key as 'light' | 'dark' | 'night'))}
              >
                <Feather
                  name={mode.icon as any}
                  size={getFontSize(20)}
                  color={theme === mode.key ? themeColors.background : themeColors.text}
                  style={mode.key === 'night' ? { ...mode.style } : undefined}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {/* Taille de police */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: themeColors.text, fontSize: getFontSize(16) }]}>{t('settings.fontSize')}</Text>
          <View style={{ flexDirection: 'row' }}>
            {FONT_SIZES_LOCALIZED.map(size => (
              <TouchableOpacity
                key={size.key}
                accessibilityRole="button"
                accessible={true}
                accessibilityLabel={`${t('settings.fontSize')} ${size.label}`}
                accessibilityState={{ selected: fontSize === size.key }}
                style={[
                  styles.chip,
                  {
                    backgroundColor: fontSize === size.key
                      ? themeColors.primary
                      : themeColors.card,
                    flexDirection: 'row',
                    alignItems: 'center',
                    minWidth: 60,
                    justifyContent: 'center',
                  },
                ]}
                onPress={() => dispatch(setFontSize(size.key as 'small' | 'normal' | 'large'))}
              >
                <Text
                  style={{
                    fontSize:
                      size.key === 'small'
                        ? getFontSize(13)
                        : size.key === 'large'
                        ? getFontSize(22)
                        : getFontSize(17),
                    color: fontSize === size.key
                      ? themeColors.background
                      : themeColors.text,
                    fontWeight: 'bold',
                  }}
                >
                  {size.example}
                </Text>
                <Text
                  style={{
                    color: fontSize === size.key
                      ? themeColors.background
                      : themeColors.text,
                    fontWeight: fontSize === size.key ? 'bold' : 'normal',
                    fontSize: getFontSize(16),
                    marginLeft: 6,
                  }}
                >
                  {size.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {/* Sons & Vibrations */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: themeColors.text, fontSize: getFontSize(16) }]}>{t('settings.sounds')}</Text>
          <Switch
            accessibilityLabel={t('settings.sounds')}
            accessibilityState={{ checked: sounds }}
            value={sounds}
            onValueChange={v => { dispatch(setSounds(v)); }}
            thumbColor={sounds ? (themeColors.primary) : (themeColors.card)}
            trackColor={{ false: themeColors.card, true: themeColors.primary }}
          />
        </View>
        <View style={styles.row}>
          <Text style={[styles.label, { color: themeColors.text, fontSize: getFontSize(16) }]}>{t('settings.vibrations')}</Text>
          <Switch
            accessibilityLabel={t('settings.vibrations')}
            accessibilityState={{ checked: vibrations }}
            value={vibrations}
            onValueChange={v => { dispatch(setVibrations(v)); }}
            thumbColor={vibrations ? (themeColors.primary) : (themeColors.card)}
            trackColor={{ false: themeColors.card, true: themeColors.primary }}
          />
        </View>

        {/* Section Données & Confidentialité */}
        <Text style={[styles.sectionTitle, { color: themeColors.primary, marginTop: 32, fontSize: getFontSize(18) }]}>{t('settings.dataPrivacy.title')}</Text>
        <View style={styles.row}>
          <TouchableOpacity
            accessibilityRole="button"
            accessible={true}
            accessibilityLabel={t('settings.importExport')}
            style={styles.linkBtn}
            onPress={() => setShowImportExport(true)}
          >
            <Text style={[styles.link, { color: themeColors.primary, fontSize: getFontSize(16) }]}>{t('settings.importExport')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessible={true}
            accessibilityLabel={t('settings.reset')}
            style={styles.linkBtn}
            onPress={handleReset}
          >
            <Text style={[styles.link, { color: '#FF3B30', fontWeight: 'bold', fontSize: getFontSize(16) }]}>{t('settings.reset')}</Text>
          </TouchableOpacity>
        </View>

        {/* Section Feedback */}
        <Text style={[styles.sectionTitle, { color: themeColors.primary, marginTop: 32, fontSize: getFontSize(18) }]}>{t('settings.feedback.title')}</Text>
        <View style={styles.row}>
          <TouchableOpacity style={styles.linkBtn} onPress={() => setShowFeedbackModal(true)}>
            <Text style={[styles.link, { color: themeColors.primary, fontSize: getFontSize(16) }]}>{t('settings.feedback.sendAnonymous')}</Text>
          </TouchableOpacity>
        </View>

        {/* Move "Voir la démo" under Vibrations (visually below) */}
        <View style={{ marginTop: 8 }}>
          <TouchableOpacity
            style={[styles.linkBtn, { backgroundColor: 'transparent' }]}
            onPress={() => setShowDemo(true)}
            accessibilityRole="button"
            accessible={true}
            accessibilityLabel={t('settings.viewDemo') || 'View demo'}
          >
            <Text style={[styles.link, { color: themeColors.primary, fontSize: getFontSize(16) }]}>{t('settings.viewDemo') || 'Voir la démo'}</Text>
          </TouchableOpacity>
        </View>

        {/* Demo modal (replay onboarding) */}
        <Modal visible={showDemo} animationType="slide" transparent>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <View style={{ flex: 1 }}>
              <DemoScreen onFinish={() => {
                // mark onboarding as seen and close demo
                try { dispatch(setOnboardingSeen()); } catch (e) { /* ignore */ }
                setShowDemo(false);
              }} />
            </View>
          </View>
        </Modal>

        {/* Modal Import/Export */}
        <Modal visible={showImportExport} animationType="slide" transparent>
          <TouchableOpacity
            activeOpacity={1}
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.5)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => setShowImportExport(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={{
                backgroundColor: themeColors.card,
                padding: 24,
                borderRadius: 16,
                width: '90%',
                maxHeight: '80%',
              }}
              onPress={() => {}} // Empêche la propagation du clic à l'extérieur
            >
              <Text style={{ fontWeight: 'bold', fontSize: getFontSize(18), color: themeColors.primary, marginBottom: 12 }}>
                {t('settings.importExport.title')}
              </Text>
              {/* Export */}
              <Text style={{ color: themeColors.text, marginBottom: 8, fontSize: getFontSize(15) }}>
                {t('settings.importExport.exportAll')}
              </Text>
              <ExportDataButton getFontSize={getFontSize} themeColors={themeColors} />
              <Text style={{ color: themeColors.text, marginBottom: 8, fontSize: getFontSize(15) }}>
                {t('settings.importExport.exportOne')}
              </Text>
              <ExportGachaButton getFontSize={getFontSize} themeColors={themeColors} />
              {/* Import */}
              <Text style={{ color: themeColors.text, marginTop: 16, marginBottom: 4, fontSize: getFontSize(15) }}>
                {t('settings.importExport.importLabel')}
              </Text>
              <TouchableOpacity
                style={styles.validateBtn}
                onPress={handleImportFile}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: getFontSize(16) }}>
                  {t('settings.importExport.importButton')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ marginTop: 16 }} onPress={() => setShowImportExport(false)}>
                <Text style={{ color: themeColors.primary, textAlign: 'center', fontSize: getFontSize(16) }}>{t('settings.close')}</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* Modal Feedback */}
        <Modal visible={showFeedbackModal} animationType="slide" transparent>
          <TouchableOpacity
            activeOpacity={1}
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.5)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => setShowFeedbackModal(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={{
                backgroundColor: themeColors.card,
                padding: 24,
                borderRadius: 16,
                width: '90%',
                maxHeight: '80%',
              }}
              onPress={() => {}} // Empêche la propagation du clic à l'extérieur
            >
              <Text style={{ fontWeight: 'bold', fontSize: getFontSize(18), color: themeColors.primary, marginBottom: 12 }}>
                {t('settings.feedback.sendAnonymous')}
              </Text>
              <TextInput
                accessibilityLabel={t('settings.feedback.placeholder')}
                accessible={true}
                style={[styles.input, { fontSize: getFontSize(16) }]}
                placeholder={t('settings.feedback.placeholder')}
                placeholderTextColor="#888"
                multiline
                value={feedbackText}
                onChangeText={setFeedbackText}
              />
              <TouchableOpacity
                style={styles.validateBtn}
                onPress={handleSendFeedback}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: getFontSize(16) }}>{t('settings.send')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ marginTop: 16 }} onPress={() => setShowFeedbackModal(false)}>
                <Text style={{ color: themeColors.primary, textAlign: 'center', fontSize: getFontSize(16) }}>{t('settings.close')}</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 14,
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    flexWrap: 'wrap',
  },
  label: {
    fontSize: 16,
    flex: 1,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    marginHorizontal: 4,
    marginVertical: 2,
  },
  link: {
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  linkBtn: {
    marginRight: 12,
    marginVertical: 4,
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  validateBtn: {
    backgroundColor: '#00B894',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    backgroundColor: '#fff',
    color: '#181818',
  },
});

export default Settings;

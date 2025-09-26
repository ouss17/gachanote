import ExportDataButton from '@/components/ExportDataButton';
import ExportGachaButton from '@/components/ExportGachaButton';
import { Theme } from '@/constants/Themes';
import { setDevise } from '@/redux/slices/deviseSlice';
import { setNationality } from '@/redux/slices/nationalitySlice';
import { setFontSize, setSounds, setVibrations } from '@/redux/slices/settingsSlice';
import { setTheme } from '@/redux/slices/themeSlice';
import { RootState } from '@/redux/store';
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Image, Modal, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

const LANGUAGES = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'jp', label: '日本語' },
];

const FONT_SIZES = [
  { key: 'small', label: 'Petit', example: 'Aa' },
  { key: 'normal', label: 'Normal', example: 'Aa' },
  { key: 'large', label: 'Grand', example: 'Aa' },
];

const currencies = [
  { currency: '€', label: 'Euro', symbol: '€' },
  { currency: '$', label: 'Dollar', symbol: '$' },
  { currency: '¥', label: 'Yen', symbol: '¥' },
];

// Ajoute le mode "night" (pleine lune) et "dark" (demi-lune)
const themeModes = [
  { key: 'light', icon: 'sun' }, // soleil
  { key: 'dark', icon: 'moon', style: { transform: [{ scaleX: -1 }] } }, // dark = demi-lune (miroir)
  { key: 'night', icon: 'circle' }, // night = pleine lune (cercle plein)
];

const Settings = () => {
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.theme.mode);
  const themeColors = Theme[theme as keyof typeof Theme];
  const nationality = useSelector((state: RootState) => state.nationality.country);
  const fontSize = useSelector((state: RootState) => state.settings.fontSize);
  const sounds = useSelector((state: RootState) => state.settings.sounds);
  const vibrations = useSelector((state: RootState) => state.settings.vibrations);
  const devise = useSelector((state: RootState) => state.devise.currency);
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
            // Ajoute ici d'autres resets si besoin
          },
        },
      ]
    );
  };

  // Export/Import (placeholders)
  const handleExport = (type: 'json' | 'gacha') => {
    Alert.alert('Export', `Export ${type === 'gacha' ? 'par gacha' : 'global'} à venir !`);
  };
  const handleImport = () => {
    Alert.alert('Import', 'Import à venir !');
  };

  // Envoyer le feedback
  const handleSendFeedback = () => {
    // Logique pour envoyer le feedback (e.g., appel API)
    console.log('Feedback envoyé :', feedbackText);
    setFeedbackText('');
    setShowFeedbackModal(false);
    Alert.alert('Merci !', 'Votre feedback a été envoyé. Merci de contribuer à l\'amélioration de l\'app.');
  };

  // Liste des nationalités avec drapeaux (comme sur l'index)
  const flags = [
    { country: 'fr', label: 'Français', icon: require('@/assets/flags/fr.png') },
    { country: 'en', label: 'English', icon: require('@/assets/flags/us.png') },
    { country: 'jp', label: '日本語', icon: require('@/assets/flags/jp.png') },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: themeColors.background }}>
      <View style={{ padding: 20 }}>
        {/* Section Paramètres généraux */}
        <Text style={[styles.sectionTitle, { color: themeColors.primary, fontSize: getFontSize(18) }]}>
          🔧 Paramètres généraux
        </Text>
        {/* Langue */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: themeColors.text, fontSize: getFontSize(16) }]}>
            Langue
          </Text>
          <View style={{ flexDirection: 'row' }}>
            {flags.map(flag => (
              <TouchableOpacity
                key={flag.country}
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
                onPress={() => dispatch(setNationality({ country: flag.country }))}
              >
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
            Devise
          </Text>
          <View style={{ flexDirection: 'row' }}>
            {currencies.map(cur => (
              <TouchableOpacity
                key={cur.currency}
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
                onPress={() => dispatch(setDevise({ currency: cur.currency }))}
              >
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
          <Text style={[styles.label, { color: themeColors.text, fontSize: getFontSize(16) }]}>Thème</Text>
          <View style={{ flexDirection: 'row' }}>
            {themeModes.map(mode => (
              <TouchableOpacity
                key={mode.key}
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
          <Text style={[styles.label, { color: themeColors.text, fontSize: getFontSize(16) }]}>Taille de police</Text>
          <View style={{ flexDirection: 'row' }}>
            {FONT_SIZES.map(size => (
              <TouchableOpacity
                key={size.key}
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
          <Text style={[styles.label, { color: themeColors.text, fontSize: getFontSize(16) }]}>Sons</Text>
          <Switch
            value={sounds}
            onValueChange={v => { dispatch(setSounds(v)); }}
            thumbColor={sounds ? (themeColors.primary) : (themeColors.card)}
            trackColor={{ false: themeColors.card, true: themeColors.primary }}
          />
        </View>
        <View style={styles.row}>
          <Text style={[styles.label, { color: themeColors.text, fontSize: getFontSize(16) }]}>Vibrations</Text>
          <Switch
            value={vibrations}
            onValueChange={v => { dispatch(setVibrations(v)); }}
            thumbColor={vibrations ? (themeColors.primary) : (themeColors.card)}
            trackColor={{ false: themeColors.card, true: themeColors.primary }}
          />
        </View>

        {/* Section Données & Confidentialité */}
        <Text style={[styles.sectionTitle, { color: themeColors.primary, marginTop: 32, fontSize: getFontSize(18) }]}>📊 Données & Confidentialité</Text>
        <View style={styles.row}>
          <TouchableOpacity style={styles.linkBtn} onPress={() => setShowImportExport(true)}>
            <Text style={[styles.link, { color: themeColors.primary, fontSize: getFontSize(16) }]}>Import / Export</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkBtn} onPress={handleReset}>
            <Text style={[styles.link, { color: '#FF3B30', fontWeight: 'bold', fontSize: getFontSize(16) }]}>Remise à zéro</Text>
          </TouchableOpacity>
        </View>

        {/* Section Feedback */}
        <Text style={[styles.sectionTitle, { color: themeColors.primary, marginTop: 32, fontSize: getFontSize(18) }]}>🙎🏽‍♂️ Partage ton expérience</Text>
        <View style={styles.row}>
          <TouchableOpacity style={styles.linkBtn} onPress={() => setShowFeedbackModal(true)}>
            <Text style={[styles.link, { color: themeColors.primary, fontSize: getFontSize(16) }]}>Envoyer un feedback anonyme</Text>
          </TouchableOpacity>
        </View>

        {/* Modal Import/Export */}
        <Modal visible={showImportExport} animationType="slide" transparent>
          <View style={{
            flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'
          }}>
            <View style={{
              backgroundColor: themeColors.card,
              padding: 24,
              borderRadius: 16,
              width: '90%',
              maxHeight: '80%',
            }}>
              <Text style={{ fontWeight: 'bold', fontSize: getFontSize(18), color: themeColors.primary, marginBottom: 12 }}>
                Import / Export des données
              </Text>
              {/* Export */}
              <Text style={{ color: themeColors.text, marginBottom: 8, fontSize: getFontSize(15) }}>
                Exporter toutes les données ou seulement celles d'un gacha :
              </Text>
              <ExportDataButton getFontSize={getFontSize} themeColors={themeColors} />
              <ExportGachaButton getFontSize={getFontSize} themeColors={themeColors} />
              {/* Import */}
              <Text style={{ color: themeColors.text, marginTop: 16, marginBottom: 4, fontSize: getFontSize(15) }}>
                Importer des données (JSON) :
              </Text>
              <TextInput
                style={[styles.input, { fontSize: getFontSize(16) }]}
                placeholder="Collez ici vos données JSON"
                placeholderTextColor="#888"
                multiline
                value={importText}
                onChangeText={setImportText}
              />
              <TouchableOpacity
                style={styles.validateBtn}
                onPress={handleImport}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: getFontSize(16) }}>Importer</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ marginTop: 16 }} onPress={() => setShowImportExport(false)}>
                <Text style={{ color: themeColors.primary, textAlign: 'center', fontSize: getFontSize(16) }}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal Feedback */}
        <Modal visible={showFeedbackModal} animationType="slide" transparent>
          <View style={{
            flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'
          }}>
            <View style={{
              backgroundColor: themeColors.card,
              padding: 24,
              borderRadius: 16,
              width: '90%',
              maxHeight: '80%',
            }}>
              <Text style={{ fontWeight: 'bold', fontSize: getFontSize(18), color: themeColors.primary, marginBottom: 12 }}>
                Envoyer un feedback anonyme
              </Text>
              <TextInput
                style={[styles.input, { fontSize: getFontSize(16) }]}
                placeholder="Décris ton expérience, tes suggestions ou bugs rencontrés..."
                placeholderTextColor="#888"
                multiline
                value={feedbackText}
                onChangeText={setFeedbackText}
              />
              <TouchableOpacity
                style={styles.validateBtn}
                onPress={handleSendFeedback}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: getFontSize(16) }}>Envoyer</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ marginTop: 16 }} onPress={() => setShowFeedbackModal(false)}>
                <Text style={{ color: themeColors.primary, textAlign: 'center', fontSize: getFontSize(16) }}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
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

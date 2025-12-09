import { Theme } from '@/constants/Themes';
import { GACHAS } from '@/data/gachas';
import type { Roll } from '@/redux/slices/rollsSlice';
import { addRoll, updateRoll } from '@/redux/slices/rollsSlice';
import { RootState } from '@/redux/store';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit?: (roll: Roll) => void; // optional: if provided, RollForm will call it; otherwise it dispatches itself
  initial?: Roll | null;
  gachaId: string;
  resourceType?: string; // optional: if not provided RollForm will derive from gachaId
  getFontSize?: (n: number) => number; // optional: if not provided RollForm will compute from store
  themeColors?: any; // optional: if not provided RollForm will derive from store
  t?: (k: string) => string; // optional: i18n function
  onModalVisibilityChange?: (v: boolean) => void;
  compact?: boolean; // when true show only required fields (simple add mode)
};

export default function RollForm({
  visible,
  onClose,
  onSubmit,
  initial,
  gachaId,
  resourceType: propResourceType,
  getFontSize: propGetFontSize,
  themeColors: propThemeColors,
  t: propT,
  onModalVisibilityChange,
  compact = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const today = new Date();
  const dispatch = useDispatch();

  const themeMode = useSelector((s: RootState) => s.theme.mode);
  const themeColorsStore = Theme[themeMode as keyof typeof Theme];
  const themeColors = propThemeColors ?? themeColorsStore;

  const placeholderColor =
    themeMode === 'dark' || themeMode === 'night' ? '#E5E7EB' : themeColors.placeholder;
 
   const fontSizeSetting = useSelector((s: RootState) => s.settings.fontSize);
   const getFontSize = propGetFontSize ?? ((base: number) => {
     if (fontSizeSetting === 'small') return base * 0.85;
     if (fontSizeSetting === 'large') return base * 1.25;
     return base;
   });

  const lang = useSelector((s: any) => s.nationality?.country) || 'fr';
  const texts = require('@/data/texts.json');
  const t = propT ?? ((key: string) => texts[key]?.[lang] || texts[key]?.fr || key);

  function getResourceTypeFromGacha(id: string) {
    switch (id) {
      case 'dbl': return 'cc';
      case 'dokkan': return 'ds';
      case 'fgo': return 'sq';
      case 'sevenDS': return 'gemmes';
      case 'opbr': return 'diamants';
      default: return 'gemmes';
    }
  }
  const resourceType = propResourceType ?? getResourceTypeFromGacha(String(gachaId));

  const nameFeaturedRef = useRef<TextInput | null>(null);
  const featuredCountRef = useRef<TextInput | null>(null);
  const spookCountRef = useRef<TextInput | null>(null);
  const sideUnitRef = useRef<TextInput | null>(null);
 
  const [nameFeatured, setNameFeatured] = useState(initial?.nameFeatured ?? '');
  // server selection (from gacha.serverTags)
  const gachaMeta = GACHAS.find(g => String(g.id) === String(gachaId));
  const availableServers = Array.isArray(gachaMeta?.serverTags) && gachaMeta!.serverTags.length > 0 ? gachaMeta!.serverTags : ['global'];
  const [server, setServer] = useState<string>(initial?.server ?? availableServers[0]);
  const [resourceAmount, setResourceAmount] = useState(initial ? String(initial.resourceAmount ?? '') : '');
  const [ticketAmount, setTicketAmount] = useState(initial ? String(initial.ticketAmount ?? '') : '');
  const [freePulls, setFreePulls] = useState(initial ? String(initial.freePulls ?? '') : '');
  const [notes, setNotes] = useState(initial ? String(initial.notes ?? '') : '');
  const [featuredCount, setFeaturedCount] = useState(initial ? String(initial.featuredCount ?? '') : '');
  const [spookCount, setSpookCount] = useState(initial ? String(initial.spookCount ?? '') : '');
  const [featuredItemsCount, setFeaturedItemsCount] = useState(initial ? String(initial.featuredItemsCount ?? '') : '');
  const [srItemsCount, setSrItemsCount] = useState(initial ? String(initial.srItemsCount ?? '') : '');
  const [sideUnit, setSideUnit] = useState(initial ? String(initial.sideUnit ?? '') : '');
  const [imageUri, setImageUri] = useState<string | undefined>(initial?.imageUri);
  const [thumbUri, setThumbUri] = useState<string | undefined>(initial?.thumbUri);
  const [date, setDate] = useState<Date>(initial ? new Date(initial.date) : today);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [showSpookInfo, setShowSpookInfo] = useState(false);
  const [showSideUnitInfo, setShowSideUnitInfo] = useState(false);
  const [showItemsInfo, setShowItemsInfo] = useState(false);

  useEffect(() => {
    setNameFeatured(initial?.nameFeatured ?? '');
    setServer(initial?.server ?? (gachaMeta?.serverTags?.[0] ?? availableServers[0]));
    setResourceAmount(initial ? String(initial.resourceAmount ?? '') : '');
    setTicketAmount(initial ? String(initial.ticketAmount ?? '') : '');
    setFreePulls(initial ? String(initial.freePulls ?? '') : '');
    setNotes(initial ? String(initial.notes ?? '') : '');
    setFeaturedCount(initial ? String(initial.featuredCount ?? '') : '');
    setSpookCount(initial ? String(initial.spookCount ?? '') : '');
    setFeaturedItemsCount(initial ? String(initial.featuredItemsCount ?? '') : '');
    setSrItemsCount(initial ? String(initial.srItemsCount ?? '') : '');
    setSideUnit(initial ? String(initial.sideUnit ?? '') : '');
    setImageUri(initial?.imageUri);
    setThumbUri(initial?.thumbUri);
    setDate(initial ? new Date(initial.date) : today);
  }, [initial, visible]);
 
  useEffect(() => {
    const s = Keyboard.addListener('keyboardDidShow', () => onModalVisibilityChange?.(true));
    const h = Keyboard.addListener('keyboardDidHide', () => onModalVisibilityChange?.(false));
    return () => {
      s.remove();
      h.remove();
    };
  }, [onModalVisibilityChange]);

  const hasResourceOrTicket = useMemo(() => {
    return (resourceAmount || '').toString().trim() !== '' ||
           (ticketAmount || '').toString().trim() !== '' ||
           (freePulls || '').toString().trim() !== '';
  }, [resourceAmount, ticketAmount, freePulls]);

  const resetForm = () => {
    setNameFeatured('');
    setServer(gachaMeta?.serverTags?.[0] ?? availableServers[0]);
    setResourceAmount('');
    setTicketAmount('');
    setFreePulls('');
    setNotes('');
    setFeaturedCount('');
    setSpookCount('');
    setFeaturedItemsCount('');
    setSrItemsCount('');
    setSideUnit('');
    setImageUri(undefined);
    setThumbUri(undefined);
    setDate(today);
  };
 
  const idRef = useRef<string>(initial?.id ?? (typeof Crypto.randomUUID === 'function' ? Crypto.randomUUID() : `tmp_${Date.now()}`));
  useEffect(() => {
    if (visible) {
      idRef.current = initial?.id ?? (typeof Crypto.randomUUID === 'function' ? Crypto.randomUUID() : `tmp_${Date.now()}`);
    }
  }, [initial, visible]);
  
  const handleConfirm = async () => {
    if (!featuredCount || !date) {
      Alert.alert(t('gachaRolls.form.fillRequired') || 'Remplir le nombre de vedettes et la date.');
      return;
    }
    if (!hasResourceOrTicket) {
      Alert.alert(t('gachaRolls.form.fillResourceOrTicket') || 'Renseigner ressource ou tickets (au moins un).');
      return;
    }

    const id = idRef.current;

    let finalDateIso = '';
    const now = new Date();
    if (initial && initial.date) {
      const initDate = new Date(initial.date);
      // if initial.date contains time (ISO full), preserve its time part; otherwise use current time
      const timeSource = initial.date.length > 10 ? initDate : now;
      const newDate = new Date(date);
      newDate.setHours(timeSource.getHours(), timeSource.getMinutes(), timeSource.getSeconds(), timeSource.getMilliseconds());
      finalDateIso = newDate.toISOString();
    } else {
      const newDate = new Date(date);
      newDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
      finalDateIso = newDate.toISOString();
    }

    // when building the roll, parse numbers robustly
    const roll: Roll = {
      id,
      gachaId: String(gachaId),
      server: server,
      resourceAmount: resourceAmount ? Number(String(resourceAmount).replace(/,/g, '.')) : 0,
      ticketAmount: ticketAmount ? Number(String(ticketAmount).replace(/,/g, '.')) : undefined,
      freePulls: freePulls ? Number(String(freePulls).replace(/,/g, '.')) : undefined,
      featuredItemsCount: featuredItemsCount ? Number(featuredItemsCount) : undefined,
      srItemsCount: srItemsCount ? Number(srItemsCount) : undefined,
      imageUri: imageUri ? imageUri : undefined,
      thumbUri: thumbUri ? thumbUri : undefined,
      featuredCount: Number(featuredCount),
      spookCount: Number(spookCount || 0),
      sideUnit: Number(sideUnit || 0),
      date: finalDateIso,
      resourceType,
      nameFeatured: nameFeatured || undefined,
      notes: notes ? String(notes).slice(0, 200) : undefined,
    };
    
    if (typeof onSubmit === 'function') {
      onSubmit(roll);
    } else {
      if (initial && initial.id) dispatch(updateRoll(roll));
      else dispatch(addRoll(roll));
    }

    onClose();
    resetForm();
  };

  const pickAndSaveImage = async ({ rollId, maxSize = 1600, quality = 0.8 } : { rollId: string, maxSize?: number, quality?: number }) => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) throw new Error('Permission denied');

      const res: any = await ImagePicker.launchImageLibraryAsync({
        // runtime-safe fallback: some expo-image-picker versions export MediaType, others MediaTypeOptions.
        mediaTypes: (ImagePicker as any).MediaType?.Images ??
                    (ImagePicker as any).MediaTypeOptions?.Images ??
                    'Images',
        quality: 1,
        allowsEditing: false,
      });

      const isCanceled = res?.canceled === true || res?.cancelled === true;
      if (isCanceled) return null;

      const pickedUri: string | undefined = res?.assets?.[0]?.uri ?? res?.uri ?? res?.output?.uri;
      if (!pickedUri) return null;

      let mainManip;
      try {
        mainManip = await ImageManipulator.manipulateAsync(
          pickedUri,
          [{ resize: { width: maxSize } }],
          { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
        );
      } catch (e) {
        mainManip = { uri: pickedUri };
      }

      let thumbManip;
      try {
        thumbManip = await ImageManipulator.manipulateAsync(
          pickedUri,
          [{ resize: { width: 512 } }],
          { compress: Math.max(0.45, quality - 0.25), format: ImageManipulator.SaveFormat.JPEG }
        );
      } catch (e) {
        thumbManip = { uri: mainManip.uri };
      }

      const baseDir = ((FileSystem as any).documentDirectory ?? (FileSystem as any).cacheDirectory ?? '');
      const mainUri = mainManip.uri;
      const thumbUriLocal = thumbManip.uri;

      if (!baseDir) {
        console.warn('No persistent documentDirectory available, returning temp URIs');
        return { imageUri: mainUri, thumbUri: thumbUriLocal };
      }

      const dir = `${baseDir}images/`;
      try {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      } catch (e) {
      }

      const baseName = `roll_${rollId}_${Date.now()}`;
      const mainFilename = `${baseName}.jpg`;
      const thumbFilename = `${baseName}_thumb.jpg`;
      const mainDest = `${dir}${mainFilename}`;
      const thumbDest = `${dir}${thumbFilename}`;

      try {
        await FileSystem.copyAsync({ from: mainUri, to: mainDest });
        await FileSystem.copyAsync({ from: thumbUriLocal, to: thumbDest });
        return { imageUri: mainDest, thumbUri: thumbDest };
      } catch (e) {
        console.warn('Failed to copy image to persistent storage, using temp URIs', e);
        return { imageUri: mainUri, thumbUri: thumbUriLocal };
      }
    } catch (err: any) {
      console.warn('pickAndSaveImage error', err);
      return null;
    }
  };
 
  const handlePickImage = async () => {
    try {
      const res = await pickAndSaveImage({ rollId: idRef.current });
      if (!res) {
        return;
      }
      try {
        if (imageUri && imageUri !== res.imageUri) await FileSystem.deleteAsync(imageUri, { idempotent: true });
        if (thumbUri && thumbUri !== res.thumbUri) await FileSystem.deleteAsync(thumbUri, { idempotent: true });
      } catch (e) {
        console.warn('Failed to delete previous image files', e);
      }
      setImageUri(res.imageUri);
      setThumbUri(res.thumbUri);
    } catch (e: any) {
      console.warn('handlePickImage error', e);
      Alert.alert(t('common.error') || 'Erreur', e?.message || String(e));
    }
  };

  const handleRemoveImage = async () => {
    try {
      if (imageUri) await FileSystem.deleteAsync(imageUri, { idempotent: true });
      if (thumbUri) await FileSystem.deleteAsync(thumbUri, { idempotent: true });
    } catch (e) {
      // ignore
    }
    setImageUri(undefined);
    setThumbUri(undefined);
  };

  // normalize number input: convert commas to dots, allowFloat -> keep one dot
  const normalizeNumberInput = (text: string, allowFloat = false) => {
    if (!text && text !== '') return '';
    const withDot = text.replace(/,/g, '.');
    if (allowFloat) {
      // keep only digits and dots, then ensure a single dot
      let cleaned = withDot.replace(/[^0-9.]/g, '');
      const parts = cleaned.split('.');
      if (parts.length <= 1) return cleaned;
      const head = parts.shift() || '';
      const rest = parts.join('');
      return `${head}.${rest}`;
    }
    // integer: keep digits only (commas removed)
    return withDot.replace(/[^0-9]/g, '');
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
            <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' }} />
          </TouchableWithoutFeedback>

          <ScrollView
            contentContainerStyle={{
              width: '90%',
              padding: 0,
              paddingBottom: Math.max(24, insets.bottom),
              alignItems: 'center',
            }}
            keyboardShouldPersistTaps="always" 
            showsVerticalScrollIndicator={false}
          >
            <View
              accessible={true}
              accessibilityLabel={initial ? t('gachaRolls.modal.editTitle') : t('gachaRolls.modal.addTitle')}
              style={{ backgroundColor: themeColors.card, padding: 24, borderRadius: 16, width: '100%' }}
            >
              <Text accessibilityRole="header" style={[styles.title, { color: themeColors.text, fontSize: getFontSize(24) }]}>
                {initial ? t('gachaRolls.modal.editTitle') : t('gachaRolls.modal.addTitle')}
              </Text>

              <Text style={{ color: themeColors.text, marginBottom: 4, fontSize: getFontSize(16) }}>
                {t('gachaRolls.form.nameFeatured')}
              </Text>
              <TextInput
                ref={nameFeaturedRef}
                accessibilityLabel={t('gachaRolls.form.nameFeatured')}
                style={[styles.input, { fontSize: getFontSize(16), backgroundColor: themeColors.card, color: themeColors.text, borderColor: themeColors.border }]
                }
                placeholder="Ex: Goku, Luffy, etc."
                placeholderTextColor={placeholderColor}
                value={nameFeatured}
                onChangeText={setNameFeatured}
                returnKeyType="next"
                onSubmitEditing={() => featuredCountRef.current?.focus()}
                blurOnSubmit={false}
              />

              {/* Server selector (from gacha.serverTags) */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, marginBottom: 8 }}>
                {availableServers.map(srv => {
                  const label = t(`servers.${srv}`) || srv;
                  const selected = srv === server;
                  return (
                    <TouchableOpacity
                      key={srv}
                      onPress={() => setServer(srv)}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 12,
                        marginRight: 8,
                        marginBottom: 8,
                        backgroundColor: selected ? themeColors.primary : themeColors.card,
                        borderWidth: selected ? 0 : 1,
                        borderColor: selected ? 'transparent' : themeColors.border,
                      }}
                    >
                      <Text style={{ color: selected ? themeColors.background : themeColors.text, fontSize: getFontSize(13) }}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
 
              <View style={{ marginTop: 8, marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ marginRight: 12 }}>
                  {thumbUri || imageUri ? (
                    <Image source={{ uri: thumbUri ?? imageUri }} style={{ width: 72, height: 72, borderRadius: 8, backgroundColor: themeColors.background }} />
                  ) : (
                    <View style={{ width: 72, height: 72, borderRadius: 8, backgroundColor: themeColors.background, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: themeColors.placeholder }}>IMG</Text>
                    </View>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <TouchableOpacity onPress={handlePickImage} style={{ marginBottom: 8 }}>
                    <Text style={{ color: themeColors.primary, fontSize: getFontSize(16), fontWeight: '700' }}>{t('gachaRolls.form.addImage') || 'Ajouter une image'}</Text>
                  </TouchableOpacity>
                  {imageUri ? (
                    <TouchableOpacity onPress={handleRemoveImage}>
                      <Text style={{ color: themeColors.placeholder, fontSize: getFontSize(13) }}>{t('gachaRolls.form.removeImage') || 'Retirer l\'image'}</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                <Text style={{ color: themeColors.text, marginRight: 4, fontSize: getFontSize(16) }}>
                  {t('gachaRolls.form.resourceAmount')} <Text style={{ color: '#FF3B30' }}>*</Text>
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0, fontSize: getFontSize(16), backgroundColor: themeColors.card, color: themeColors.text, borderColor: themeColors.border }]
                  }
                  placeholder="Ex: 3000"
                  placeholderTextColor={placeholderColor}
                  keyboardType="numeric"
                  value={resourceAmount}
                  onChangeText={(v) => setResourceAmount(normalizeNumberInput(v, true))}
                  returnKeyType="next"
                />
                <Text style={{ marginLeft: 8, color: themeColors.text, fontWeight: 'bold', fontSize: getFontSize(16) }}>
                  {String(resourceType).toUpperCase()}
                </Text>
              </View>

              {/* Ticket amount */}
              <View style={{ marginBottom: 4 }}>
                <Text style={{ color: themeColors.text, marginBottom: 4, fontSize: getFontSize(14) }}>
                  {t('gachaRolls.form.ticketAmount') || 'Tickets'} <Text style={{ color: '#FF3B30' }}>*</Text>
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0, fontSize: getFontSize(16), backgroundColor: themeColors.card, color: themeColors.text, borderColor: themeColors.border }]
                    }
                    placeholder="Ex: 10"
                    placeholderTextColor={placeholderColor}
                    keyboardType="numeric"
                    value={ticketAmount}
                    onChangeText={(v) => setTicketAmount(normalizeNumberInput(v, false))}
                    returnKeyType="next"
                  />
                  <Text style={{ marginLeft: 8, color: themeColors.text, fontWeight: 'bold', fontSize: getFontSize(16) }}>
                    {t('common.tickets') || 'Tickets'}
                  </Text>
                </View>
              </View>

              {/* Free pulls (gratuits) */}
              <View style={{ marginTop: 8, marginBottom: 4 }}>
                <Text style={{ color: themeColors.text, marginBottom: 4, fontSize: getFontSize(14) }}>
                  {t('gachaRolls.form.freePulls') || 'Free pulls'} <Text style={{ color: '#FF3B30' }}>*</Text>
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0, fontSize: getFontSize(16), backgroundColor: themeColors.card, color: themeColors.text, borderColor: themeColors.border }]}
                    placeholder="Ex: 1"
                    placeholderTextColor={placeholderColor}
                    keyboardType="numeric"
                    value={freePulls}
                    onChangeText={(v) => setFreePulls(normalizeNumberInput(v, false))}
                    returnKeyType="next"
                  />
                  <Text style={{ marginLeft: 8, color: themeColors.text, fontWeight: 'bold', fontSize: getFontSize(14) }}>
                    {t('gachaRolls.form.freePullsHint') || ''}
                  </Text>
                </View>
              </View>

              <Text style={{ color: themeColors.placeholder, fontSize: getFontSize(12), marginBottom: 12 }}>
                <Text style={{ color: '#FF3B30' }}>*</Text> {t('gachaRolls.form.resourceOrTicketsNote')}
              </Text>
 
               {/* Featured count */}
               <Text style={{ color: themeColors.text, marginBottom: 4, fontSize: getFontSize(16) }}>
                 {t('gachaRolls.form.featuredCount')} <Text style={{ color: '#FF3B30' }}>*</Text>
               </Text>
               <TextInput
                 ref={featuredCountRef}
                 accessibilityLabel={t('gachaRolls.form.featuredCount')}
                 style={[styles.input, { fontSize: getFontSize(16), backgroundColor: themeColors.card, color: themeColors.text, borderColor: themeColors.border }]
                 }
                 placeholder="Ex: 1"
                 placeholderTextColor={placeholderColor}
                 keyboardType="numeric"
                 value={featuredCount}
                 onChangeText={(v) => setFeaturedCount(normalizeNumberInput(v, false))}
                 returnKeyType="next"
                 onSubmitEditing={() => spookCountRef.current?.focus()}
                 blurOnSubmit={false}
               />

               {/* Spook count + help */}
               {!compact && (
                 <>
                   <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 8 }}>
                     <Text style={{ color: themeColors.text, fontSize: getFontSize(16) }}>{t('gachaRolls.form.spookCount')}</Text>
                     <TouchableOpacity
                       onPress={() => setShowSpookInfo(true)}
                       accessible
                       accessibilityRole="button"
                       accessibilityLabel={t('gachaRolls.spookHelpLabel') || 'Spook help'}
                       style={{
                         marginLeft: 8,
                         marginTop: -Math.round(getFontSize(4)),
                         width: Math.round(getFontSize(20)),
                         height: Math.round(getFontSize(20)),
                         borderRadius: Math.round(getFontSize(10)),
                         backgroundColor: themeColors.primary,
                         alignItems: 'center',
                         justifyContent: 'center',
                       }}
                     >
                       <Text style={{ color: '#fff', fontWeight: '700', fontSize: getFontSize(12) }}>?</Text>
                     </TouchableOpacity>
                   </View>
                   <TextInput
                     ref={spookCountRef}
                     style={[
                       styles.input,
                       {
                         fontSize: getFontSize(16),
                         minHeight: Math.max(40, Math.round(getFontSize(40))),
                         paddingVertical: Math.max(8, Math.round(getFontSize(6))),
                         backgroundColor: themeColors.card,
                         color: themeColors.text,
                         borderColor: themeColors.border,
                       },
                     ]}
                     placeholder="Ex: 0"
                     placeholderTextColor={placeholderColor}
                     keyboardType="numeric"
                     value={spookCount}
                     onChangeText={(v) => setSpookCount(normalizeNumberInput(v, false))}
                     returnKeyType="next"
                     onSubmitEditing={() => sideUnitRef.current?.focus()}
                     blurOnSubmit={false}
                   />
                 </>
               )}

               {/* Side unit + help */}
               {!compact && (
                 <>
                   <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 8 }}>
                     <Text style={{ color: themeColors.text, fontSize: getFontSize(16) }}>{t('gachaRolls.form.sideUnitCount')}</Text>
                     <TouchableOpacity
                       onPress={() => setShowSideUnitInfo(true)}
                       accessible
                       accessibilityRole="button"
                       accessibilityLabel={t('gachaRolls.sideUnitHelpLabel') || 'Side unit help'}
                       style={{
                         marginLeft: 8,
                         marginTop: -Math.round(getFontSize(4)),
                         width: Math.round(getFontSize(20)),
                         height: Math.round(getFontSize(20)),
                         borderRadius: Math.round(getFontSize(10)),
                         backgroundColor: themeColors.primary,
                         alignItems: 'center',
                         justifyContent: 'center',
                       }}
                     >
                       <Text style={{ color: '#fff', fontWeight: '700', fontSize: getFontSize(12) }}>?</Text>
                     </TouchableOpacity>
                   </View>
                   <TextInput
                     ref={sideUnitRef}
                     style={[
                       styles.input,
                       {
                         fontSize: getFontSize(16),
                         minHeight: Math.max(40, Math.round(getFontSize(40))),
                         paddingVertical: Math.max(8, Math.round(getFontSize(6))),
                         backgroundColor: themeColors.card,
                         color: themeColors.text,
                         borderColor: themeColors.border,
                       },
                     ]}
                     placeholder="Ex: 0"
                     placeholderTextColor={placeholderColor}
                     keyboardType="numeric"
                     value={sideUnit}
                     onChangeText={(v) => setSideUnit(normalizeNumberInput(v, false))}
                     returnKeyType="done"
                   />
                 </>
               )}

               {/* Items (objets) with help */}
               {!compact && (
                 <>
                   <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 8 }}>
                     <Text style={{ color: themeColors.text, marginBottom: 4, fontSize: getFontSize(16) }}>
                       {t('gachaRolls.form.featuredItems') || 'Objets vedette'}
                     </Text>
                     <TouchableOpacity
                       onPress={() => setShowItemsInfo(true)}
                       accessible
                       accessibilityRole="button"
                       accessibilityLabel={t('gachaRolls.itemsHelpLabel') || 'Items help'}
                       style={{
                         marginLeft: 8,
                         marginTop: -Math.round(getFontSize(4)),
                         width: Math.round(getFontSize(20)),
                         height: Math.round(getFontSize(20)),
                         borderRadius: Math.round(getFontSize(10)),
                         backgroundColor: themeColors.primary,
                         alignItems: 'center',
                         justifyContent: 'center',
                       }}
                     >
                       <Text style={{ color: '#fff', fontWeight: '700', fontSize: getFontSize(12) }}>?</Text>
                     </TouchableOpacity>
                   </View>
                   <TextInput
                     value={featuredItemsCount}
                     onChangeText={(v) => setFeaturedItemsCount(normalizeNumberInput(v, false))}
                     placeholder={t('gachaRolls.form.featuredItemsPlaceholder') || 'Ex: 1'}
                     placeholderTextColor={placeholderColor}
                     keyboardType="numeric"
                     style={[styles.input, { fontSize: getFontSize(16), backgroundColor: themeColors.card, color: themeColors.text, borderColor: themeColors.border }]}
                   />

                   <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 8 }}>
                     <Text style={{ color: themeColors.text, marginBottom: 4, fontSize: getFontSize(16) }}>
                       {t('gachaRolls.form.srItems') || 'Objets SR'}
                     </Text>
                     <TouchableOpacity
                       onPress={() => setShowItemsInfo(true)}
                       accessible
                       accessibilityRole="button"
                       accessibilityLabel={t('gachaRolls.itemsHelpLabel') || 'Items help'}
                       style={{
                         marginLeft: 8,
                         marginTop: -Math.round(getFontSize(4)),
                         width: Math.round(getFontSize(20)),
                         height: Math.round(getFontSize(20)),
                         borderRadius: Math.round(getFontSize(10)),
                         backgroundColor: themeColors.primary,
                         alignItems: 'center',
                         justifyContent: 'center',
                       }}
                     >
                       <Text style={{ color: '#fff', fontWeight: '700', fontSize: getFontSize(12) }}>?</Text>
                     </TouchableOpacity>
                   </View>
                   <TextInput
                     value={srItemsCount}
                     onChangeText={(v) => setSrItemsCount(normalizeNumberInput(v, false))}
                     placeholder={t('gachaRolls.form.srItemsPlaceholder') || 'Ex: 2'}
                     placeholderTextColor={placeholderColor}
                     keyboardType="numeric"
                     style={[styles.input, { fontSize: getFontSize(16), backgroundColor: themeColors.card, color: themeColors.text, borderColor: themeColors.border }]}
                   />
                 </>
               )}

               {/* Notes (multiline, optional, max 200 chars) */}
               {!compact && (
                 <>
                   <Text style={{ color: themeColors.text, marginTop: 8, marginBottom: 4, fontSize: getFontSize(16) }}>{t('gachaRolls.form.notes') || 'Notes'}</Text>
                   <TextInput
                     value={notes}
                     onChangeText={(v) => setNotes(v.slice(0, 200))}
                     placeholder={t('gachaRolls.form.notesPlaceholder') || 'Ajouter des précisions (max 200 caractères)'}
                     placeholderTextColor={placeholderColor}
                     multiline
                     numberOfLines={4}
                     maxLength={200}
                     style={[styles.input, { minHeight: Math.max(80, getFontSize(80)), textAlignVertical: 'top', backgroundColor: themeColors.card, color: themeColors.text, borderColor: themeColors.border }]}
                   />
                   <Text style={{ color: themeColors.placeholder, fontSize: getFontSize(12), textAlign: 'right' }}>{String(notes.length)}/200</Text>
                 </>
               )}

               {/* Date */}
               <Text style={{ color: themeColors.text, marginBottom: 4, fontSize: getFontSize(16) }}>
                 {t('common.date')} <Text style={{ color: '#FF3B30' }}>*</Text>
               </Text>
               <TouchableOpacity
                 style={[styles.input, { justifyContent: 'center', backgroundColor: themeColors.card, borderColor: themeColors.border }]}
                 onPress={() => setShowDatePicker(true)}
                 activeOpacity={0.7}
                 accessibilityRole="button"
                 accessible
                 accessibilityLabel={t('common.date')}
                 accessibilityHint="Open date picker"
               >
                 <Text style={{ color: themeColors.text, fontSize: getFontSize(16) }}>
                   {date.toLocaleDateString(lang === 'en' ? 'en-US' : lang === 'jap' ? 'ja-JP' : 'fr-FR')}
                 </Text>
               </TouchableOpacity>
               {showDatePicker && (
                 <DateTimePicker
                   value={date}
                   mode="date"
                   display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                   onChange={(_, selectedDate) => {
                     setShowDatePicker(false);
                     if (selectedDate && selectedDate <= today) setDate(selectedDate);
                   }}
                   maximumDate={today}
                 />
               )}

               {/* Buttons */}
               <TouchableOpacity
                 style={[styles.addBtn, { backgroundColor: themeColors.primary, opacity: (!featuredCount || !hasResourceOrTicket) ? 0.6 : 1 }]}
                 onPress={handleConfirm}
                 accessibilityRole="button"
                 accessible
                 accessibilityLabel={initial ? t('common.edit') : t('common.add')}
                 activeOpacity={0.85}
                 disabled={!featuredCount || !hasResourceOrTicket}
               >
                 <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: getFontSize(16) }}>
                   {initial ? t('common.edit') : t('common.add')}
                 </Text>
               </TouchableOpacity>

               <TouchableOpacity
                 style={{ marginTop: 16 }}
                 onPress={() => {
                   onClose();
                 }}
               >
                 <Text style={{ color: themeColors.primary, textAlign: 'center', fontSize: getFontSize(16) }}>{t('common.cancel')}</Text>
               </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Spook info modal */}
      <Modal visible={showSpookInfo} transparent animationType="fade" onRequestClose={() => setShowSpookInfo(false)}>
        <TouchableWithoutFeedback onPress={() => setShowSpookInfo(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' }}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={{ width: '90%', backgroundColor: themeColors.card, padding: 16, borderRadius: 12 }}>
                <Text style={{ color: themeColors.text, fontWeight: 'bold', marginBottom: 8, fontSize: getFontSize(18) }}>
                  {t('gachaRolls.spookTitle') || 'Spook — explication'}
                </Text>
                <Text style={{ color: themeColors.placeholder, fontSize: getFontSize(14), lineHeight: Math.round(getFontSize(20)) }}>
                  {t('gachaRolls.spookDescription') ||
                    "Un « spook » (off‑banner) désigne une obtention de haute rareté qui n'est pas l'une des unités ciblées par la bannière. Utilise ce champ pour noter ces tirages hors‑bannière."}
                </Text>
                <TouchableOpacity onPress={() => setShowSpookInfo(false)} style={{ marginTop: 12, alignSelf: 'center' }}>
                  <Text style={{ color: themeColors.primary, fontSize: getFontSize(16) }}>{t('common.ok') || 'OK'}</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Side unit info modal */}
      <Modal visible={showSideUnitInfo} transparent animationType="fade" onRequestClose={() => setShowSideUnitInfo(false)}>
        <TouchableWithoutFeedback onPress={() => setShowSideUnitInfo(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' }}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={{ width: '90%', backgroundColor: themeColors.card, padding: 16, borderRadius: 12 }}>
                <Text style={{ color: themeColors.text, fontWeight: 'bold', marginBottom: 8, fontSize: getFontSize(18) }}>
                  {t('gachaRolls.sideUnitTitle') || 'Side Unit — explication'}
                </Text>
                <Text style={{ color: themeColors.placeholder, fontSize: getFontSize(14), lineHeight: Math.round(getFontSize(20)) }}>
                  {t('gachaRolls.sideUnitDescription') ||
                    "Une « side unit » est une obtention secondaire que tu souhaites suivre séparément des vedettes ou des spooks. Utilise ce champ pour noter ces résultats secondaires."}
                </Text>
                <TouchableOpacity onPress={() => setShowSideUnitInfo(false)} style={{ marginTop: 12, alignSelf: 'center' }}>
                  <Text style={{ color: themeColors.primary, fontSize: getFontSize(16) }}>{t('common.ok') || 'OK'}</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Items info modal */}
      <Modal visible={showItemsInfo} transparent animationType="fade" onRequestClose={() => setShowItemsInfo(false)}>
        <TouchableWithoutFeedback onPress={() => setShowItemsInfo(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' }}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={{ width: '90%', backgroundColor: themeColors.card, padding: 16, borderRadius: 12 }}>
                <Text style={{ color: themeColors.text, fontWeight: 'bold', marginBottom: 8, fontSize: getFontSize(18) }}>
                  {t('gachaRolls.itemsTitle') || 'What are items?'}
                </Text>
                <Text style={{ color: themeColors.placeholder, fontSize: getFontSize(14), lineHeight: Math.round(getFontSize(20)) }}>
                  {t('gachaRolls.itemsDescription') ||
                    "In this app 'items' refer to non-character featured obtainables (e.g. Craft Essences in FGO or weapons in some hoYo gachas). Use these fields to track how many featured / SR items you got during the roll."}
                </Text>
                <TouchableOpacity onPress={() => setShowItemsInfo(false)} style={{ marginTop: 12, alignSelf: 'center' }}>
                  <Text style={{ color: themeColors.primary, fontSize: getFontSize(16) }}>{t('common.ok') || 'OK'}</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  addBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
});
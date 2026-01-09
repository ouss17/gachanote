import { Theme } from '@/constants/Themes';
import { GACHAS } from '@/data/gachas';
import type { WishlistItem } from '@/redux/slices/wishlistSlice';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BlurView } from 'expo-blur';
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, Image, Keyboard, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (item: WishlistItem) => void;
  initial?: WishlistItem | null;
  gachaId: string;
  t?: (k: string) => string;
  getFontSize?: (n: number) => number;
  themeColors?: any;
};

export default function WishlistForm({ visible, onClose, onSubmit, initial, gachaId, t: propT, getFontSize: propGetFontSize, themeColors: propThemeColors }: Props) {
  const insets = useSafeAreaInsets();
  // allow a much wider modal on large screens, keep safe margins on mobile
  const modalWidth = Math.min(920, Dimensions.get('window').width - 32);
  const lang = useSelector((s: any) => s.nationality?.country) || 'fr';
  const texts = require('@/data/texts.json');
  const t = propT ?? ((key: string) => texts[key]?.[lang] || texts[key]?.fr || key);

  const themeMode = useSelector((s: any) => s.theme.mode);
  const themeColorsStore = Theme[themeMode as keyof typeof Theme];
  const themeColors = propThemeColors ?? themeColorsStore;

  // placeholder color like RollForm: light placeholder in dark/night
  const placeholderColor = themeMode === 'dark' || themeMode === 'night' ? '#E5E7EB' : themeColors.placeholder;
  const withAlpha = (hex: string, alpha = 0.6) => {
    try {
      if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex;
      let h = hex.replace('#', '');
      if (h.length === 3) h = h.split('').map(c => c + c).join('');
      const r = parseInt(h.substring(0, 2), 16);
      const g = parseInt(h.substring(2, 4), 16);
      const b = parseInt(h.substring(4, 6), 16);
      return `rgba(${r},${g},${b},${alpha})`;
    } catch {
      return hex;
    }
  };
  const placeholderTextColor = withAlpha(placeholderColor, 0.6);

  // label color: white on dark/night, black on light
  const labelColor = themeMode === 'dark' || themeMode === 'night' ? '#FFFFFF' : '#000000';
  const fontSizeSetting = useSelector((s: any) => s.settings.fontSize);
  const getFontSize = propGetFontSize ?? ((base: number) => {
    if (fontSizeSetting === 'small') return Math.max(10, base - 2);
    if (fontSizeSetting === 'large') return base + 2;
    return base;
  });

  const gachaMeta = GACHAS.find(g => String(g.id) === String(gachaId));
  const availableServers = Array.isArray(gachaMeta?.serverTags) && gachaMeta!.serverTags.length > 0 ? gachaMeta!.serverTags : ['global'];

  const [characterName, setCharacterName] = useState(initial?.characterName ?? '');
  const [server, setServer] = useState<string>(initial?.server ?? availableServers[0]);
  const [imageUri, setImageUri] = useState<string | undefined>(initial?.imageUri);
  const [thumbUri, setThumbUri] = useState<string | undefined>(initial?.imageUri);
  const [releaseDate, setReleaseDate] = useState<Date | null>(initial?.releaseDate ? new Date(initial.releaseDate) : null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [priority, setPriority] = useState<string | undefined>(initial?.priority ? String(initial.priority) : undefined);
  const [monthYearOnly, setMonthYearOnly] = useState<boolean>(false);
  const [monthOnly, setMonthOnly] = useState<string>(() => {
    if (initial?.releaseDate) {
      const d = new Date(initial.releaseDate);
      return String(d.getMonth() + 1).padStart(2, '0');
    }
    return '';
  });
  const [yearOnly, setYearOnly] = useState<string>(() => {
    if (initial?.releaseDate) return String(new Date(initial.releaseDate).getFullYear());
    return '';
  });

  useEffect(() => {
    if (visible) {
      setCharacterName(initial?.characterName ?? '');
      setServer(initial?.server ?? (gachaMeta?.serverTags?.[0] ?? availableServers[0]));
      setImageUri(initial?.imageUri);
      setThumbUri(initial?.imageUri);
      setReleaseDate(initial?.releaseDate ? new Date(initial.releaseDate) : null);
      setNotes(initial?.notes ?? '');
      setPriority(initial?.priority ? String(initial.priority) : '');
      setMonthYearOnly(false);
      setMonthOnly(initial?.releaseDate ? String(new Date(initial.releaseDate).getMonth() + 1).padStart(2, '0') : '');
      setYearOnly(initial?.releaseDate ? String(new Date(initial.releaseDate).getFullYear()) : '');
    }
  }, [visible, initial]);

  useEffect(() => {
    const s = Keyboard.addListener('keyboardDidShow', () => {});
    const h = Keyboard.addListener('keyboardDidHide', () => {});
    return () => { s.remove(); h.remove(); };
  }, []);

  // Inline editor overlay (notes / priority)
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [focusedValue, setFocusedValue] = useState<string>('');
  const inlineInputRef = useRef<TextInput | null>(null);

  useEffect(() => {
    if (!focusedField) return;
    const id = setTimeout(() => inlineInputRef.current?.focus(), 120);
    return () => clearTimeout(id);
  }, [focusedField]);

  const openInlineEditor = (field: string, value: string) => {
    setFocusedField(field);
    setFocusedValue(value ?? '');
  };

  const commitInlineEditor = () => {
    if (!focusedField) return;
    switch (focusedField) {
      case 'notes':
        setNotes(String(focusedValue).slice(0, 500));
        break;
      case 'priority':
        setPriority(String(focusedValue).replace(/[^0-9]/g, '').slice(0, 2));
        break;
      default:
        break;
    }
    setFocusedField(null);
    setFocusedValue('');
  };

  const pickAndSaveImage = async ({ id, maxSize = 1600, quality = 0.8 }: { id: string, maxSize?: number, quality?: number }) => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) throw new Error('Permission denied');

      const res: any = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: (ImagePicker as any).MediaType?.Images ?? (ImagePicker as any).MediaTypeOptions?.Images ?? 'Images',
        quality: 1,
        allowsEditing: false,
      });
      const isCanceled = res?.canceled === true || res?.cancelled === true;
      if (isCanceled) return null;
      const pickedUri: string | undefined = res?.assets?.[0]?.uri ?? res?.uri ?? res?.output?.uri;
      if (!pickedUri) return null;

      let mainManip;
      try {
        mainManip = await ImageManipulator.manipulateAsync(pickedUri, [{ resize: { width: maxSize } }], { compress: quality, format: ImageManipulator.SaveFormat.JPEG });
      } catch {
        mainManip = { uri: pickedUri };
      }
      let thumbManip;
      try {
        thumbManip = await ImageManipulator.manipulateAsync(pickedUri, [{ resize: { width: 512 } }], { compress: Math.max(0.45, quality - 0.25), format: ImageManipulator.SaveFormat.JPEG });
      } catch {
        thumbManip = { uri: mainManip.uri };
      }

      const baseDir = ((FileSystem as any).documentDirectory ?? (FileSystem as any).cacheDirectory ?? '');
      if (!baseDir) return { imageUri: mainManip.uri, thumbUri: thumbManip.uri };
      const dir = `${baseDir}images/`;
      try { await FileSystem.makeDirectoryAsync(dir, { intermediates: true }); } catch {}
      const baseName = `wishlist_${id}_${Date.now()}`;
      const mainDest = `${dir}${baseName}.jpg`;
      const thumbDest = `${dir}${baseName}_thumb.jpg`;
      try {
        await FileSystem.copyAsync({ from: mainManip.uri, to: mainDest });
        await FileSystem.copyAsync({ from: thumbManip.uri, to: thumbDest });
        return { imageUri: mainDest, thumbUri: thumbDest };
      } catch {
        return { imageUri: mainManip.uri, thumbUri: thumbManip.uri };
      }
    } catch (err: any) {
      console.warn('pickAndSaveImage error', err);
      return null;
    }
  };

  const handlePickImage = async () => {
    try {
      const id = initial?.id ?? (typeof Crypto.randomUUID === 'function' ? Crypto.randomUUID() : `tmp_${Date.now()}`);
      const res = await pickAndSaveImage({ id });
      if (!res) return;
      setImageUri(res.imageUri);
      setThumbUri(res.thumbUri);
    } catch (e: any) {
      Alert.alert(t('common.error') || 'Error', e?.message || String(e));
    }
  };

  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth() + 1;

  const inputCommonStyle = {
    color: themeColors.text,
    borderColor: themeColors.border,
    backgroundColor: themeColors.card,
    fontSize: getFontSize(16),
  };

  // accent color for the selected server (use for date text)
  const serverAccentColor = themeColors.primary ?? '#007AFF';

  const handleConfirm = () => {
    if (!characterName.trim()) {
      Alert.alert(t('wishlist.modal.namePlaceholder') || 'Character name required');
      return;
    }

    // validate date / month-year
    if (monthYearOnly) {
      const m = parseInt(monthOnly || '', 10);
      const y = parseInt(yearOnly || '', 10);
      if (!m || !y || m < 1 || m > 12 || String(y).length !== 4) {
        Alert.alert(t('wishlist.modal.monthYearInvalid') || 'Invalid month / year');
        return;
      }
    } else if (releaseDate) {
      const now = new Date();
      const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const picked = new Date(releaseDate.getFullYear(), releaseDate.getMonth(), releaseDate.getDate());
      if (picked < todayOnly) {
        Alert.alert(t('wishlist.modal.pastDateError') || 'Release date cannot be earlier than today');
        return;
      }
    }
    // past dates are allowed now; no further checks

    const id = initial?.id ?? (typeof Crypto.randomUUID === 'function' ? Crypto.randomUUID() : `tmp_${Date.now()}`);
    const item: WishlistItem = {
       id: String(id),
       gachaId: String(gachaId),
       server,
       characterName: characterName.trim(),
       imageUri: imageUri ?? undefined,
       releaseDate: monthYearOnly
        ? `${String(yearOnly).padStart(4,'0')}-${String(monthOnly).padStart(2,'0')}`
        : releaseDate ? releaseDate.toISOString() : undefined,
       notes: notes ? String(notes).slice(0, 500) : undefined,
       priority: priority ? Number(priority) : undefined,
       addedAt: initial?.addedAt ?? new Date().toISOString(),
     };
     onSubmit(item);
     onClose();
   };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        {/* Backdrop blur + tap-to-dismiss keyboard */}
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <View style={StyleSheet.absoluteFill}>
            <BlurView
              intensity={60}
              tint={themeMode === 'dark' || themeMode === 'night' ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          </View>
        </TouchableWithoutFeedback>

        {/* Center horizontally, allow vertical scrolling inside like RollForm */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ScrollView
            contentContainerStyle={{
              width: modalWidth,
              padding: 0,
              paddingBottom: Math.max(24, insets.bottom),
              alignItems: 'center',
            }}
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
          >
            <View
              accessible={true}
              accessibilityLabel={initial ? t('wishlist.modal.editTitle') : t('wishlist.modal.addTitle')}
              style={[
                {
                  backgroundColor: themeColors.card,
                  padding: 20,
                  borderRadius: 12,
                  width: '100%',
                },
                styles.formShadow,
              ]}
            >
              <Text style={{ fontSize: getFontSize(20), fontWeight: '700', color: themeColors.text, marginBottom: 20, textAlign: 'center' }}>
                {initial ? t('wishlist.modal.editTitle') || 'Edit wishlist' : t('wishlist.modal.addTitle')}
              </Text>

              <Text style={{ color: labelColor, marginBottom: 6 }}>{t('wishlist.modal.namePlaceholder')}</Text>
              <TextInput
                value={characterName}
                onChangeText={setCharacterName}
                placeholder={t('wishlist.modal.namePlaceholder')}
                placeholderTextColor={placeholderTextColor}
                style={[styles.input, { backgroundColor: themeColors.card, color: themeColors.text, borderColor: themeColors.border, fontSize: getFontSize(16) }]}
              />

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginVertical: 12 }}>
                {availableServers.map(srv => {
                  const selected = srv === server;
                  return (
                    <TouchableOpacity key={srv} onPress={() => setServer(srv)} style={{
                      paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, marginRight: 8, marginBottom: 8,
                      backgroundColor: selected ? themeColors.primary : themeColors.card, borderWidth: selected ? 0 : 1, borderColor: themeColors.border
                    }}>
                      <Text style={{ color: selected ? themeColors.background : themeColors.text }}>{srv}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                {thumbUri || imageUri ? <Image source={{ uri: thumbUri ?? imageUri }} style={{ width: 72, height: 72, borderRadius: 8, marginRight: 12 }} /> : <View style={{ width: 72, height: 72, borderRadius: 8, backgroundColor: themeColors.background, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}><Text style={{ color: themeColors.placeholder }}>IMG</Text></View>}
                <View style={{ flex: 1 }}>
                  <TouchableOpacity onPress={handlePickImage}><Text style={{ color: themeColors.primary }}>{t('gachaRolls.form.addImage') || 'Add image'}</Text></TouchableOpacity>
                  {imageUri ? <TouchableOpacity onPress={() => { setImageUri(undefined); setThumbUri(undefined); }}><Text style={{ color: themeColors.placeholder, marginTop: 6 }}>{t('gachaRolls.form.removeImage') || 'Remove image'}</Text></TouchableOpacity> : null}
                </View>
              </View>

              <View style={{ marginBottom: 12 }}>

                {/* toggle between exact date and month/year only */}
                <Text style={{ color: labelColor, marginBottom: 6 }}>{t('wishlist.modal.releaseDatePlaceholder')}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <TouchableOpacity onPress={() => setMonthYearOnly(false)} style={{ marginRight: 8 }}>
                    <Text style={{ color: !monthYearOnly ? serverAccentColor : themeColors.placeholder }}>{t('wishlist.modal.exactDate') || 'Exact date'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setMonthYearOnly(true)}>
                    <Text style={{ color: monthYearOnly ? serverAccentColor : themeColors.placeholder }}>{t('wishlist.modal.monthYearOnly') || 'Month / Year only'}</Text>
                  </TouchableOpacity>
                </View>

                {!monthYearOnly ? (
                  <>
                    <TextInput
                      placeholder={t('wishlist.modal.releaseDatePlaceholder')}
                      value={releaseDate ? releaseDate.toLocaleDateString() : ''}
                      onFocus={() => setShowDatePicker(true)}
                      style={[styles.input, { backgroundColor: themeColors.card, color: serverAccentColor, borderColor: themeColors.border, fontSize: getFontSize(16) }]}
                      placeholderTextColor={placeholderTextColor}
                    />
                    {showDatePicker && (
                      <DateTimePicker
                        value={releaseDate ?? new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(_, d) => {
                          setShowDatePicker(false);
                          if (!d) return;
                          const picked = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                          setReleaseDate(picked);
                        }}
                      />
                    )}
                  </>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TextInput
                      placeholder="MM"
                      value={monthOnly}
                      onChangeText={m => setMonthOnly(m.replace(/[^0-9]/g, '').slice(0,2))}
                      keyboardType="numeric"
                      style={[styles.input, { width: 80, marginRight: 8, backgroundColor: themeColors.card, color: serverAccentColor, borderColor: themeColors.border, fontSize: getFontSize(16) }]}
                      placeholderTextColor={placeholderTextColor}
                    />
                    <TextInput
                      placeholder="YYYY"
                      value={yearOnly}
                      onChangeText={y => setYearOnly(y.replace(/[^0-9]/g, '').slice(0,4))}
                      keyboardType="numeric"
                      style={[styles.input, { width: 120, backgroundColor: themeColors.card, color: serverAccentColor, borderColor: themeColors.border, fontSize: getFontSize(16) }]}
                      placeholderTextColor={placeholderTextColor}
                    />
                  </View>
                )}

              </View>

              <Text style={{ color: labelColor, marginBottom: 6 }}>{t('wishlist.modal.notesPlaceholder')}</Text>
              <TouchableOpacity onPress={() => openInlineEditor('notes', notes)} activeOpacity={0.85} accessibilityRole="button">
                <View style={[styles.input, { minHeight: 80, justifyContent: 'center', backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                  <Text style={{ color: notes ? themeColors.text : placeholderTextColor, fontSize: getFontSize(16) }}>
                    {notes !== '' ? notes : (t('wishlist.modal.notesPlaceholder') || '')}
                  </Text>
                </View>
              </TouchableOpacity>

              <Text style={{ color: labelColor, marginBottom: 6 }}>{t('wishlist.modal.priorityPlaceholder')}</Text>
              <TouchableOpacity onPress={() => openInlineEditor('priority', priority ?? '')} activeOpacity={0.85} accessibilityRole="button">
                <View style={[styles.input, { justifyContent: 'center', backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                  <Text style={{ color: priority ? themeColors.text : placeholderTextColor, fontSize: getFontSize(16) }}>
                    {priority !== undefined && priority !== '' ? priority : (t('wishlist.modal.priorityPlaceholder') || 'Priority (1-5)')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Inline editor modal */}
              <Modal visible={!!focusedField} transparent animationType="fade" onRequestClose={() => setFocusedField(null)}>
                <TouchableWithoutFeedback onPress={commitInlineEditor}>
                  <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-start', paddingTop: Math.max(24, insets.top), alignItems: 'center' }}>
                    <TouchableWithoutFeedback onPress={() => {}}>
                      <View style={{ width: '90%', backgroundColor: themeColors.card, borderRadius: 12, padding: 12 }}>
                        <Text style={{ color: themeColors.text, fontWeight: '700', marginBottom: 8, fontSize: getFontSize(16) }}>
                          {focusedField === 'notes' ? (t('wishlist.modal.notesPlaceholder') || 'Notes') : (t('wishlist.modal.priorityPlaceholder') || 'Priority')}
                        </Text>
                        <TextInput
                          ref={inlineInputRef}
                          value={focusedValue}
                          onChangeText={setFocusedValue}
                          placeholder={focusedField === 'notes' ? (t('wishlist.modal.notesPlaceholder') || '') : (t('wishlist.modal.priorityPlaceholder') || '')}
                          placeholderTextColor={placeholderTextColor}
                          keyboardType={focusedField === 'priority' ? 'numeric' : 'default'}
                          multiline={focusedField === 'notes'}
                          maxLength={focusedField === 'notes' ? 500 : 2}
                          onSubmitEditing={commitInlineEditor}
                          blurOnSubmit={true}
                          style={[styles.input, { minHeight: focusedField === 'notes' ? Math.max(120, getFontSize(120)) : undefined, backgroundColor: themeColors.card, color: themeColors.text, borderColor: themeColors.border }]}
                        />
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
                          <TouchableOpacity onPress={() => { setFocusedField(null); setFocusedValue(''); }} style={{ marginRight: 16 }}>
                            <Text style={{ color: themeColors.placeholder, fontSize: getFontSize(14) }}>{t('common.cancel') || 'Cancel'}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={commitInlineEditor}>
                            <Text style={{ color: themeColors.primary, fontSize: getFontSize(14), fontWeight: '700' }}>{t('common.ok') || 'OK'}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableWithoutFeedback>
                  </View>
                </TouchableWithoutFeedback>
              </Modal>

              {/* Buttons styled like RollForm */}
              <TouchableOpacity
                style={[
                  {
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
                  { backgroundColor: themeColors.primary, opacity: (characterName?.trim() ? 1 : 0.6) },
                ]}
                onPress={handleConfirm}
                accessibilityRole="button"
                accessible
                accessibilityLabel={initial ? t('common.edit') : t('common.add')}
                activeOpacity={0.85}
                disabled={!characterName?.trim()}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: getFontSize(16) }}>
                  {initial ? t('common.edit') : t('common.add')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={{ marginTop: 16 }} onPress={onClose}>
                <Text style={{ color: themeColors.primary, textAlign: 'center', fontSize: getFontSize(16) }}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 14, backgroundColor: 'transparent' },
  formShadow: {
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
});
import { Theme } from '@/constants/Themes';
import type { Roll } from '@/redux/slices/rollsSlice';
import { addRoll, updateRoll } from '@/redux/slices/rollsSlice';
import { RootState } from '@/redux/store';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Crypto from 'expo-crypto';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
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
}: Props) {
  const insets = useSafeAreaInsets();
  const today = new Date();
  const dispatch = useDispatch();

  // derive theme / i18n / fontsize from store if not passed
  const themeMode = useSelector((s: RootState) => s.theme.mode);
  const themeColorsStore = Theme[themeMode as keyof typeof Theme];
  const themeColors = propThemeColors ?? themeColorsStore;

  // match MoneyTab: placeholder color is lighter in dark/night mode
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

  // derive resourceType from gachaId if not provided
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
  const [resourceAmount, setResourceAmount] = useState(initial ? String(initial.resourceAmount ?? '') : '');
  const [ticketAmount, setTicketAmount] = useState(initial ? String(initial.ticketAmount ?? '') : '');
  const [featuredCount, setFeaturedCount] = useState(initial ? String(initial.featuredCount ?? '') : '');
  const [spookCount, setSpookCount] = useState(initial ? String(initial.spookCount ?? '') : '');
  const [sideUnit, setSideUnit] = useState(initial ? String(initial.sideUnit ?? '') : '');
  const [date, setDate] = useState<Date>(initial ? new Date(initial.date) : today);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [showSpookInfo, setShowSpookInfo] = useState(false);
  const [showSideUnitInfo, setShowSideUnitInfo] = useState(false);

  useEffect(() => {
    setNameFeatured(initial?.nameFeatured ?? '');
    setResourceAmount(initial ? String(initial.resourceAmount ?? '') : '');
    setTicketAmount(initial ? String(initial.ticketAmount ?? '') : '');
    setFeaturedCount(initial ? String(initial.featuredCount ?? '') : '');
    setSpookCount(initial ? String(initial.spookCount ?? '') : '');
    setSideUnit(initial ? String(initial.sideUnit ?? '') : '');
    setDate(initial ? new Date(initial.date) : today);
  }, [initial, visible]);

  useEffect(() => {
    const s = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
      onModalVisibilityChange?.(true);
    });
    const h = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
      onModalVisibilityChange?.(false);
    });
    return () => {
      s.remove();
      h.remove();
    };
  }, [onModalVisibilityChange]);

  const hasResourceOrTicket = useMemo(() => {
    return (resourceAmount || '').toString().trim() !== '' || (ticketAmount || '').toString().trim() !== '';
  }, [resourceAmount, ticketAmount]);

  const resetForm = () => {
    setNameFeatured('');
    setResourceAmount('');
    setTicketAmount('');
    setFeaturedCount('');
    setSpookCount('');
    setSideUnit('');
    setDate(today);
  };

  const handleConfirm = async () => {
    if (!featuredCount || !date) {
      alert(t('gachaRolls.form.fillRequired') || 'Remplir le nombre de vedettes et la date.');
      return;
    }
    if (!hasResourceOrTicket) {
      alert(t('gachaRolls.form.fillResourceOrTicket') || 'Renseigner ressource ou tickets (au moins un).');
      return;
    }

    const id = initial?.id ?? (typeof Crypto.randomUUID === 'function' ? Crypto.randomUUID() : String(Date.now()));

    // Build stored ISO datetime: keep time to avoid collisions for rolls on same date,
    // but do not display the time in UI. For new roll use current time; for edit preserve original time when available.
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

    const roll: Roll = {
      id,
      gachaId: String(gachaId),
      resourceAmount: resourceAmount ? Number(resourceAmount) : 0,
      ticketAmount: ticketAmount ? Number(ticketAmount) : undefined,
      featuredCount: Number(featuredCount),
      spookCount: Number(spookCount || 0),
      sideUnit: Number(sideUnit || 0),
      date: finalDateIso,
      resourceType,
      nameFeatured: nameFeatured || undefined,
    };
    
    // prefer parent handler if provided for separation of concerns, else dispatch directly
    if (typeof onSubmit === 'function') {
      onSubmit(roll);
    } else {
      if (initial && initial.id) dispatch(updateRoll(roll));
      else dispatch(addRoll(roll));
    }

    onClose();
    resetForm();
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={insets.top + 80}
              style={{ width: '100%', alignItems: 'center' }}
            >
              <ScrollView
                contentContainerStyle={{
                  width: '90%',
                  padding: 0,
                  paddingBottom: keyboardVisible ? Math.max(24, insets.bottom + 20) : Math.max(24, insets.bottom),
                }}
                keyboardShouldPersistTaps="handled"
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

                  {/* Name featured (first) */}
                  <Text style={{ color: themeColors.text, marginBottom: 4, fontSize: getFontSize(16) }}>{t('gachaRolls.form.nameFeatured')}</Text>
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

                  {/* Resource amount */}
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
                      onChangeText={setResourceAmount}
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
                        onChangeText={setTicketAmount}
                        returnKeyType="next"
                      />
                      <Text style={{ marginLeft: 8, color: themeColors.text, fontWeight: 'bold', fontSize: getFontSize(16) }}>
                        {t('common.tickets') || 'Tickets'}
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
                    onChangeText={setFeaturedCount}
                    returnKeyType="next"
                    onSubmitEditing={() => spookCountRef.current?.focus()}
                    blurOnSubmit={false}
                  />

                  {/* Spook count + help */}
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
                    onChangeText={setSpookCount}
                    returnKeyType="next"
                    onSubmitEditing={() => sideUnitRef.current?.focus()}
                    blurOnSubmit={false}
                  />

                  {/* Side unit + help */}
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
                    onChangeText={setSideUnit}
                    returnKeyType="done"
                  />

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
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
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
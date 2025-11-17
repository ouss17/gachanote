import { setLastFeedbackAt } from '@/redux/slices/settingsSlice';
import type { RootState } from '@/redux/store';
import React, { useMemo, useState } from 'react';
import { Alert, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

type Props = {
  visible: boolean;
  onClose: () => void;
  getFontSize: (n: number) => number;
  themeColors: any;
  t: (k: string) => string;
  endpoint?: string;
};

const FEEDBACK_ENDPOINT_DEFAULT = 'https://back-mail-three.vercel.app/api/sendFeedback';
const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_FEEDBACK_LEN = 200;

export default function FeedbackModal({ visible, onClose, getFontSize, themeColors, t, endpoint = FEEDBACK_ENDPOINT_DEFAULT }: Props) {
  const dispatch = useDispatch();
  const lastFeedbackAt = useSelector((s: RootState) => s.settings.lastFeedbackAt);
  const [feedbackText, setFeedbackText] = useState('');
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'general' | 'bug' | 'add_game'>('general');

  const trimmedFeedback = feedbackText.trim();
  const feedbackChars = trimmedFeedback.length;
  const now = Date.now();
  const isOnCooldown = !!lastFeedbackAt && (now - lastFeedbackAt < DAY_MS);
  const cooldownRemainingMs = isOnCooldown ? DAY_MS - (now - (lastFeedbackAt ?? 0)) : 0;
  const cooldownHoursRemaining = Math.ceil(cooldownRemainingMs / (60 * 60 * 1000));
  const meetsLengthRequirement = feedbackType === 'add_game' ? true : feedbackChars >= MIN_FEEDBACK_LEN;
  const canSendFeedback = !sendingFeedback && meetsLengthRequirement && !isOnCooldown;

  const fetchWithTimeout = async (url: string, opts: RequestInit | undefined, timeout = 10000): Promise<Response> => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      return await fetch(url, { ...opts, signal: controller.signal });
    } finally {
      clearTimeout(id);
    }
  };

  const resetForm = () => {
    setFeedbackText('');
    setFeedbackType('general');
  };

  const handleSend = async () => {
    // cooldown
    const nowLocal = Date.now();
    if (lastFeedbackAt && nowLocal - lastFeedbackAt < DAY_MS) {
      const remaining = Math.ceil((DAY_MS - (nowLocal - lastFeedbackAt)) / (60 * 60 * 1000));
      Alert.alert(t('settings.feedback.cooldownTitle'), (t('settings.feedback.cooldownMessage') || '').replace('{hours}', String(remaining)));
      return;
    }

    if (!feedbackText || feedbackText.trim().length === 0) {
      Alert.alert(t('settings.feedback.emptyTitle'), t('settings.feedback.emptyMessage'));
      return;
    }

    const trimmed = feedbackText.trim();
    if (feedbackType === 'add_game') {
      const match = /^ADD_GAME:\s*(.+)/i.exec(trimmed);
      if (!match || !match[1] || match[1].trim().length < 3) {
        Alert.alert(t('settings.feedback.invalidFormatTitle'), t('settings.feedback.invalidFormatMessage'));
        return;
      }
    } else {
      if (trimmed.length < MIN_FEEDBACK_LEN) {
        Alert.alert(t('settings.feedback.tooShortTitle'), (t('settings.feedback.tooShortMessage') || '').replace('{min}', String(MIN_FEEDBACK_LEN)));
        return;
      }
    }

    setSendingFeedback(true);
    try {
      const res = await fetchWithTimeout(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: feedbackText, type: feedbackType }),
      }, 10000);

      if (!res.ok) {
        const errText = await res.text().catch(() => res.statusText);
        throw new Error(errText || (t('settings.feedback.sendError') || 'Erreur lors de l\'envoi'));
      }

      try { dispatch(setLastFeedbackAt(Date.now())); } catch (e) { /* ignore */ }

      resetForm();
      onClose();
      Alert.alert(t('settings.feedback.thankYouTitle'), t('settings.feedback.thankYouMessage'));
    } catch (e) {
      console.error('Send feedback error', e);
      Alert.alert(t('settings.feedback.sendErrorTitle'), t('settings.feedback.sendError'));
    } finally {
      setSendingFeedback(false);
    }
  };

  const typeOptions = useMemo(() => [
    { key: 'general', label: t('settings.feedback.type.general') },
    { key: 'bug', label: t('settings.feedback.type.bug') },
    { key: 'add_game', label: t('settings.feedback.type.add_game') },
  ], [t]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableOpacity
        activeOpacity={1}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
        onPress={() => onClose()}
      >
        <TouchableOpacity activeOpacity={1} style={{ backgroundColor: themeColors.card, padding: 24, borderRadius: 16, width: '90%', maxHeight: '80%' }} onPress={() => {}}>
          <Text style={{ fontWeight: 'bold', fontSize: getFontSize(18), color: themeColors.primary, marginBottom: 12 }}>
            {t('settings.feedback.sendAnonymous')}
          </Text>

          <View style={{ flexDirection: 'row', marginBottom: 12 }}>
            {typeOptions.map(opt => (
              <TouchableOpacity key={opt.key} onPress={() => setFeedbackType(opt.key as any)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginRight: 8, backgroundColor: feedbackType === opt.key ? themeColors.primary : themeColors.card }}>
                <Text style={{ color: feedbackType === opt.key ? themeColors.background : themeColors.text, fontSize: getFontSize(14) }}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            accessibilityLabel={t('settings.feedback.placeholder')}
            accessible
            style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 8, backgroundColor: '#fff', color: '#181818', fontSize: getFontSize(16), minHeight: getFontSize(120), paddingTop: 12 }}
            placeholder={feedbackType === 'add_game' ? t('settings.feedback.addGamePlaceholder') : t('settings.feedback.placeholder')}
            placeholderTextColor={themeColors.placeholder || '#888'}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            value={feedbackText}
            onChangeText={setFeedbackText}
          />

          {feedbackType !== 'add_game' && (
            <Text style={{ color: feedbackChars >= MIN_FEEDBACK_LEN ? '#28A745' : '#D9534F', fontSize: getFontSize(13), marginTop: 4 }}>
              {feedbackChars}/{MIN_FEEDBACK_LEN} {feedbackChars >= MIN_FEEDBACK_LEN
                ? (t('settings.feedback.counter.ready') || '— prêt à envoyer')
                : ((t('settings.feedback.counter.missing') || '— il en manque {remaining}').replace('{remaining}', String(Math.max(0, MIN_FEEDBACK_LEN - feedbackChars))))}
            </Text>
          )}

          {isOnCooldown && (
            <Text style={{ color: '#FF8C00', fontSize: getFontSize(13), marginTop: 6 }}>
              {(t('settings.feedback.cooldownInline') || 'Vous avez déjà envoyé un feedback récemment — réessayez dans ~{hours} heure(s).').replace('{hours}', String(cooldownHoursRemaining))}
            </Text>
          )}

          <TouchableOpacity onPress={() => { void handleSend(); }} disabled={!canSendFeedback} accessibilityState={{ disabled: !canSendFeedback }} style={{ backgroundColor: '#00B894', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 16, opacity: canSendFeedback ? 1 : 0.45 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: getFontSize(16) }}>{t('settings.send')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ marginTop: 16 }} onPress={() => onClose()}>
            <Text style={{ color: themeColors.primary, textAlign: 'center', fontSize: getFontSize(16) }}>{t('settings.close')}</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
import { Theme } from '@/constants/Themes';
import { NEWS } from '@/data/news';
import { markAllSeen, markSeen } from '@/redux/slices/newsSlice';
import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

export default function NewsPage() {
  const dispatch = useDispatch();
  const seenIds = useSelector((s: any) => s.news?.seenIds || []);
  const nationality = useSelector((s: any) => s.nationality?.country) || 'fr';
  // local item type (title/body already localized to string)
  type LocalNewsItem = { id: string; date: string; seen?: boolean; title: string; body?: string };
  const items: LocalNewsItem[] = NEWS.map(n => ({
    id: n.id,
    date: n.date,
    seen: seenIds.includes(n.id),
    title: (n.title as any)[nationality] ?? n.title.fr,
    body: n.body ? ((n.body as any)[nationality] ?? n.body.fr) : undefined,
  }));

  const themeMode = useSelector((s: any) => s.theme.mode);
  const themeColors = Theme[themeMode as keyof typeof Theme];
  const fontSizeSetting = useSelector((s: any) => s.settings.fontSize);
  const texts = require('@/data/texts.json');
  const t = (k: string) => texts[k]?.[nationality] || texts[k]?.fr || k;

  const getFontSize = (base: number) => {
    if (fontSizeSetting === 'small') return base * 0.85;
    if (fontSizeSetting === 'large') return base * 1.25;
    return base;
  };

  const [expanded, setExpanded] = useState<string | null>(null);

  const unreadCount = useMemo(() => items.filter(i => !i.seen).length, [items]);

  const onOpen = (item: LocalNewsItem) => {
    setExpanded(prev => (prev === item.id ? null : item.id));
    if (!seenIds.includes(item.id)) dispatch(markSeen({ id: item.id }));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.background }}>
      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ color: themeColors.text, fontSize: getFontSize(20), fontWeight: '700' }}>{t('news.pageTitle') || 'News'}</Text>
          {unreadCount > 0 ? (
            <TouchableOpacity onPress={() => dispatch(markAllSeen())}>
              <Text style={{ color: themeColors.primary }}>{t('news.markAllRead') || 'Mark all read'}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {items.length === 0 ? (
          <Text style={{ color: themeColors.placeholder }}>{t('news.empty') || 'No news.'}</Text>
        ) : (
          <FlatList
            data={items}
            keyExtractor={i => i.id}
            renderItem={({ item }) => {
              const isExpanded = expanded === item.id;
              return (
                <TouchableOpacity
                  onPress={() => onOpen(item)}
                  style={[styles.item, { backgroundColor: themeColors.card, borderColor: item.seen ? themeColors.border : themeColors.primary }]}
                  activeOpacity={0.9}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ color: themeColors.text, fontWeight: '700', fontSize: getFontSize(16), flex: 1 }} numberOfLines={1}>
                      {item.title}
                    </Text>
                    {/* show red dot only when not seen and not expanded */}
                    {!item.seen && !isExpanded ? <View style={styles.redDot} /> : null}
                  </View>

                  {isExpanded ? (
                    <View style={{ marginTop: 8 }}>
                      <Text style={{ color: themeColors.placeholder, fontSize: getFontSize(12) }}>{new Date(item.date).toLocaleDateString()}</Text>
                      {item.body ? (
                        <Text style={{ color: themeColors.text, marginTop: 8, fontSize: getFontSize(14) }}>
                          {item.body}
                        </Text>
                      ) : null}
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            }}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            contentContainerStyle={{ paddingBottom: 80 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  item: {
    borderWidth: 1.2,
    borderRadius: 10,
    padding: 12,
  },
  redDot: {
    width: 10,
    height: 10,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
    marginLeft: 8,
    elevation: 6,
    shadowColor: '#FF3B30',
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
  },
});
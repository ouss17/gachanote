import WishlistForm from '@/components/WishlistForm';
import { Theme } from '@/constants/Themes';
import { addWishlist, removeWishlist, updateWishlist, WishlistItem } from '@/redux/slices/wishlistSlice';
import { RootState } from '@/redux/store';
import { AntDesign } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

export default function WishlistScreen() {
  const { gachaId } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const items = useSelector((s: RootState) => s.wishlist?.items || []);
  const list = useMemo(() => items.filter(i => i.gachaId === String(gachaId)), [items, gachaId]);
 
  const theme = useSelector((s: any) => s.theme.mode);
  const themeColors = Theme[theme as keyof typeof Theme];
  const fontSize = useSelector((s: any) => s.settings.fontSize);
  // placeholder like in RollsTab
  const placeholderColor = theme === 'dark' || theme === 'night' ? '#E5E7EB' : themeColors.placeholder;

  // i18n
  let lang = useSelector((s: any) => s.nationality.country) || 'fr';
  const texts = require('@/data/texts.json');
  const t = (key: string) => texts[key]?.[lang] || texts[key]?.fr || key;

  function getFontSize(base: number) {
    if (fontSize === 'small') return Math.max(10, base - 2);
    if (fontSize === 'large') return base + 2;
    return base;
  }

  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
  const [query, setQuery] = useState('');
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [releasedFilter, setReleasedFilter] = useState<'all' | 'released' | 'upcoming'>('all');
 
  const handleSubmit = (item: any) => {
    // if editing -> update, otherwise add
    const payload = {
      ...item,
      id: String(item.id),
      gachaId: String(item.gachaId),
      server: item.server,
      characterName: String(item.characterName),
      imageUri: item.imageUri,
      releaseDate: item.releaseDate,
      notes: item.notes,
      priority: item.priority,
      addedAt: item.addedAt ?? new Date().toISOString(),
    };
    if (editingItem) {
      dispatch(updateWishlist(payload));
    } else {
      dispatch(addWishlist(payload));
    }
    setModalVisible(false);
    setEditingItem(null);
  };

  return (
    <SafeAreaView style={{ flex: 1, paddingTop: insets.top, backgroundColor: themeColors.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <AntDesign name="arrow-left" size={getFontSize(20)} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: themeColors.text, fontSize: getFontSize(18) }]}>{t('wishlist.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Page title + short summary */}
      <View style={{ paddingHorizontal: 12, marginBottom: 10 }}>
        <Text style={{ color: themeColors.placeholder, fontSize: getFontSize(13), marginTop: 6 }}>
          {t('wishlist.summary')}
        </Text>
      </View>
      
      {/* Search input */}
      <View style={{ paddingHorizontal: 12, marginBottom: 12 }}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('gachaRolls.searchPlaceholder') || 'Search'}
          placeholderTextColor={placeholderColor}
          style={{
            borderWidth: 1,
            borderColor: themeColors.border,
            borderRadius: 8,
            padding: 12,
            fontSize: getFontSize(16),
            backgroundColor: 'transparent',
            color: themeColors.text,
          }}
        />
      </View>

      {/* Server filter chips + released / upcoming filter */}
      <View style={{ paddingHorizontal: 12, marginBottom: 12 }}>
        {/* servers for this gacha based on wishlist items */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
          <TouchableOpacity
            onPress={() => setSelectedServer(null)}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 12,
              marginRight: 8,
              marginBottom: 8,
              backgroundColor: !selectedServer ? themeColors.primary : themeColors.card,
              borderWidth: !selectedServer ? 0 : 1,
              borderColor: themeColors.border,
            }}
          >
            <Text style={{ color: !selectedServer ? themeColors.background : themeColors.text, fontSize: getFontSize(13), fontWeight: !selectedServer ? '700' : '400' }}>
              {t('servers.all') || 'All'}
            </Text>
          </TouchableOpacity>
          {Array.from(new Set(list.map(i => i.server ?? 'global'))).map(srv => {
            const label = t(`servers.${srv}`) || srv;
            const isSelected = selectedServer === srv;
            return (
              <TouchableOpacity
                key={srv}
                onPress={() => setSelectedServer(isSelected ? null : srv)}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 12,
                  marginRight: 8,
                  marginBottom: 8,
                  backgroundColor: isSelected ? themeColors.primary : themeColors.card,
                  borderWidth: isSelected ? 0 : 1,
                  borderColor: themeColors.border,
                }}
              >
                <Text style={{ color: isSelected ? themeColors.background : themeColors.text, fontSize: getFontSize(13), fontWeight: isSelected ? '700' : '400' }}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        
        {/* released / upcoming filter */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {Object.keys({
            all: t('wishlist.filter.all') || 'All',
            released: t('wishlist.filter.released') || 'Released',
            upcoming: t('wishlist.filter.upcoming') || 'Upcoming',
          }).map(key => {
            const isSel = releasedFilter === key;
            const label = t(`wishlist.filter.${key}`) || ({ all: 'All', released: 'Released', upcoming: 'Upcoming' } as any)[key];
            return (
              <TouchableOpacity
                key={key}
                onPress={() => setReleasedFilter(key as any)}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 12,
                  marginRight: 8,
                  marginBottom: 8,
                  backgroundColor: isSel ? themeColors.primary : themeColors.card,
                  borderWidth: isSel ? 0 : 1,
                  borderColor: themeColors.border,
                }}
              >
                <Text style={{ color: isSel ? themeColors.background : themeColors.text, fontSize: getFontSize(13), fontWeight: isSel ? '700' : '400' }}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* derive filtered list using search/server/release filters */}
      {/* helper: isReleasePast (same logic as renderItem) */}
      <FlatList
        data={
          list.filter(item => {
            // search
            if (query && !String(item.characterName ?? '').toLowerCase().includes(query.trim().toLowerCase())) return false;
            // server
            if (selectedServer && String(item.server ?? 'global') !== String(selectedServer)) return false;
            // release filter
            if (releasedFilter !== 'all') {
              const r = item.releaseDate;
              const isPast = (() => {
                if (!r) return false;
                if (/^\d{4}-\d{2}$/.test(r)) {
                  const [y, m] = r.split('-').map(Number);
                  const now = new Date();
                  const ny = now.getFullYear();
                  const nm = now.getMonth() + 1;
                  return y < ny || (y === ny && m < nm);
                }
                try {
                  const d = new Date(r);
                  const today = new Date();
                  today.setHours(0,0,0,0);
                  return d < today;
                } catch { return false; }
              })();
              if (releasedFilter === 'released' && !isPast) return false;
              if (releasedFilter === 'upcoming' && isPast) return false;
            }
            return true;
          })
        }
        keyExtractor={(i: WishlistItem) => i.id}
        contentContainerStyle={{ padding: 12 }}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 24, color: themeColors?.placeholder ?? '#666' }}>{t('wishlist.empty')}</Text>}
        renderItem={({ item }) => {
          const imgUri = (item as any).thumbUri ?? (item as any).imageUri ?? null;
          const pr = Number(item.priority ?? 0);
          const getPriorityColor = (p: number) => {
            switch (p) {
              case 1: return '#FF3B30';
              case 2: return '#FF9500';
              case 3: return '#FFCC00';
              case 4: return '#34C759';
              case 5: return themeColors.primary ?? '#5856D6';
              default: return themeColors.border;
            }
          };
          const priorityColor = getPriorityColor(pr);

          const formatRelease = (r?: string) => {
            if (!r) return null;
            // YYYY-MM or YYYY-MM-DD or ISO
            if (/^\d{4}-\d{2}$/.test(r)) {
              const [y, m] = r.split('-').map(Number);
              try {
                return new Date(y, m - 1).toLocaleString(lang, { month: 'long', year: 'numeric' });
              } catch { return r; }
            }
            try {
              return new Date(r).toLocaleDateString();
            } catch { return r; }
          };

          const isReleasePast = (r?: string) => {
            if (!r) return false;
            // month-only format YYYY-MM
            if (/^\d{4}-\d{2}$/.test(r)) {
              const [y, m] = r.split('-').map(Number);
              const now = new Date();
              const ny = now.getFullYear();
              const nm = now.getMonth() + 1;
              return y < ny || (y === ny && m < nm);
            }
            try {
              const d = new Date(r);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return d < today;
            } catch {
              return false;
            }
          };

          const released = isReleasePast(item.releaseDate as any);
          const releasedLabelColor = themeColors.success ?? '#34C759';

          return (
            <TouchableOpacity
              activeOpacity={0.9}
              accessibilityRole="button"
              accessible
              accessibilityLabel={`${item.characterName} • ${item.releaseDate ?? ''}`}
              style={{ marginVertical: 8 }}
              onPress={() => {
                setEditingItem(item);
                setModalVisible(true);
              }}
            >
              <View style={{ padding: 8, borderRadius: 8, borderWidth: 1.5, borderColor: priorityColor, backgroundColor: themeColors.card }}>
                {imgUri ? (
                  <View style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 10, backgroundColor: themeColors.background, alignItems: 'center', justifyContent: 'center' }}>
                    <Image
                      source={{ uri: imgUri }}
                      style={{ width: '100%', height: Math.round(getFontSize(140)) }}
                      resizeMode="contain"
                    />
                  </View>
                ) : (
                  <View style={{ width: '100%', height: Math.round(getFontSize(140)), borderRadius: 12, backgroundColor: themeColors.card, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                    <AntDesign name="user" size={getFontSize(36)} color={themeColors.placeholder} />
                  </View>
                )}

                <View style={{ paddingHorizontal: 4 }}>
                  <Text style={{ color: themeColors.text, fontSize: getFontSize(16), fontWeight: '600' }}>{item.characterName}</Text>
                  {item.releaseDate ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                      <Text style={{ color: themeColors.placeholder, fontSize: getFontSize(13) }}>{formatRelease(item.releaseDate)}</Text>
                      {released ? (
                        <Text style={{ color: releasedLabelColor, fontSize: getFontSize(12), marginLeft: 8, fontWeight: '600' }}>
                          {t('wishlist.released') || 'Released'}
                        </Text>
                      ) : null}
                    </View>
                  ) : null}
                  {item.notes ? <Text style={{ color: themeColors.placeholder, fontSize: getFontSize(13), marginTop: 8 }}>{item.notes}</Text> : null}

                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, gap: 8 }}>
                    <TouchableOpacity
                      onPress={(e) => { e.stopPropagation(); dispatch(removeWishlist(item.id)); }}
                      accessibilityRole="button"
                      accessible
                      accessibilityLabel={t('common.delete') || 'Delete'}
                      style={{ padding: 6 }}
                    >
                      <AntDesign name="delete" size={getFontSize(20)} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={{
          position: 'absolute',
          right: 24,
          bottom: 50,
          borderRadius: 32,
          width: 56,
          height: 56,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: themeColors?.primary ?? '#007AFF',
        }}
        accessibilityRole="button"
        accessible
        accessibilityLabel={t('common.add') || 'Add'}
      >
        <Text style={{ color: '#fff', fontSize: getFontSize(28), fontWeight: '700' }}>+</Text>
      </TouchableOpacity>

      <WishlistForm
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setEditingItem(null); }}
        onSubmit={handleSubmit}
        initial={editingItem}
        gachaId={String(gachaId)}
        t={t}
        getFontSize={getFontSize}
        themeColors={themeColors}
      />
    </SafeAreaView>
   );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
  iconBtn: { padding: 8, borderRadius: 8 },
  title: { fontSize: 18, fontWeight: 'bold' },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 50,
    borderRadius: 32,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  item: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#fff', borderRadius: 8, marginBottom: 8, elevation: 1 },
  thumb: { width: 52, height: 52, borderRadius: 6 },
  placeholder: { width: 52, height: 52, borderRadius: 6, backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center' },
  name: { fontWeight: '600' },
  sub: { color: '#666', fontSize: 12 },
  delBtn: { padding: 8 },
  modalWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  modal: { backgroundColor: '#fff', borderRadius: 10, padding: 16 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 8 }
});
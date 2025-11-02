import { useResourceEvents } from '@/redux/hooks/useResourceEvents';
import type { RootState } from '@/redux/store';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

export default function ResourcesScreen({
  getFontSize,
  gachaId, // new optional prop
}: {
  getFontSize: (n: number) => number;
  gachaId?: string | null;
}) {
  const insets = useSafeAreaInsets();
  const lang = useSelector((s: RootState) => s.nationality.country) || 'fr';
  const texts = require('@/data/texts.json');
  const t = (key: string) => texts[key]?.[lang] || texts[key]?.fr || key;

  const { events, createEvent } = useResourceEvents();
  const allRolls = useSelector((s: RootState) => s.rolls.rolls);

  // Build a set of roll ids for the current gacha (if gachaId provided)
  const rollIdsForGacha = new Set<string>();
  if (gachaId) {
    allRolls.filter(r => r.gachaId === String(gachaId)).forEach(r => rollIdsForGacha.add(String(r.id)));
  }

  const AVAILABLE_RESOURCES = [
    { key: 'gems', label: t('resources.gems') || 'Gems' },
    { key: 'tickets', label: t('resources.tickets') || 'Tickets' },
    { key: 'or', label: t('resources.or') || 'Or' },
  ];

  const [resource, setResource] = useState(AVAILABLE_RESOURCES[0].key);
  const [from, setFrom] = useState(new Date(Date.now() - 1000 * 60 * 60 * 24 * 30));
  const [to, setTo] = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [addAmount, setAddAmount] = useState<string>('');
  const [addNote, setAddNote] = useState('');
  const [addDate, setAddDate] = useState(new Date());
  const [sending, setSending] = useState(false);

  // Filter events by selected resource + optional gachaId mapping:
  const filtered = useMemo(() => {
    const fromTs = new Date(from).setHours(0,0,0,0);
    const toTs = new Date(to).setHours(23,59,59,999);

    return events
      .filter(e => e.resource === resource)
      .filter(e => {
        // if gachaId provided, prefer explicit e.gachaId, else match roll sourceId -> roll.gachaId
        if (gachaId) {
          if ((e as any).gachaId) {
            if (String((e as any).gachaId) !== String(gachaId)) return false;
          } else if (e.source === 'roll' && e.sourceId) {
            if (!rollIdsForGacha.has(String(e.sourceId))) return false;
          } else {
            // event without gacha relation -> hide when gachaId specified
            return false;
          }
        }
        const d = new Date(e.date).getTime();
        return d >= fromTs && d <= toTs;
      })
      .sort((a,b) => a.date.localeCompare(b.date));
  }, [events, resource, from, to, gachaId, rollIdsForGacha]);

  const net = filtered.reduce((s, e) => s + e.amount, 0);

  // build daily buckets and cumulative
  const series = useMemo(() => {
    const start = new Date(from);
    start.setHours(0,0,0,0);
    const end = new Date(to);
    end.setHours(0,0,0,0);
    const days: { day: string; daily: number; cumulative: number }[] = [];
    const map = new Map<string, number>();
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const k = d.toISOString().slice(0,10);
      map.set(k, 0);
    }
    filtered.forEach(e => {
      const k = e.date.slice(0,10);
      map.set(k, (map.get(k) || 0) + e.amount);
    });
    let cum = 0;
    Array.from(map.entries()).sort().forEach(([day, daily]) => {
      cum += daily;
      days.push({ day, daily, cumulative: cum });
    });
    return days;
  }, [filtered, from, to]);

  const maxDaily = Math.max(1, ...series.map(s => Math.abs(s.daily)));

  const openAdd = () => {
    setAddAmount('');
    setAddNote('');
    setAddDate(new Date());
    setShowAdd(true);
  };

  const handleAdd = async () => {
    const amt = Number(addAmount);
    if (isNaN(amt) || amt === 0) return;
    setSending(true);
    try {
      createEvent({
        date: addDate.toISOString(),
        resource,
        amount: amt,
        source: 'manual',
        sourceId: null,
        note: addNote || null,
      });
      setShowAdd(false);
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, paddingTop: 16 + insets.top }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
        <Text style={{ fontSize: getFontSize(18), fontWeight: 'bold' }}>{t('resources.title') || 'Resources'}</Text>
        <TouchableOpacity onPress={openAdd}>
          <Text style={{ color: '#007AFF', fontSize: getFontSize(14) }}>{t('resources.addEvent') || 'Add'}</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', marginBottom: 12, alignItems: 'center' }}>
        <TouchableOpacity onPress={() => setShowFromPicker(true)} style={{ marginRight: 12 }}>
          <Text>{t('resources.from') || 'From'}: {from.toISOString().slice(0,10)}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowToPicker(true)} style={{ marginRight: 12 }}>
          <Text>{t('resources.to') || 'To'}: {to.toISOString().slice(0,10)}</Text>
        </TouchableOpacity>
        <View style={{ marginLeft: 'auto', flexDirection: 'row' }}>
          {AVAILABLE_RESOURCES.map(r => (
            <TouchableOpacity key={r.key} onPress={() => setResource(r.key)} style={{ paddingHorizontal: 8, paddingVertical: 6, backgroundColor: resource === r.key ? '#eee' : 'transparent', borderRadius: 6, marginLeft: 6 }}>
              <Text>{r.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {showFromPicker && (
        <DateTimePicker value={from} mode="date" display="default" onChange={(_, d) => { setShowFromPicker(false); if (d) setFrom(d); }} />
      )}
      {showToPicker && (
        <DateTimePicker value={to} mode="date" display="default" onChange={(_, d) => { setShowToPicker(false); if (d) setTo(d); }} />
      )}

      <View style={{ marginBottom: 12 }}>
        <Text style={{ color: '#666' }}>{t('resources.netLabel') || 'Net between dates'}</Text>
        <Text style={{ fontSize: getFontSize(20), fontWeight: 'bold', marginTop: 6 }}>{net}</Text>
      </View>

      <View style={{ height: 140, marginBottom: 12, padding: 8, borderRadius: 8, backgroundColor: '#fafafa' }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 6 }}>
          {series.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#888' }}>{t('resources.noEvents') || 'No events in range'}</Text>
            </View>
          ) : (
            series.map((s, i) => {
              const heightPct = Math.min(1, Math.abs(s.daily) / maxDaily);
              const h = Math.round(heightPct * 110);
              const isPositive = s.daily >= 0;
              return (
                <View key={s.day} style={{ flex: 1, alignItems: 'center', marginHorizontal: 2 }}>
                  <View style={{ width: '100%', height: h, backgroundColor: isPositive ? '#4CAF50' : '#E57373', borderRadius: 4 }} />
                  <Text style={{ fontSize: 10, marginTop: 4 }}>{s.day.slice(5)}</Text>
                </View>
              );
            })
          )}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={{ fontSize: getFontSize(14) }}>{item.date.slice(0,10)}</Text>
            <Text style={{ fontSize: getFontSize(14), fontWeight: '700' }}>{item.amount > 0 ? '+' : ''}{item.amount}</Text>
            <Text style={{ color: '#666', marginLeft: 8 }}>{item.note ?? item.source}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: '#888', textAlign: 'center', marginTop: 16 }}>{t('resources.noEvents') || 'No events in range'}</Text>}
      />

      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'rgba(0,0,0,0.45)' }}>
          <View style={{ width:'92%', backgroundColor:'#fff', padding:16, borderRadius:12 }}>
            <Text style={{ fontWeight:'bold', marginBottom:8 }}>{t('resources.addEvent') || 'Add event'}</Text>
            <TextInput placeholder={t('resources.amount') || 'Amount (+ or -)'} keyboardType="numeric" value={addAmount} onChangeText={setAddAmount} style={styles.input} />
            <TextInput placeholder={t('resources.note') || 'Note'} value={addNote} onChangeText={setAddNote} style={styles.input} />
            <View style={{ flexDirection:'row', justifyContent:'flex-end', marginTop:8 }}>
              <TouchableOpacity onPress={() => setShowAdd(false)} style={{ marginRight:12 }}>
                <Text style={{ color:'#777' }}>{t('common.cancel') || 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAdd} disabled={sending} style={{ backgroundColor:'#007AFF', paddingHorizontal:12, paddingVertical:8, borderRadius:8 }}>
                {sending ? <ActivityIndicator color="#fff" /> : <Text style={{ color:'#fff' }}>{t('common.add') || 'Add'}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { padding: 10, borderBottomWidth: 1, borderColor: '#eee', flexDirection: 'row', alignItems: 'center' },
  input: { borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 10, marginTop: 8 },
});
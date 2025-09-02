import { addRoll, removeRoll, Roll, updateRoll } from '@/redux/slices/rollsSlice';
import { RootState } from '@/redux/store';
import { AntDesign } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Crypto from 'expo-crypto';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useRef, useState } from 'react';
import { Button, FlatList, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import MoneyTab from './MoneyTab';

export default function GachaRollsScreen() {
  const { gachaId } = useLocalSearchParams();
  const router = useRouter();
  const allRolls = useSelector((state: RootState) => state.rolls.rolls);
  const theme = useSelector((state: RootState) => state.theme.mode);
  const isDark = theme === 'dark';
  const [showModal, setShowModal] = useState(false);
  const today = new Date();
  const [resourceAmount, setResourceAmount] = useState('');
  const [nameFeatured, setNameFeatured] = useState('');
  const [featuredCount, setFeaturedCount] = useState('');
  const [spookCount, setSpookCount] = useState('');
  const [sideUnit, setSideUnit] = useState('');
  const [date, setDate] = useState(today);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editRoll, setEditRoll] = useState<Roll | null>(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'list' | 'stats' | 'money'>('list');
  const [showStatsPercent, setShowStatsPercent] = useState({
    featured: false,
    spook: false,
    sideUnit: false,
  });

  const nameFeaturedRef = useRef<TextInput>(null);
  const featuredCountRef = useRef<TextInput>(null);
  const spookCountRef = useRef<TextInput>(null);
  const sideUnitRef = useRef<TextInput>(null);

  // Mémoïse le filtrage pour éviter le warning
  const rolls = useMemo(
    () =>
      allRolls
        .filter(r => r.gachaId === gachaId)
        .filter(r =>
          !search ||
          (r.nameFeatured ?? '')
            .toLowerCase()
            .includes(search.trim().toLowerCase())
        )
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [allRolls, gachaId, search]
  );

  const stats = useMemo(() => {
    return rolls.reduce(
      (acc, roll) => {
        acc.resource += roll.resourceAmount;
        acc.featured += roll.featuredCount;
        acc.spook += roll.spookCount;
        acc.sideUnit += roll.sideUnit ?? 0;
        return acc;
      },
      { resource: 0, featured: 0, spook: 0, sideUnit: 0 }
    );
  }, [rolls]);

  function getResourceType(gachaId: string) {
    switch (gachaId) {
      case 'dbl':
        return 'cc'; // Chrono Crystals
      case 'dokkan':
        return 'ds'; // Dragon Stones
      case 'fgo':
        return 'sq'; // Saint Quartz
      case 'sevenDS':
        return 'gemmes';
      case 'opbr':
        return 'diamants';
      default:
        return 'ressource';
    }
  }

  const dispatch = useDispatch();

  const handleAdd = async () => {
    if (!resourceAmount || !featuredCount || !date) {
      alert('Merci de remplir tous les champs obligatoires.');
      return;
    }

    if (editRoll) {
      // Modification
      const updated: Roll = {
        ...editRoll,
        resourceAmount: Number(resourceAmount),
        featuredCount: Number(featuredCount),
        spookCount: Number(spookCount),
        date: date.toISOString().slice(0, 10),
        nameFeatured: nameFeatured || undefined,
        sideUnit: Number(sideUnit),
        resourceType,
      };
      dispatch(updateRoll(updated));
    } else {
      // Ajout
      let id: string;
      if (typeof Crypto.randomUUID === 'function') {
        id = Crypto.randomUUID();
      } else {
        id = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          Math.random().toString() + Date.now().toString()
        );
      }
      const roll: Roll = {
        id,
        gachaId: String(gachaId),
        resourceAmount: Number(resourceAmount),
        featuredCount: Number(featuredCount),
        spookCount: Number(spookCount),
        date: date.toISOString().slice(0, 10),
        resourceType,
        nameFeatured: nameFeatured || undefined,
        sideUnit: Number(sideUnit),
      };
      dispatch(addRoll(roll));
    }
    setShowModal(false);
    setEditRoll(null);
    setResourceAmount('');
    setNameFeatured('');
    setFeaturedCount('');
    setSpookCount('');
    setSideUnit('');
    setDate(today);
  };

  const resourceType = getResourceType(String(gachaId));
  const insets = useSafeAreaInsets();
  const { cost: multiCost, label: multiLabel } = getMultiCost(String(gachaId));
  const multiCount = multiCost > 0 ? stats.resource / multiCost : 0;

  const featuredPerMulti = multiCount > 0 ? (stats.featured / multiCount).toFixed(2) : '0';
  const spookPerMulti = multiCount > 0 ? (stats.spook / multiCount).toFixed(2) : '0';
  const sideUnitPerMulti = multiCount > 0 ? (stats.sideUnit / multiCount).toFixed(2) : '0';

  // Ajout pour stats argent
  const moneyEntries = useSelector((state: RootState) =>
    state.money.entries.filter(e => e.gachaId === gachaId)
  );
  const currency = useSelector((state: RootState) => state.nationality.currency);

  // Filtrage par date si tu veux (optionnel)
  // const [startDate, setStartDate] = useState<Date | null>(null);
  // const [endDate, setEndDate] = useState<Date | null>(null);
  // const filteredMoneyEntries = moneyEntries.filter(...);

  // Calcul du total dépensé
  const totalMoney = moneyEntries.reduce((sum, entry) => sum + entry.amount, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#181818' : '#fff' }}>
      <View style={{ height: insets.top, backgroundColor: isDark ? '#181818' : '#fff' }} />
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <TouchableOpacity
          onPress={() => router.replace('/')}
          style={{
            padding: 8,
            borderRadius: 8,
            backgroundColor: isDark ? '#232323' : '#eee',
            marginRight: 8,
          }}
        >
          <AntDesign name="arrowleft" size={24} color={isDark ? '#fff' : '#181818'} />
        </TouchableOpacity>
        <Text style={{ color: isDark ? '#fff' : '#181818', fontSize: 18, fontWeight: 'bold' }}>
          Retour à l'accueil
        </Text>
      </View>
      <TextInput
        style={[
          styles.input,
          {
            marginBottom: 24,
            backgroundColor: isDark ? '#232323' : '#fff',
            color: isDark ? '#fff' : '#181818',
          },
        ]}
        placeholder="Rechercher par vedette"
        placeholderTextColor={isDark ? '#aaa' : '#888'}
        value={search}
        onChangeText={setSearch}
      />
      <View style={{ flexDirection: 'row', marginBottom: 16 }}>
        <TouchableOpacity
          style={{
            flex: 1,
            padding: 12,
            backgroundColor: tab === 'list' ? (isDark ? '#444' : '#eee') : 'transparent',
            borderRadius: 8,
            marginRight: 4,
          }}
          onPress={() => setTab('list')}
        >
          <Text style={{ color: isDark ? '#fff' : '#181818', textAlign: 'center', fontWeight: tab === 'list' ? 'bold' : 'normal' }}>
            Liste
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            flex: 1,
            padding: 12,
            backgroundColor: tab === 'stats' ? (isDark ? '#444' : '#eee') : 'transparent',
            borderRadius: 8,
            marginHorizontal: 4,
          }}
          onPress={() => setTab('stats')}
        >
          <Text style={{ color: isDark ? '#fff' : '#181818', textAlign: 'center', fontWeight: tab === 'stats' ? 'bold' : 'normal' }}>
            Statistiques
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            flex: 1,
            padding: 12,
            backgroundColor: tab === 'money' ? (isDark ? '#444' : '#eee') : 'transparent',
            borderRadius: 8,
            marginLeft: 4,
          }}
          onPress={() => setTab('money')}
        >
          <Text style={{ color: isDark ? '#fff' : '#181818', textAlign: 'center', fontWeight: tab === 'money' ? 'bold' : 'normal' }}>
            Argent
          </Text>
        </TouchableOpacity>
      </View>
      {tab === 'list' ? (
        <FlatList
          data={rolls}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View
              style={{
                marginVertical: 8,
                padding: 8,
                borderWidth: 1,
                borderRadius: 8,
                borderColor: isDark ? '#333' : '#ccc',
                backgroundColor: isDark ? '#232323' : '#fff',
              }}
            >
              {item.nameFeatured ? (
                <Text style={{
                  fontWeight: 'bold',
                  fontSize: 18,
                  textAlign: 'center',
                  color: isDark ? '#fff' : '#181818',
                  marginBottom: 8,
                }}>
                  {item.nameFeatured}
                </Text>
              ) : null}
              <Text style={{ color: isDark ? '#fff' : '#181818' }}>
                Date : <Text style={{ fontWeight: 'bold' }}>
                  {new Date(item.date).toLocaleDateString('fr-FR')}
                </Text>
              </Text>
              <Text style={{ color: isDark ? '#fff' : '#181818' }}>
                Ressource : <Text style={{ fontWeight: 'bold' }}>
                  {item.resourceAmount} {item.resourceType?.toUpperCase() ?? ''}
                </Text>
              </Text>
              <Text style={{ color: isDark ? '#fff' : '#181818' }}>
                Vedette : <Text style={{ fontWeight: 'bold' }}>{item.featuredCount}</Text>
              </Text>
              {item.spookCount > 0 && (
                <Text style={{ color: isDark ? '#fff' : '#181818' }}>
                  Spook : <Text style={{ fontWeight: 'bold' }}>{item.spookCount}</Text>
                </Text>
              )}
              <Text style={{ color: isDark ? '#fff' : '#181818' }}>
                Side units : <Text style={{ fontWeight: 'bold' }}>{item.sideUnit > 0 ? item.sideUnit : 0}</Text>
              </Text>
              <View style={{ flexDirection: 'row', marginTop: 8 }}>
                <TouchableOpacity
                  onPress={() => {
                    setEditRoll(item);
                    setResourceAmount(item.resourceAmount.toString());
                    setNameFeatured(item.nameFeatured ?? '');
                    setFeaturedCount(item.featuredCount.toString());
                    setSpookCount(item.spookCount.toString());
                    setSideUnit(item.sideUnit?.toString() ?? '');
                    setDate(new Date(item.date));
                    setShowModal(true);
                  }}
                  style={{ marginRight: 16 }}
                >
                  <AntDesign name="edit" size={20} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => dispatch(removeRoll(item.id))}
                >
                  <AntDesign name="delete" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={{ color: isDark ? '#fff' : '#181818' }}>Aucun roll enregistré.</Text>
          }
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      ) : tab === 'stats' ? (
        <View style={{
          padding: 24,
          borderRadius: 16,
          backgroundColor: isDark ? '#232323' : '#fff',
          marginBottom: 24,
          alignItems: 'center'
        }}>
          <Text style={{ color: isDark ? '#fff' : '#181818', fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
            Statistiques
          </Text>
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            marginVertical: 32,
            rowGap: 24,
            columnGap: 0,
            maxWidth: 400,
            alignSelf: 'center',
          }}>
            <StatCircle
              label={`Ressources\n(${resourceType.toUpperCase()})`}
              value={stats.resource.toString()}
              color={isDark ? '#232323' : '#fff'}
              borderColor="#007AFF"
            />
            <StatCircle
              label="Vedettes"
              value={
                showStatsPercent.featured && stats.resource > 0
                  ? `${((stats.featured / stats.resource) * 100).toFixed(2)}%`
                  : stats.featured.toString()
              }
              color={isDark ? '#232323' : '#fff'}
              borderColor="#FF9500"
              onPress={() =>
                setShowStatsPercent(s => ({ ...s, featured: !s.featured }))
              }
            />
            <StatCircle
              label="Spooks"
              value={
                showStatsPercent.spook && stats.resource > 0
                  ? `${((stats.spook / stats.resource) * 100).toFixed(2)}%`
                  : stats.spook.toString()
              }
              color={isDark ? '#232323' : '#fff'}
              borderColor="#00B894"
              onPress={() =>
                setShowStatsPercent(s => ({ ...s, spook: !s.spook }))
              }
            />
            <StatCircle
              label="Side units"
              value={
                showStatsPercent.sideUnit && stats.resource > 0
                  ? `${((stats.sideUnit / stats.resource) * 100).toFixed(2)}%`
                  : stats.sideUnit?.toString()
              }
              color={isDark ? '#232323' : '#fff'}
              borderColor="#6C47FF"
              onPress={() =>
                setShowStatsPercent(s => ({ ...s, sideUnit: !s.sideUnit }))
              }
            />
          </View>
          {/* Ajout du total argent mis */}
          <View style={{
            marginTop: 24,
            alignItems: 'center',
            backgroundColor: isDark ? '#232323' : '#f2f2f2',
            borderRadius: 12,
            padding: 16,
            width: '100%',
            maxWidth: 320,
          }}>
            <Text style={{ color: isDark ? '#fff' : '#181818', fontWeight: 'bold', fontSize: 16 }}>
              Argent dépensé
            </Text>
            <Text style={{ color: isDark ? '#fff' : '#181818', fontSize: 22, fontWeight: 'bold', marginTop: 8 }}>
              {totalMoney.toLocaleString('fr-FR')} {currency}
            </Text>
          </View>
        </View>
      ) : tab === 'money' ? (
        <MoneyTab gachaId={String(gachaId)} isDark={isDark} />
      ) : null}
      {(['dbl', 'fgo', 'dokkan', 'sevenDS', 'opbr', 'nikke'].includes(String(gachaId))) && multiCost > 0 && (
        <View style={{ marginTop: 24 }}>
          <Text style={{ color: isDark ? '#fff' : '#181818', fontWeight: 'bold', fontSize: 16, textAlign: 'center', marginBottom: 4 }}>
            Taux de drop par {multiLabel} :
          </Text>
          <Text style={{ color: isDark ? '#fff' : '#181818', textAlign: 'center' }}>
            Vedettes : <Text style={{ fontWeight: 'bold' }}>{featuredPerMulti}</Text> / {multiLabel}
          </Text>
          <Text style={{ color: isDark ? '#aaa' : '#888', textAlign: 'center', fontSize: 13 }}>
            ×10 : <Text style={{ fontWeight: 'bold', color: isDark ? '#fff' : '#181818' }}>
              {(Number(featuredPerMulti) * 10).toFixed(2)}
            </Text> / {multiLabel}
          </Text>
          <Text style={{ color: isDark ? '#aaa' : '#888', textAlign: 'center', fontSize: 13 }}>
            ×20 : <Text style={{ fontWeight: 'bold', color: isDark ? '#fff' : '#181818' }}>
              {(Number(featuredPerMulti) * 20).toFixed(2)}
            </Text> / {multiLabel}
          </Text>

          <Text style={{ color: isDark ? '#fff' : '#181818', textAlign: 'center' }}>
            Spooks : <Text style={{ fontWeight: 'bold' }}>{spookPerMulti}</Text> / {multiLabel}
          </Text>
          <Text style={{ color: isDark ? '#aaa' : '#888', textAlign: 'center', fontSize: 13 }}>
            ×10 : <Text style={{ fontWeight: 'bold', color: isDark ? '#fff' : '#181818' }}>
              {(Number(spookPerMulti) * 10).toFixed(2)}
            </Text> / {multiLabel}
          </Text>
          <Text style={{ color: isDark ? '#aaa' : '#888', textAlign: 'center', fontSize: 13 }}>
            ×20 : <Text style={{ fontWeight: 'bold', color: isDark ? '#fff' : '#181818' }}>
              {(Number(spookPerMulti) * 20).toFixed(2)}
            </Text> / {multiLabel}
          </Text>

          <Text style={{ color: isDark ? '#fff' : '#181818', textAlign: 'center' }}>
            Side units : <Text style={{ fontWeight: 'bold' }}>{sideUnitPerMulti}</Text> / {multiLabel}
          </Text>
          <Text style={{ color: isDark ? '#aaa' : '#888', textAlign: 'center', fontSize: 13 }}>
            ×10 : <Text style={{ fontWeight: 'bold', color: isDark ? '#fff' : '#181818' }}>
              {(Number(sideUnitPerMulti) * 10).toFixed(2)}
            </Text> / {multiLabel}
          </Text>
          <Text style={{ color: isDark ? '#aaa' : '#888', textAlign: 'center', fontSize: 13 }}>
            ×20 : <Text style={{ fontWeight: 'bold', color: isDark ? '#fff' : '#181818' }}>
              {(Number(sideUnitPerMulti) * 20).toFixed(2)}
            </Text> / {multiLabel}
          </Text>
        </View>
      )}
      <TouchableOpacity
        style={[
          styles.fab,
          { backgroundColor: isDark ? '#444' : '#007AFF' }
        ]}
        onPress={() => setShowModal(true)}
        activeOpacity={0.7}
      >
        <AntDesign name="plus" size={32} color="#fff" />
      </TouchableOpacity>
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <View style={{
            backgroundColor: isDark ? '#232323' : '#fff',
            padding: 24,
            borderRadius: 16,
            width: '90%',
          }}>
            <Text style={[styles.title, { color: isDark ? '#fff' : '#181818' }]}>
              {editRoll ? 'Modifier le tirage' : 'Ajouter un tirage'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: isDark ? '#fff' : '#181818', marginRight: 4 }}>
                Montant de la ressource <Text style={{ color: '#FF3B30' }}>*</Text>
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Ex: 3000"
                keyboardType="numeric"
                value={resourceAmount}
                onChangeText={setResourceAmount}
                returnKeyType="next"
                onSubmitEditing={() => nameFeaturedRef.current?.focus()}
                blurOnSubmit={false}
              />
              <Text style={{ marginLeft: 8, color: isDark ? '#fff' : '#181818', fontWeight: 'bold' }}>
                {resourceType.toUpperCase()}
              </Text>
            </View>

            <Text style={{ color: isDark ? '#fff' : '#181818', marginBottom: 4 }}>
              Nom de la vedette
            </Text>
            <TextInput
              ref={nameFeaturedRef}
              style={styles.input}
              placeholder="Ex: Goku, Luffy, etc."
              value={nameFeatured}
              onChangeText={setNameFeatured}
              returnKeyType="next"
              onSubmitEditing={() => featuredCountRef.current?.focus()}
              blurOnSubmit={false}
            />

            <Text style={{ color: isDark ? '#fff' : '#181818', marginBottom: 4 }}>
              Nombre de vedettes <Text style={{ color: '#FF3B30' }}>*</Text>
            </Text>
            <TextInput
              ref={featuredCountRef}
              style={styles.input}
              placeholder="Ex: 1"
              keyboardType="numeric"
              value={featuredCount}
              onChangeText={setFeaturedCount}
              returnKeyType="next"
              onSubmitEditing={() => spookCountRef.current?.focus()}
              blurOnSubmit={false}
            />

            <Text style={{ color: isDark ? '#fff' : '#181818', marginBottom: 4 }}>
              Nombre de spooks
            </Text>
            <TextInput
              ref={spookCountRef}
              style={styles.input}
              placeholder="Ex: 0"
              keyboardType="numeric"
              value={spookCount}
              onChangeText={setSpookCount}
              returnKeyType="next"
              onSubmitEditing={() => sideUnitRef.current?.focus()}
              blurOnSubmit={false}
            />

            <Text style={{ color: isDark ? '#fff' : '#181818', marginBottom: 4 }}>
              Nombre de side units featuré
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 0"
              keyboardType="numeric"
              value={sideUnit}
              onChangeText={setSideUnit}
              returnKeyType="done"
            />

            <Text style={{ color: isDark ? '#fff' : '#181818', marginBottom: 4 }}>
              Date <Text style={{ color: '#FF3B30' }}>*</Text>
            </Text>
            <TouchableOpacity
              style={[styles.input, { justifyContent: 'center' }]}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <Text style={{ color: isDark ? '#fff' : '#181818' }}>
                {date.toLocaleDateString('fr-FR')}
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
            <Button title={editRoll ? 'Modifier' : 'Ajouter'} onPress={handleAdd} />
            <TouchableOpacity style={{ marginTop: 16 }} onPress={() => setShowModal(false)}>
              <Text style={{ color: '#007AFF', textAlign: 'center' }}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#fff'
  },
});

function StatCircle({
  label,
  value,
  color,
  borderColor,
  onPress,
}: {
  label: string,
  value: string,
  color: string,
  borderColor: string,
  onPress?: () => void,
}) {
  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      style={{ alignItems: 'center', marginHorizontal: 12 }}
    >
      <View style={{
        width: 90,
        height: 90,
        borderRadius: 45,
        borderWidth: 5,
        borderColor,
        backgroundColor: color,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
      }}>
        <Text style={{ fontWeight: 'bold', fontSize: 20, color: borderColor }}>{value}</Text>
      </View>
      <Text style={{ color: borderColor, fontWeight: 'bold', textAlign: 'center' }}>{label}</Text>
    </TouchableOpacity>
  );
}

function getMultiCost(gachaId: string) {
  switch (gachaId) {
    case 'dbl':
      return { cost: 1000, label: '1000cc', unit: 'multi' };
    case 'fgo':
      return { cost: 30, label: '30 SQ', unit: 'multi' };
    case 'dokkan':
      return { cost: 50, label: '50 DS', unit: 'multi' };
    case 'sevenDS':
      return { cost: 30, label: '30 gemmes', unit: 'multi' };
    case 'opbr':
      return { cost: 50, label: '50 diamants', unit: 'multi' };
    case 'nikke':
      return { cost: 3000, label: '3000 gemmes', unit: 'multi' };
    default:
      return { cost: 0, label: '', unit: '' };
  }
}
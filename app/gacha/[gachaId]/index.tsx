import { addRoll, removeRoll, Roll, updateRoll } from '@/redux/slices/rollsSlice';
import { RootState } from '@/redux/store';
import { AntDesign } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Crypto from 'expo-crypto';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Button, FlatList, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

export default function GachaRollsScreen() {
  const { gachaId } = useLocalSearchParams();
  const router = useRouter();
  const allRolls = useSelector((state: RootState) => state.rolls.rolls);
  const theme = useSelector((state: RootState) => state.theme.mode);
  const isDark = theme === 'dark';
  const [showModal, setShowModal] = useState(false);
  const today = new Date();
  const [resourceAmount, setResourceAmount] = useState('');
  const [moneyField, setMoneyField] = useState('');
  const [featuredCount, setFeaturedCount] = useState('');
  const [spookCount, setSpookCount] = useState('');
  const [date, setDate] = useState(today);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editRoll, setEditRoll] = useState<Roll | null>(null);

  const moneyFieldRef = useRef<TextInput>(null);
  const featuredCountRef = useRef<TextInput>(null);
  const spookCountRef = useRef<TextInput>(null);

  // Mémoïse le filtrage pour éviter le warning
  const rolls = useMemo(
    () => allRolls.filter(r => r.gachaId === gachaId),
    [allRolls, gachaId]
  );

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

  function parseMoneyField(str: string): { amount: number; currency: Roll['currency'] } {
    const match = str.match(/^(\d+)\s*(€|\$|¥|₩)?$/);
    if (!match) return { amount: 0, currency: '€' };
    return {
      amount: Number(match[1]),
      currency: (match[2] as Roll['currency']) || '€',
    };
  }

  const dispatch = useDispatch();

  const handleAdd = async () => {
    if (!resourceAmount || !featuredCount || !spookCount) {
      alert('Merci de remplir tous les champs obligatoires.');
      return;
    }
    const { amount, currency } = parseMoneyField(moneyField);

    if (editRoll) {
      // Modification
      const updated: Roll = {
        ...editRoll,
        resourceAmount: Number(resourceAmount),
        currencyAmount: amount,
        currency,
        featuredCount: Number(featuredCount),
        spookCount: Number(spookCount),
        date: date.toISOString().slice(0, 10),
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
        currencyAmount: amount,
        currency,
        featuredCount: Number(featuredCount),
        spookCount: Number(spookCount),
        date: date.toISOString().slice(0, 10),
        resourceType,
      };
      dispatch(addRoll(roll));
    }
    setShowModal(false);
    setEditRoll(null);
    setResourceAmount('');
    setMoneyField('');
    setFeaturedCount('');
    setSpookCount('');
    setDate(today);
  };

  const resourceType = getResourceType(String(gachaId));

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: isDark ? '#181818' : '#fff' }}>
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
            <Text style={{ color: isDark ? '#fff' : '#181818' }}>Date : {item.date}</Text>
            <Text style={{ color: isDark ? '#fff' : '#181818' }}>
              Ressource : {item.resourceAmount} {item.resourceType?.toUpperCase() ?? ''}
            </Text>
            <Text style={{ color: isDark ? '#fff' : '#181818' }}>
              Dépensé : {item.currencyAmount} {item.currency}
            </Text>
            <Text style={{ color: isDark ? '#fff' : '#181818' }}>Vedette : {item.featuredCount}</Text>
            <Text style={{ color: isDark ? '#fff' : '#181818' }}>Spook : {item.spookCount}</Text>
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              <TouchableOpacity
                onPress={() => {
                  setEditRoll(item);
                  setResourceAmount(item.resourceAmount.toString());
                  setMoneyField(item.currencyAmount ? `${item.currencyAmount}${item.currency}` : '');
                  setFeaturedCount(item.featuredCount.toString());
                  setSpookCount(item.spookCount.toString());
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
      />
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
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Montant de la ressource"
                keyboardType="numeric"
                value={resourceAmount}
                onChangeText={setResourceAmount}
                returnKeyType="next"
                onSubmitEditing={() => moneyFieldRef.current?.focus()}
                blurOnSubmit={false}
              />
              <Text style={{ marginLeft: 8, color: isDark ? '#fff' : '#181818', fontWeight: 'bold' }}>
                {resourceType.toUpperCase()}
              </Text>
            </View>
            <TextInput
              ref={moneyFieldRef}
              style={styles.input}
              placeholder="Montant et devise (ex: 20€, 15$, 3000¥, optionnel)"
              value={moneyField}
              onChangeText={setMoneyField}
              returnKeyType="next"
              onSubmitEditing={() => featuredCountRef.current?.focus()}
              blurOnSubmit={false}
            />
            <TextInput
              ref={featuredCountRef}
              style={styles.input}
              placeholder="Nombre de vedettes"
              keyboardType="numeric"
              value={featuredCount}
              onChangeText={setFeaturedCount}
              returnKeyType="next"
              onSubmitEditing={() => spookCountRef.current?.focus()}
              blurOnSubmit={false}
            />
            <TextInput
              ref={spookCountRef}
              style={styles.input}
              placeholder="Nombre de spooks"
              keyboardType="numeric"
              value={spookCount}
              onChangeText={setSpookCount}
              returnKeyType="done"
              onSubmitEditing={() => setShowDatePicker(true)}
            />
            <TouchableOpacity
              style={[styles.input, { justifyContent: 'center' }]}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <Text style={{ color: isDark ? '#fff' : '#181818' }}>
                Date : {date.toISOString().slice(0, 10)}
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
    </View>
  );
}



const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
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
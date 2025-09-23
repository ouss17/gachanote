import { addMoney, removeMoney } from '@/redux/slices/moneySlice';
import { RootState } from '@/redux/store';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
import { Button, FlatList, Modal, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

/**
 * Onglet "Argent" d'un gacha.
 * Permet d'ajouter, filtrer et supprimer les montants dépensés pour ce gacha.
 *
 * @param gachaId Identifiant du gacha concerné
 * @param isDark Thème sombre ou non
 * @param getFontSize Fonction pour la taille de police dynamique
 */
export default function MoneyTab({ gachaId, isDark, getFontSize }: { gachaId: string, isDark: boolean, getFontSize: (base: number) => number }) {
  const dispatch = useDispatch();
  const currency = useSelector((state: RootState) => state.devise.currency);
  const allMoneyEntries = useSelector((state: RootState) => state.money.entries);

  // Filtre toutes les entrées d'argent pour ce gacha
  const allEntries = useMemo(
    () => allMoneyEntries.filter(e => e.gachaId === gachaId),
    [allMoneyEntries, gachaId]
  );

  // États pour le formulaire d'ajout
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // États pour le filtrage par date
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  /**
   * Liste des entrées filtrées par période sélectionnée.
   * La date de fin est incluse (jusqu'à 23:59:59 du jour choisi).
   */
  const moneyEntries = allEntries
    .filter(e => {
      const d = new Date(e.date);
      let afterStart = true, beforeEnd = true;
      if (startDate) afterStart = d >= new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      if (endDate) {
        // Inclure toute la journée de endDate
        const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999);
        beforeEnd = d <= end;
      }
      return afterStart && beforeEnd;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  /**
   * Ajoute une nouvelle entrée d'argent pour ce gacha.
   * Vide les champs à la confirmation.
   */
  const handleAdd = () => {
    if (!amount || !date) return;
    dispatch(addMoney({
      id: Date.now().toString(),
      gachaId,
      amount: Number(amount),
      date: date.toISOString().slice(0, 10),
    }));
    setShowModal(false);
    setAmount('');
    setDate(new Date());
  };

  // Affiche les filtres de dates si au moins une entrée existe pour ce gacha (même si le filtre ne retourne rien)
  const hasAnyEntry = allEntries.length > 0;

  return (
    <View style={{ flex: 1 }}>
      {/* Filtres de dates, affichés seulement s'il y a au moins une entrée pour ce gacha */}
      {hasAnyEntry && (
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 16, alignItems: 'center' }}>
          {/* Filtre date de début */}
          <View style={{ alignItems: 'center', marginRight: 16 }}>
            <Text style={{ color: isDark ? '#aaa' : '#888', fontSize: getFontSize(12) }}>Date de Début</Text>
            <Text
              onPress={() => setShowStartPicker(true)}
              style={{
                color: isDark ? '#fff' : '#181818',
                borderWidth: 1,
                borderColor: isDark ? '#444' : '#ccc',
                borderRadius: 8,
                padding: 8,
                minWidth: 100,
                textAlign: 'center',
                marginTop: 4,
                fontSize: getFontSize(15),
              }}
            >
              {startDate ? startDate.toLocaleDateString('fr-FR') : 'Choisir'}
            </Text>
            {showStartPicker && (
              <DateTimePicker
                value={startDate || (allEntries[0] ? new Date(allEntries[0].date) : new Date())}
                mode="date"
                display="spinner"
                onChange={(_, date) => {
                  setShowStartPicker(false);
                  if (date) setStartDate(date);
                }}
                maximumDate={endDate || new Date()}
              />
            )}
          </View>
          {/* Filtre date de fin */}
          <View style={{ alignItems: 'center', marginRight: 16 }}>
            <Text style={{ color: isDark ? '#aaa' : '#888', fontSize: getFontSize(12) }}>Date de Fin</Text>
            <Text
              onPress={() => setShowEndPicker(true)}
              style={{
                color: isDark ? '#fff' : '#181818',
                borderWidth: 1,
                borderColor: isDark ? '#444' : '#ccc',
                borderRadius: 8,
                padding: 8,
                minWidth: 100,
                textAlign: 'center',
                marginTop: 4,
                fontSize: getFontSize(15),
              }}
            >
              {endDate ? endDate.toLocaleDateString('fr-FR') : 'Choisir'}
            </Text>
            {showEndPicker && (
              <DateTimePicker
                value={endDate || (allEntries[0] ? new Date(allEntries[0].date) : new Date())}
                mode="date"
                display="spinner"
                onChange={(_, date) => {
                  setShowEndPicker(false);
                  if (date) setEndDate(date);
                }}
                minimumDate={startDate || (allEntries[allEntries.length - 1] ? new Date(allEntries[allEntries.length - 1].date) : undefined)}
                maximumDate={new Date()}
              />
            )}
          </View>
          {/* Bouton de réinitialisation des filtres */}
          <TouchableOpacity
            onPress={() => {
              setStartDate(null);
              setEndDate(null);
            }}
            style={{
              backgroundColor: isDark ? '#444' : '#eee',
              paddingVertical: 8,
              paddingHorizontal: 14,
              borderRadius: 8,
              marginTop: 18,
              marginLeft: 4,
              borderWidth: 1,
              borderColor: isDark ? '#333' : '#ccc',
            }}
          >
            <Text style={{ color: isDark ? '#FFD700' : '#007AFF', fontSize: getFontSize(14), fontWeight: 'bold' }}>
              Réinitialiser
            </Text>
          </TouchableOpacity>
        </View>
      )}
      {/* Liste des montants enregistrés */}
      <FlatList
        data={moneyEntries}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={{
            marginVertical: 8,
            padding: 8,
            borderWidth: 1,
            borderRadius: 8,
            borderColor: isDark ? '#333' : '#ccc',
            backgroundColor: isDark ? '#232323' : '#fff',
          }}>
            <Text style={{ color: isDark ? '#fff' : '#181818', fontSize: getFontSize(16) }}>
              {item.amount} {currency} — {new Date(item.date).toLocaleDateString('fr-FR')}
            </Text>
            <TouchableOpacity
              onPress={() => dispatch(removeMoney(item.id))}
              style={{ marginTop: 4 }}
            >
              <Text style={{ color: '#FF3B30', fontSize: getFontSize(14) }}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ color: isDark ? '#aaa' : '#888', textAlign: 'center', fontSize: getFontSize(15) }}>
            Aucun montant enregistré.
          </Text>
        }
      />
      {/* Bouton pour ouvrir le modal d'ajout */}
      <TouchableOpacity
        style={{
          marginTop: 16,
          backgroundColor: isDark ? '#444' : '#007AFF',
          padding: 12,
          borderRadius: 8,
          alignItems: 'center',
        }}
        onPress={() => setShowModal(true)}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: getFontSize(16) }}>Ajouter un montant</Text>
      </TouchableOpacity>
      {/* Modal d'ajout d'un montant */}
      <Modal visible={showModal} transparent animationType="slide">
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
            <Text style={{ color: isDark ? '#fff' : '#181818', fontWeight: 'bold', fontSize: getFontSize(18), marginBottom: 12 }}>
              Ajouter un montant
            </Text>
            {/* Champ montant */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: isDark ? '#444' : '#ccc',
                  borderRadius: 8,
                  padding: 12,
                  backgroundColor: isDark ? '#232323' : '#fff',
                  color: isDark ? '#fff' : '#181818',
                  flex: 1,
                  fontSize: getFontSize(16),
                }}
                placeholder={`Montant (${currency})`}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
              <Text style={{ marginLeft: 8, color: isDark ? '#fff' : '#181818', fontWeight: 'bold', fontSize: getFontSize(16) }}>
                {currency}
              </Text>
            </View>
            {/* Champ date */}
            <Text style={{ color: isDark ? '#fff' : '#181818', marginBottom: 4, fontSize: getFontSize(16) }}>
              Date
            </Text>
            <TouchableOpacity
              style={{
                borderWidth: 1,
                borderColor: isDark ? '#444' : '#ccc',
                borderRadius: 8,
                padding: 12,
                backgroundColor: isDark ? '#232323' : '#fff',
                marginBottom: 16,
                justifyContent: 'center',
              }}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <Text style={{ color: isDark ? '#fff' : '#181818', fontSize: getFontSize(16) }}>
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
                  if (selectedDate && selectedDate <= new Date()) setDate(selectedDate);
                }}
                maximumDate={new Date()}
              />
            )}
            {/* Bouton de validation */}
            <Button title="Ajouter" onPress={handleAdd} />
            {/* Bouton Annuler */}
            <TouchableOpacity
              style={{ marginTop: 16 }}
              onPress={() => {
                setShowModal(false);
                setAmount('');
                setDate(new Date());
              }}
            >
              <Text style={{ color: '#007AFF', textAlign: 'center' }}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
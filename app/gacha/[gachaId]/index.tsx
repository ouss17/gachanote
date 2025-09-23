import { addRoll, removeRoll, Roll, updateRoll } from '@/redux/slices/rollsSlice';
import { RootState } from '@/redux/store';
import { AntDesign } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Crypto from 'expo-crypto';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useRef, useState } from 'react';
import { Button, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import MoneyTab from './MoneyTab';
import RollsTab from './RollsTab';
import SimulationsTab from './SimulationsTab';
import StatsTab from './StatsTab';

/**
 * Écran principal pour la gestion des rolls d'un gacha.
 * Permet de naviguer entre la liste des rolls, les statistiques et l'onglet argent.
 */
export default function GachaRollsScreen() {
  // Récupère l'identifiant du gacha depuis l'URL
  const { gachaId } = useLocalSearchParams();
  const router = useRouter();

  // Sélectionne tous les rolls depuis le store Redux
  const allRolls = useSelector((state: RootState) => state.rolls.rolls);
  const theme = useSelector((state: RootState) => state.theme.mode);
  const isDark = theme === 'dark';

  // États pour la gestion du formulaire d'ajout/modification de roll
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
  const [tab, setTab] = useState<'list' | 'stats' | 'money' | 'simulations'>('list');
  const [showStatsPercent, setShowStatsPercent] = useState({
    featured: false,
    spook: false,
    sideUnit: false,
  });

  // Références pour la navigation entre les champs du formulaire
  const nameFeaturedRef = useRef<TextInput>(null);
  const featuredCountRef = useRef<TextInput>(null);
  const spookCountRef = useRef<TextInput>(null);
  const sideUnitRef = useRef<TextInput>(null);

  /**
   * Mémoïse la liste des rolls filtrés par gacha et recherche.
   */
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

  /**
   * Calcule les statistiques à partir des rolls filtrés.
   */
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

  /**
   * Retourne le type de ressource utilisé selon le gacha.
   * @param gachaId Identifiant du gacha
   */
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
        return 'gemmes';
    }
  }

  const dispatch = useDispatch();

  /**
   * Réinitialise tous les champs du formulaire d'ajout/modification de roll.
   */
  const resetForm = () => {
    setEditRoll(null);
    setResourceAmount('');
    setNameFeatured('');
    setFeaturedCount('');
    setSpookCount('');
    setSideUnit('');
    setDate(today);
  };

  /**
   * Ajoute ou modifie un roll selon le contexte du formulaire.
   * Vide les champs à la confirmation.
   */
  const handleAdd = async () => {
    if (!resourceAmount || !featuredCount || !date) {
      alert('Merci de remplir tous les champs obligatoires.');
      return;
    }

    if (editRoll) {
      // Modification d'un roll existant
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
      // Ajout d'un nouveau roll
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
    resetForm(); // Vide les champs après confirmation
  };

  // Type de ressource pour le gacha courant
  const resourceType = getResourceType(String(gachaId));
  const insets = useSafeAreaInsets();
  const { cost: multiCost, label: multiLabel } = getMultiCost(String(gachaId));
  const multiCount = multiCost > 0 ? stats.resource / multiCost : 0;


  // Sélectionne les entrées d'argent pour ce gacha
  const moneyEntries = useSelector((state: RootState) =>
    state.money.entries.filter(e => e.gachaId === gachaId)
  );
  const currency = useSelector((state: RootState) => state.devise.currency);

  // Calcul du total d'argent dépensé pour ce gacha
  const totalMoney = moneyEntries.reduce((sum, entry) => sum + entry.amount, 0);

  // Ajout pour la taille de police dynamique
  const fontSize = useSelector((state: RootState) => state.settings.fontSize);
  function getFontSize(base: number) {
    if (fontSize === 'small') return base * 0.85;
    if (fontSize === 'large') return base * 1.25;
    return base;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#181818' : '#fff' }}>
      {/* Espace pour la barre de statut */}
      <View style={{ height: insets.top, backgroundColor: isDark ? '#181818' : '#fff' }} />
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Bouton retour */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            padding: 8,
            borderRadius: 8,
            backgroundColor: isDark ? '#232323' : '#eee',
            marginRight: 8,
          }}
        >
          <AntDesign name="arrow-left" size={getFontSize(24)} color={isDark ? '#fff' : '#181818'} />
        </TouchableOpacity>
        <Text style={{ color: isDark ? '#fff' : '#181818', fontSize: getFontSize(18), fontWeight: 'bold' }}>
          Retour à l'accueil
        </Text>
      </View>

      {/* Menu d'onglets */}
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
          <Text style={{ color: isDark ? '#fff' : '#181818', textAlign: 'center', fontWeight: tab === 'list' ? 'bold' : 'normal', fontSize: getFontSize(16) }}>
            Liste
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            flex: 1,
            padding: 12,
            backgroundColor: tab === 'simulations' ? (isDark ? '#444' : '#eee') : 'transparent',
            borderRadius: 8,
            marginLeft: 4,
          }}
          onPress={() => setTab('simulations')}
        >
          <Text style={{ color: isDark ? '#fff' : '#181818', textAlign: 'center', fontWeight: tab === 'simulations' ? 'bold' : 'normal', fontSize: getFontSize(16) }}>
            Simulations
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
          <Text style={{ color: isDark ? '#fff' : '#181818', textAlign: 'center', fontWeight: tab === 'stats' ? 'bold' : 'normal', fontSize: getFontSize(16) }}>
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
          <Text style={{ color: isDark ? '#fff' : '#181818', textAlign: 'center', fontWeight: tab === 'money' ? 'bold' : 'normal', fontSize: getFontSize(16) }}>
            Argent
          </Text>
        </TouchableOpacity>
      </View>

      {/* Affichage du contenu selon l'onglet sélectionné */}
      {tab === 'list' ? (
        <RollsTab
          rolls={rolls}
          isDark={isDark}
          search={search}
          setSearch={setSearch}
          setEditRoll={setEditRoll}
          setResourceAmount={setResourceAmount}
          setNameFeatured={setNameFeatured}
          setFeaturedCount={setFeaturedCount}
          setSpookCount={setSpookCount}
          setSideUnit={setSideUnit}
          setDate={setDate}
          setShowModal={setShowModal}
          dispatch={dispatch}
          removeRoll={removeRoll}
          nameFeaturedRef={nameFeaturedRef}
          featuredCountRef={featuredCountRef}
          spookCountRef={spookCountRef}
          sideUnitRef={sideUnitRef}
          getFontSize={getFontSize} // Passe la fonction si besoin dans RollsTab
        />
      ) : tab === 'stats' ? (
        <StatsTab
          stats={stats}
          resourceType={resourceType}
          showStatsPercent={showStatsPercent}
          setShowStatsPercent={setShowStatsPercent}
          isDark={isDark}
          totalMoney={totalMoney}
          currency={currency}
          getFontSize={getFontSize}
        />
      ) : tab === 'money' ? (
        <MoneyTab gachaId={String(gachaId)} isDark={isDark} getFontSize={getFontSize} />
      ) : tab === 'simulations' ? (
        <SimulationsTab getFontSize={getFontSize} />
      ) : null}

      {/* Bouton flottant "+" pour ajouter un roll, uniquement dans l'onglet Liste */}
      {tab === 'list' && (
        <TouchableOpacity
          style={[
            styles.fab,
            { backgroundColor: isDark ? '#444' : '#007AFF' }
          ]}
          onPress={() => setShowModal(true)}
          activeOpacity={0.7}
        >
          <AntDesign name="plus" size={getFontSize(32)} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Modal pour ajouter ou modifier un roll */}
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
            <Text style={[styles.title, { color: isDark ? '#fff' : '#181818', fontSize: getFontSize(24) }]}>
              {editRoll ? 'Modifier le tirage' : 'Ajouter un tirage'}
            </Text>
            {/* Champ Montant de la ressource */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: isDark ? '#fff' : '#181818', marginRight: 4, fontSize: getFontSize(16) }}>
                Montant de la ressource <Text style={{ color: '#FF3B30' }}>*</Text>
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0, fontSize: getFontSize(16) }]}
                placeholder="Ex: 3000"
                keyboardType="numeric"
                value={resourceAmount}
                onChangeText={setResourceAmount}
                returnKeyType="next"
                onSubmitEditing={() => nameFeaturedRef.current?.focus()}
                blurOnSubmit={false}
              />
              <Text style={{ marginLeft: 8, color: isDark ? '#fff' : '#181818', fontWeight: 'bold', fontSize: getFontSize(16) }}>
                {resourceType.toUpperCase()}
              </Text>
            </View>

            {/* Champ Nom de la vedette */}
            <Text style={{ color: isDark ? '#fff' : '#181818', marginBottom: 4, fontSize: getFontSize(16) }}>
              Nom de la vedette
            </Text>
            <TextInput
              ref={nameFeaturedRef}
              style={[styles.input, { fontSize: getFontSize(16) }]}
              placeholder="Ex: Goku, Luffy, etc."
              value={nameFeatured}
              onChangeText={setNameFeatured}
              returnKeyType="next"
              onSubmitEditing={() => featuredCountRef.current?.focus()}
              blurOnSubmit={false}
            />

            {/* Champ Nombre de vedettes */}
            <Text style={{ color: isDark ? '#fff' : '#181818', marginBottom: 4, fontSize: getFontSize(16) }}>
              Nombre de vedettes <Text style={{ color: '#FF3B30' }}>*</Text>
            </Text>
            <TextInput
              ref={featuredCountRef}
              style={[styles.input, { fontSize: getFontSize(16) }]}
              placeholder="Ex: 1"
              keyboardType="numeric"
              value={featuredCount}
              onChangeText={setFeaturedCount}
              returnKeyType="next"
              onSubmitEditing={() => spookCountRef.current?.focus()}
              blurOnSubmit={false}
            />

            {/* Champ Nombre de spooks */}
            <Text style={{ color: isDark ? '#fff' : '#181818', marginBottom: 4, fontSize: getFontSize(16) }}>
              Nombre de spooks
            </Text>
            <TextInput
              ref={spookCountRef}
              style={[styles.input, { fontSize: getFontSize(16) }]}
              placeholder="Ex: 0"
              keyboardType="numeric"
              value={spookCount}
              onChangeText={setSpookCount}
              returnKeyType="next"
              onSubmitEditing={() => sideUnitRef.current?.focus()}
              blurOnSubmit={false}
            />

            {/* Champ Nombre de side units featuré */}
            <Text style={{ color: isDark ? '#fff' : '#181818', marginBottom: 4, fontSize: getFontSize(16) }}>
              Nombre de side units featuré
            </Text>
            <TextInput
              style={[styles.input, { fontSize: getFontSize(16) }]}
              placeholder="Ex: 0"
              keyboardType="numeric"
              value={sideUnit}
              onChangeText={setSideUnit}
              returnKeyType="done"
            />

            {/* Champ Date */}
            <Text style={{ color: isDark ? '#fff' : '#181818', marginBottom: 4, fontSize: getFontSize(16) }}>
              Date <Text style={{ color: '#FF3B30' }}>*</Text>
            </Text>
            <TouchableOpacity
              style={[styles.input, { justifyContent: 'center' }]}
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
                  if (selectedDate && selectedDate <= today) setDate(selectedDate);
                }}
                maximumDate={today}
              />
            )}

            {/* Bouton de validation */}
            <Button title={editRoll ? 'Modifier' : 'Ajouter'} onPress={handleAdd} />

            {/* Bouton Annuler */}
            <TouchableOpacity
              style={{ marginTop: 16 }}
              onPress={() => {
                setShowModal(false);
                resetForm();
              }}
            >
              <Text style={{ color: '#007AFF', textAlign: 'center', fontSize: getFontSize(16) }}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/**
 * Styles pour le composant GachaRollsScreen.
 */
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

/**
 * Retourne le coût d'un multi selon le gacha.
 * @param gachaId Identifiant du gacha
 */
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
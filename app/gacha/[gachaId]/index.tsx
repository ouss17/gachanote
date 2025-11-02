import { Theme } from '@/constants/Themes';
import { addRoll, removeRoll, Roll, updateRoll } from '@/redux/slices/rollsSlice';
import { RootState } from '@/redux/store';
import { AntDesign } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Crypto from 'expo-crypto';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Keyboard, KeyboardAvoidingView, Modal, PanResponder, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import MoneyTab from './MoneyTab';
import ResourcesTab from './ResourcesTab'; // ajouté
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

  // bloque le swipe parent quand un modal interne (ex: résultats) est ouvert
  const [childModalOpen, setChildModalOpen] = useState(false);

  // Sélectionne tous les rolls depuis le store Redux
  const allRolls = useSelector((state: RootState) => state.rolls.rolls);
  const theme = useSelector((state: RootState) => state.theme.mode);
  const themeColors = Theme[theme as keyof typeof Theme];
  const isDark = theme === 'dark' || theme === 'night';

  // États pour la gestion du formulaire d'ajout/modification de roll
  const [showModal, setShowModal] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);
  const today = new Date();
  const [resourceAmount, setResourceAmount] = useState('');
  const [ticketAmount, setTicketAmount] = useState(''); // nouveau : tickets optionnels
  const [nameFeatured, setNameFeatured] = useState('');
  const [featuredCount, setFeaturedCount] = useState('');
  const [spookCount, setSpookCount] = useState('');
  const [sideUnit, setSideUnit] = useState('');
  const [date, setDate] = useState(today);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editRoll, setEditRoll] = useState<Roll | null>(null);
  const [search, setSearch] = useState('');
  // const [tab, setTab] = useState<'list' | 'simulations' | 'stats' | 'money' | 'resources'>('list');
  const [tab, setTab] = useState<'list' | 'stats' | 'money'>('list');
  const [showStatsPercent, setShowStatsPercent] = useState({
    featured: false,
    spook: false,
    sideUnit: false,
  });
  const [showSpookInfo, setShowSpookInfo] = useState(false);
  const [showSideUnitInfo, setShowSideUnitInfo] = useState(false);

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
    setTicketAmount('');
    setNameFeatured('');
    setFeaturedCount('');
    setSpookCount('');
    setSideUnit('');
    setDate(today);
  };

  const hasResourceOrTicket = useMemo(() => {
    return (resourceAmount || '').toString().trim() !== '' || (ticketAmount || '').toString().trim() !== '';
  }, [resourceAmount, ticketAmount]);

  /**
   * Ajoute ou modifie un roll selon le contexte du formulaire.
   * Vide les champs à la confirmation.
   */
  const handleAdd = async () => {
    // require featuredCount/date and at least one of resourceAmount or ticketAmount (filled)
    if (!featuredCount || !date) {
      alert('Merci de remplir le nombre de vedettes et la date.');
      return;
    }
    if (!hasResourceOrTicket) {
      alert('Merci de renseigner le montant de la ressource ou le nombre de tickets (au moins un).');
      return;
    }

    if (editRoll) {
      // Modification d'un roll existant
      const updated: Roll = {
        ...editRoll,
        resourceAmount: resourceAmount ? Number(resourceAmount) : 0,
        ticketAmount: ticketAmount ? Number(ticketAmount) : undefined,
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
        resourceAmount: resourceAmount ? Number(resourceAmount) : 0,
        ticketAmount: ticketAmount ? Number(ticketAmount) : undefined,
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

  // Type de ressource déterminé automatiquement pour le gacha courant (non modifiable)
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
    if (fontSize === 'large' ) return base * 1.25;
    return base;
  }

  let lang = useSelector((state: any) => state.nationality.country) || 'fr';
  const texts = require('@/data/texts.json');
  const t = (key: string) => texts[key]?.[lang] || texts[key]?.fr || key;

  // ordre des onglets pour la navigation par swipe (resources ajouté)
  const tabsOrder: Array<'list'| 'stats' | 'money' > = [
    'list',
    // 'simulations',
    'stats',
    'money',
    // 'resources',
  ];

  // animation pour le swipe
  const screenWidth = Dimensions.get('window').width;
  const translateX = useRef(new Animated.Value(0)).current;

  // underline pour les onglets
  const underlineAnim = useRef(new Animated.Value(0)).current;
  const [tabsWidth, setTabsWidth] = useState(0);
  const tabsCount = tabsOrder.length;
  const underlinePadding = 12; // marge interne pour que la barre soit plus courte que la cellule

  // anime la position de la barre quand tab change
  useEffect(() => {
    if (!tabsWidth) return;
    const idx = tabsOrder.indexOf(tab);
    if (idx === -1) return;
    const cellWidth = tabsWidth / tabsCount;
    const targetX = idx * cellWidth + underlinePadding / 2;
    Animated.timing(underlineAnim, { toValue: targetX, duration: 220, useNativeDriver: true }).start();
  }, [tab, tabsWidth]);

  // lit l'option d'inversion du swipe depuis le store
  const invertSwipe = useSelector((state: RootState) => state.settings.invertSwipe);

   // Gestionnaire de swipe horizontal
   const panResponder = PanResponder.create({
     onMoveShouldSetPanResponder: (_, gestureState) => {
       // n'active pas le swipe si la modal est ouverte
       if (showModal || childModalOpen) return false;
       // déclenche si mouvement horizontal significatif
       return Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
     },
     onPanResponderMove: (_, gestureState) => {
      // met à jour la translation pendant le drag
      translateX.setValue(gestureState.dx);
    },
     onPanResponderRelease: (_, gestureState) => {
       const dx = gestureState.dx;
       const threshold = 60; // distance minimale en px pour considérer comme swipe
       if (Math.abs(dx) < threshold) {
        // retourne en place si pas assez de distance
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        return;
       }
 
       const idx = tabsOrder.indexOf(tab);
       if (idx === -1) return;
 
      // rawGoingNext : true si swipe droite->gauche (dx négatif)
      const rawGoingNext = dx < 0;
      // si invertSwipe est true, on inverse la logique
      const goingNext = invertSwipe ? !rawGoingNext : rawGoingNext;
      const targetOff = goingNext ? -screenWidth : screenWidth;
 
      // anime la vue courante hors écran
      Animated.timing(translateX, { toValue: targetOff, duration: 180, useNativeDriver: true }).start(() => {
        // change d'onglet quand l'ancienne vue est sortie
        const nextIdx = goingNext ? (idx + 1) % tabsOrder.length : (idx - 1 + tabsOrder.length) % tabsOrder.length;
        setTab(tabsOrder[nextIdx]);
        // positionne la nouvelle vue hors écran de l'autre côté
        translateX.setValue(goingNext ? screenWidth : -screenWidth);
        // anime la nouvelle vue vers 0
        Animated.timing(translateX, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      });
     },
   });
 
   return (
     <SafeAreaView
       style={{ flex: 1, backgroundColor: themeColors.background }}
       accessible={true}
       accessibilityLabel="Gacha rolls screen"
     >
       {/* Espace pour la barre de statut */}
       <View style={{ height: insets.top, backgroundColor: themeColors.background }} />
       <StatusBar style={isDark ? 'light' : 'dark'} />
 
       {/* Bouton retour */}
       <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
         <TouchableOpacity
           onPress={() => router.back()}
           accessibilityRole="button"
           accessible={true}
           accessibilityLabel={t('gachaRolls.back')}
           style={{
             padding: 8,
             borderRadius: 8,
             backgroundColor: themeColors.card,
             marginRight: 8,
           }}
         >
           <AntDesign name="arrow-left" size={getFontSize(24)} color={themeColors.text} />
         </TouchableOpacity>
         <Text accessibilityRole="header" style={{ color: themeColors.text, fontSize: getFontSize(18), fontWeight: 'bold' }}>
           {t('gachaRolls.back')}
         </Text>
       </View>
 
       {/* Menu d'onglets */}
       <View
         style={{ marginBottom: 16 }}
         onLayout={(e) => setTabsWidth(e.nativeEvent.layout.width)}
       >
         <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            style={{
              flex: 1,
              padding: 12,
              backgroundColor: tab === 'list' ? themeColors.card : 'transparent',
              borderRadius: 8,
              marginRight: 4,
            }}
            onPress={() => setTab('list')}
            accessibilityRole="button"
            accessible={true}
            accessibilityLabel={t('gachaRolls.tabs.list')}
            accessibilityState={{ selected: tab === 'list' }}
          >
            <Text style={{
              color: themeColors.text,
              textAlign: 'center',
              fontWeight: tab === 'list' ? 'bold' : 'normal',
              fontSize: getFontSize(16)
            }}>
              {t('gachaRolls.tabs.list')}
            </Text>
          </TouchableOpacity>
 
          {/* <TouchableOpacity
            style={{
              flex: 1,
              padding: 12,
              backgroundColor: tab === 'simulations' ? themeColors.card : 'transparent',
              borderRadius: 8,
              marginLeft: 4,
            }}
            onPress={() => setTab('simulations')}
            accessibilityRole="button"
            accessible={true}
            accessibilityLabel={t('gachaRolls.tabs.simulations')}
            accessibilityState={{ selected: tab === 'simulations' }}
          >
            <Text style={{
              color: themeColors.text,
              textAlign: 'center',
              fontWeight: tab === 'simulations' ? 'bold' : 'normal',
              fontSize: getFontSize(16)
            }}>
              {t('gachaRolls.tabs.simulations')}
            </Text>
          </TouchableOpacity> */}
 
          <TouchableOpacity
            style={{
              flex: 1,
              padding: 12,
              backgroundColor: tab === 'stats' ? themeColors.card : 'transparent',
              borderRadius: 8,
              marginHorizontal: 4,
            }}
            onPress={() => setTab('stats')}
            accessibilityRole="button"
            accessible={true}
            accessibilityLabel={t('gachaRolls.tabs.stats')}
            accessibilityState={{ selected: tab === 'stats' }}
          >
            <Text style={{
              color: themeColors.text,
              textAlign: 'center',
              fontWeight: tab === 'stats' ? 'bold' : 'normal',
              fontSize: getFontSize(16)
            }}>
              {t('gachaRolls.tabs.stats')}
            </Text>
          </TouchableOpacity>
 
          <TouchableOpacity
            style={{
              flex: 1,
              padding: 12,
              backgroundColor: tab === 'money' ? themeColors.card : 'transparent',
              borderRadius: 8,
              marginLeft: 4,
            }}
            onPress={() => setTab('money')}
            accessibilityRole="button"
            accessible={true}
            accessibilityLabel={t('gachaRolls.tabs.money')}
            accessibilityState={{ selected: tab === 'money' }}
          >
            <Text style={{
              color: themeColors.text,
              textAlign: 'center',
              fontWeight: tab === 'money' ? 'bold' : 'normal',
              fontSize: getFontSize(16)
            }}>
              {t('gachaRolls.tabs.money')}
            </Text>
          </TouchableOpacity>
 
          {/* <TouchableOpacity
            style={{
              flex: 1,
              padding: 12,
              backgroundColor: tab === 'resources' ? themeColors.card : 'transparent',
              borderRadius: 8,
              marginLeft: 4,
            }}
            onPress={() => setTab('resources')}
            accessibilityRole="button"
            accessible={true}
            accessibilityLabel={t('gachaRolls.tabs.resources') || 'Resources'}
            accessibilityState={{ selected: tab === 'resources' }}
          >
            <Text style={{
              color: themeColors.text,
              textAlign: 'center',
              fontWeight: tab === 'resources' ? 'bold' : 'normal',
              fontSize: getFontSize(16)
            }}>
              {t('gachaRolls.tabs.resources') || 'Resources'}
            </Text>
          </TouchableOpacity> */}
         </View>
         {/* underline animée */}
         {tabsWidth > 0 && (
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              bottom: -2,
              left: 0,
              width: tabsWidth / tabsCount - underlinePadding,
              height: 3,
              borderRadius: 2,
              backgroundColor: themeColors.primary,
              transform: [{ translateX: underlineAnim }],
            }}
          />
         )}
       </View>
 
       {/* Contenu des onglets — enveloppé pour capturer les swipes */}
       <Animated.View style={{ flex: 1, transform: [{ translateX }] }} {...panResponder.panHandlers}>
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
            setTicketAmount={setTicketAmount} // passe le setter pour préremplissage à l'édition
             onModalVisibilityChange={(v: boolean) => setChildModalOpen(v)}
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
           <MoneyTab
             gachaId={String(gachaId)}
             isDark={isDark}
             getFontSize={getFontSize}
             onModalVisibilityChange={(v: boolean) => setChildModalOpen(v)}
           />
         ) : tab === 'simulations' ? (
           <SimulationsTab getFontSize={getFontSize} onModalVisibilityChange={(v: boolean) => setChildModalOpen(v)} />
         ) : tab === 'resources' ? (
           <ResourcesTab getFontSize={getFontSize} gachaId={String(gachaId)} onModalVisibilityChange={(v: boolean) => setChildModalOpen(v)} />
         ) : null}
       </Animated.View>
 
       {/* Bouton flottant "+" pour ajouter un roll, uniquement dans l'onglet Liste */}
       {tab === 'list' && (
         <TouchableOpacity
           style={{
             position: 'absolute',
             right: 24,
             bottom: 50,
             borderRadius: 32,
             width: 56,
             height: 56,
             alignItems: 'center',
             justifyContent: 'center',
             backgroundColor: themeColors.primary,
             elevation: 4,
             shadowColor: '#000',
             shadowOpacity: 0.2,
             shadowRadius: 4,
             shadowOffset: { width: 0, height: 2 },
           }}
           onPress={() => setShowModal(true)}
           activeOpacity={0.7}
           accessibilityRole="button"
           accessible={true}
           accessibilityLabel={t('common.add') || 'Add roll'}
         >
           <Text style={{ color: '#fff', fontSize: getFontSize(32), fontWeight: 'bold' }}>+</Text>
         </TouchableOpacity>
       )}
 
       {/* Modal pour ajouter ou modifier un roll */}
       <Modal
         visible={showModal}
         animationType="slide"
         transparent={true}
         onRequestClose={() => setShowModal(false)}
       >
         {/* Tap outside to dismiss keyboard */}
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.5)',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            {/* KeyboardAvoidingView + ScrollView allow scrolling when keyboard is open */}
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={insets.top + 80}
              style={{ width: '100%', alignItems: 'center' }}
            >
              <ScrollView
                ref={scrollRef}
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
                  accessibilityLabel={editRoll ? t('gachaRolls.modal.editTitle') : t('gachaRolls.modal.addTitle')}
                  style={{
                    backgroundColor: themeColors.card,
                    padding: 24,
                    borderRadius: 16,
                    width: '100%',
                  }}
                >
                  <Text accessibilityRole="header" style={[styles.title, { color: isDark ? '#fff' : '#181818', fontSize: getFontSize(24) }]}>
                    {editRoll ? t('gachaRolls.modal.editTitle') : t('gachaRolls.modal.addTitle')}
                  </Text>
 
                  {/* Champ Nom de la vedette (maintenant premier) */}
                  <Text style={{ color: isDark ? '#fff' : '#181818', marginBottom: 4, fontSize: getFontSize(16) }}>
                    {t('gachaRolls.form.nameFeatured')}
                  </Text>
                  <TextInput
                    accessibilityLabel={t('gachaRolls.form.nameFeatured')}
                    ref={nameFeaturedRef}
                    style={[styles.input, { fontSize: getFontSize(16) }]}
                    placeholder="Ex: Goku, Luffy, etc."
                    value={nameFeatured}
                    onChangeText={setNameFeatured}
                    returnKeyType="next"
                    onSubmitEditing={() => featuredCountRef.current?.focus()}
                    blurOnSubmit={false}
                  />

                  {/* Champ Montant de la ressource (sous le nom) */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                    <Text style={{ color: isDark ? '#fff' : '#181818', marginRight: 4, fontSize: getFontSize(16) }}>
                      {t('gachaRolls.form.resourceAmount')} <Text style={{ color: '#FF3B30' }}>*</Text>
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <TextInput
                      style={[styles.input, { flex: 1, marginBottom: 0, fontSize: getFontSize(16) }]}
                      placeholder="Ex: 3000"
                      keyboardType="numeric"
                      value={resourceAmount}
                      onChangeText={setResourceAmount}
                      returnKeyType="next"
                    />
                    <Text style={{ marginLeft: 8, color: isDark ? '#fff' : '#181818', fontWeight: 'bold', fontSize: getFontSize(16) }}>
                      {String(resourceType).toUpperCase()}
                    </Text>
                  </View>

                  {/* Champ Tickets (sous la ressource) */}
                  <View style={{ marginBottom: 4 }}>
                    <Text style={{ color: isDark ? '#fff' : '#181818', marginBottom: 4, fontSize: getFontSize(14) }}>
                      {t('gachaRolls.form.ticketAmount') || 'Tickets'} <Text style={{ color: '#FF3B30' }}>*</Text>
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <TextInput
                        style={[styles.input, { flex: 1, marginBottom: 0, fontSize: getFontSize(16) }]}
                        placeholder="Ex: 10"
                        keyboardType="numeric"
                        value={ticketAmount}
                        onChangeText={setTicketAmount}
                        returnKeyType="next"
                      />
                      <Text style={{ marginLeft: 8, color: isDark ? '#fff' : '#181818', fontWeight: 'bold', fontSize: getFontSize(16) }}>
                        {t('common.tickets') || 'Tickets'}
                      </Text>
                    </View>
                  </View>

                  {/* Note explicative : * signifie "au moins un des deux champs (ressource ou tickets) doit être rempli" */}
                  <Text style={{ color: themeColors.placeholder, fontSize: getFontSize(12), marginBottom: 12 }}>
                    <Text style={{ color: '#FF3B30' }}>*</Text> {t('gachaRolls.form.resourceOrTicketsNote') || 'Remplir au moins le montant de la ressource ou le nombre de tickets (ou les deux).'}
                  </Text>
 
                  {/* Champ Nombre de vedettes */}
                  <Text style={{ color: isDark ? '#fff' : '#181818', marginBottom: 4, fontSize: getFontSize(16) }}>
                    {t('gachaRolls.form.featuredCount')} <Text style={{ color: '#FF3B30' }}>*</Text>
                  </Text>
                  <TextInput
                    accessibilityLabel={t('gachaRolls.form.featuredCount')}
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
 
                  {/* Champ "Nombre de spook" (label + petit "?" + champ) */}
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 8 }}>
                  <Text style={{ color: themeColors.text, fontSize: getFontSize(16) }}>
                    {t('gachaRolls.form.spookCount')}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowSpookInfo(true)}
                    accessible={true}
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
                   accessibilityLabel={t('gachaRolls.form.spookCount')}
                   ref={spookCountRef}
                   style={[
                     styles.input,
                     {
                       fontSize: getFontSize(16),
                       minHeight: Math.max(40, Math.round(getFontSize(40))),
                       paddingVertical: Math.max(8, Math.round(getFontSize(6))),
                     },
                   ]}
                   placeholder="Ex: 0"
                   placeholderTextColor={themeColors.placeholder}
                   keyboardType="numeric"
                   value={spookCount}
                   onChangeText={setSpookCount}
                   returnKeyType="next"
                   onSubmitEditing={() => sideUnitRef.current?.focus()}
                   blurOnSubmit={false}
                 />
 
                 {/* Champ Nombre de side units (label + petit "?" + champ) */}
                 <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 8 }}>
                   <Text style={{ color: isDark ? '#fff' : '#181818', fontSize: getFontSize(16) }}>
                     {t('gachaRolls.form.sideUnitCount')}
                   </Text>
                   <TouchableOpacity
                     onPress={() => setShowSideUnitInfo(true)}
                     accessible={true}
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
                   accessibilityLabel={t('gachaRolls.form.sideUnitCount')}
                   style={[
                     styles.input,
                     {
                       fontSize: getFontSize(16),
                       minHeight: Math.max(40, Math.round(getFontSize(40))),
                       paddingVertical: Math.max(8, Math.round(getFontSize(6))),
                     },
                   ]}
                   placeholder="Ex: 0"
                   placeholderTextColor={themeColors.placeholder}
                   keyboardType="numeric"
                   value={sideUnit}
                   onChangeText={setSideUnit}
                   returnKeyType="done"
                 />
 
                 {/* Champ Date */}
                 <Text style={{ color: isDark ? '#fff' : '#181818', marginBottom: 4, fontSize: getFontSize(16) }}>
                   {t('common.date')} <Text style={{ color: '#FF3B30' }}>*</Text>
                 </Text>
                 <TouchableOpacity
                   style={[styles.input, { justifyContent: 'center' }]}
                   onPress={() => setShowDatePicker(true)}
                   activeOpacity={0.7}
                   accessibilityRole="button"
                   accessible={true}
                   accessibilityLabel={t('common.date')}
                   accessibilityHint="Open date picker"
                 >
                   <Text
                     style={{
                       color: theme === 'dark' || theme === 'night' ? '#181818' : '#181818',
                       fontSize: getFontSize(16),
                     }}
                   >
                     {date.toLocaleDateString(
                       lang === 'en' ? 'en-US' : lang === 'jap' ? 'ja-JP' : 'fr-FR'
                     )}
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
 
                 {/* Bouton de validation (style similaire à Simulations) */}
                 <TouchableOpacity
                   style={[
                     styles.addBtn,
                     { backgroundColor: themeColors.primary, opacity: (!featuredCount || !hasResourceOrTicket) ? 0.6 : 1 }
                   ]}
                   onPress={handleAdd}
                   accessibilityRole="button"
                   accessible={true}
                   accessibilityLabel={editRoll ? t('common.edit') : t('common.add')}
                   activeOpacity={0.85}
                   disabled={!featuredCount || !hasResourceOrTicket}
                 >
                   <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: getFontSize(16) }}>
                     {editRoll ? t('common.edit') : t('common.add')}
                   </Text>
                 </TouchableOpacity>
 
                 {/* Bouton Annuler */}
                 <TouchableOpacity
                   style={{ marginTop: 16 }}
                   onPress={() => {
                     setShowModal(false);
                     resetForm();
                   }}
                 >
                   <Text style={{ color: '#007AFF', textAlign: 'center', fontSize: getFontSize(16) }}>{t('common.cancel')}</Text>
                 </TouchableOpacity>
               </View>
             </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
       </Modal>
 
       {/* Modal explicative pour "spook" */}
       <Modal
         visible={showSpookInfo}
         transparent
         animationType="fade"
         onRequestClose={() => setShowSpookInfo(false)}
       >
         <TouchableWithoutFeedback onPress={() => setShowSpookInfo(false)}>
           <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' }}>
             <TouchableWithoutFeedback onPress={() => { /* block propagation so pressing inside won't close */ }}>
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
 
       {/* Modal explicative pour "side unit" */}
       <Modal
         visible={showSideUnitInfo}
         transparent
         animationType="fade"
         onRequestClose={() => setShowSideUnitInfo(false)}
       >
         <TouchableWithoutFeedback onPress={() => setShowSideUnitInfo(false)}>
           <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' }}>
             <TouchableWithoutFeedback onPress={() => { /* block propagation so pressing inside won't close */ }}>
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
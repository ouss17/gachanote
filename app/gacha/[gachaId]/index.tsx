import { Theme } from '@/constants/Themes';
import { GACHAS } from '@/data/gachas';
import { RootState } from '@/redux/store';
import { AntDesign } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import MoneyTab from './MoneyTab';
import ResourcesTab from './ResourcesTab';
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

  // (Formulaire extrait vers components/RollForm + RollsTab)
  const today = new Date();
  const [search, setSearch] = useState('');
  // const [tab, setTab] = useState<'list' | 'simulations' | 'stats' | 'money' | 'resources'>('list');
  // const [tab, setTab] = useState<'list' | 'simulations' | 'stats' | 'money'>('list');

  const [tab, setTab] = useState<'list' | 'stats' | 'money'>('list');
  const [showStatsPercent, setShowStatsPercent] = useState({
    featured: false,
    spook: false,
    sideUnit: false,
  });
  /**
   * Mémorise la liste des rolls filtrés par gacha et recherche.
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

  // derive resourceType from GACHAS metadata (falls back to 'gemmes')
  const gachaMeta = GACHAS.find(g => g.id === gachaId);
  const resourceType = gachaMeta?.resourceType ?? 'gemmes';

  const insets = useSafeAreaInsets();


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
       // n'active pas le swipe si un modal enfant est ouvert (RollForm géré dans RollsTab)
       if (childModalOpen) return false;
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
             gachaId={String(gachaId)}
             resourceType={resourceType}
             getFontSize={getFontSize}
             t={t}
             themeMode={theme}
             onModalVisibilityChange={(v: boolean) => setChildModalOpen(v)}
           />
         ) : tab === 'stats' ? (
           <StatsTab
             rolls={rolls}
             resourceType={resourceType}
             showStatsPercent={showStatsPercent}
             setShowStatsPercent={setShowStatsPercent}
             isDark={isDark}
             totalMoney={totalMoney}
             currency={currency}
             getFontSize={getFontSize}
             gachaId={String(gachaId)}
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
import { GACHAS } from '@/data/gachas';
import { RootState } from '@/redux/store';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, G } from 'react-native-svg';
import { useSelector } from 'react-redux';

/**
 * Génère dynamiquement les couleurs pour chaque gacha.
 */
const GACHA_COLORS: Record<string, string> = {};
const colorPalette = [
  '#6C47FF', '#007AFF', '#FF9500', '#00B894', '#FF3B30', '#FFB300',
  '#E17055', '#00B8D4', '#A3CB38', '#8854D0', '#F97F51', '#1B9CFC',
  '#B33771', '#3B3B98', '#BDC581', '#FD7272', '#2C3A47', '#F8EFBA'
];
GACHAS.forEach((gacha, idx) => {
  GACHA_COLORS[gacha.id] = colorPalette[idx % colorPalette.length];
});

/**
 * Écran des statistiques globales d'argent dépensé sur tous les gachas.
 * Affiche un graphique, un camembert de répartition et permet de filtrer par période.
 */
export default function StatistiquesScreen() {
  // Sélection des données Redux et gestion du thème
  const moneyEntries = useSelector((state: RootState) => state.money.entries);
  const theme = useSelector((state: RootState) => state.theme.mode);
  const currency = useSelector((state: RootState) => state.devise.currency);
  const fontSize = useSelector((state: RootState) => state.settings.fontSize);
  const isDark = theme === 'dark';

  // Fonction utilitaire pour la taille de police
  function getFontSize(base: number) {
    if (fontSize === 'small') return base * 0.85;
    if (fontSize === 'large') return base * 1.25;
    return base;
  }

  // États pour le filtrage par date et l'affichage du tooltip
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [tooltip, setTooltip] = useState<{ value: number; x: number; y: number } | null>(null);

  // Réinitialise les dates au focus de l'écran
  useFocusEffect(
    useCallback(() => {
      setStartDate(null);
      setEndDate(null);
    }, [])
  );

  /**
   * Retourne la clé mois/année à partir d'une date.
   */
  function getMonthKey(date: string) {
    const d = new Date(date);
    return format(d, 'MM/yyyy');
  }

  /**
   * Convertit une clé mois/année en objet Date.
   */
  function monthKeyToDate(monthKey: string) {
    const [m, y] = monthKey.split('/').map(Number);
    return new Date(y, m - 1, 1);
  }

  // Récupère les dates min et max des entrées money
  const allMoneyDates = moneyEntries.map(r => new Date(r.date));
  const minDate = allMoneyDates.length ? new Date(Math.min(...allMoneyDates.map(d => d.getTime()))) : new Date();
  const maxDate = allMoneyDates.length ? new Date(Math.max(...allMoneyDates.map(d => d.getTime()))) : new Date();

  /**
   * Génère tous les mois entre deux dates.
   */
  function getAllMonthsBetween(min: Date, max: Date) {
    const months = [];
    let d = new Date(min.getFullYear(), min.getMonth(), 1);
    const end = new Date(max.getFullYear(), max.getMonth(), 1);
    while (d <= end) {
      months.push(format(d, 'MM/yyyy'));
      d.setMonth(d.getMonth() + 1);
    }
    return months;
  }
  const allMonths = getAllMonthsBetween(minDate, maxDate);

  // Liste des gachas présents dans les entrées money
  const gachas = Array.from(new Set(moneyEntries.map(r => r.gachaId)));

  // Filtrage des mois selon la période sélectionnée
  const filteredMonths = allMonths.filter(month => {
    const date = monthKeyToDate(month);
    let afterStart = true, beforeEnd = true;
    if (startDate) afterStart = date >= new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    if (endDate) beforeEnd = date <= new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    return afterStart && beforeEnd;
  });

  // Prépare les datasets pour le graphique (un par gacha)
  const datasets = gachas.map(gachaId => {
    const data = filteredMonths.map(month => {
      const sum = moneyEntries
        .filter(r => r.gachaId === gachaId && getMonthKey(r.date) === month)
        .reduce((acc, r) => acc + (r.amount || 0), 0);
      return sum;
    });
    return {
      data,
      color: () => GACHA_COLORS[gachaId] || '#888',
      strokeWidth: 2,
      gachaId,
    };
  });

  const insets = useSafeAreaInsets();

  // Filtre les entrées money selon la période sélectionnée
  const filteredMoneyEntries = moneyEntries.filter(entry => {
    const d = new Date(entry.date);
    let afterStart = true, beforeEnd = true;
    if (startDate) afterStart = d >= new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    if (endDate) {
      // Inclure toute la journée de endDate (jusqu'à 23:59:59.999)
      const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999);
      beforeEnd = d <= end;
    }
    return afterStart && beforeEnd;
  });

  // Calcule la somme totale par gacha sur la période filtrée
  const totalByGacha: Record<string, number> = {};
  filteredMoneyEntries.forEach(entry => {
    totalByGacha[entry.gachaId] = (totalByGacha[entry.gachaId] || 0) + entry.amount;
  });
  const total = Object.values(totalByGacha).reduce((a, b) => a + b, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#181818' : '#fff', padding: 16 }}>
      <View style={{ height: insets.top, backgroundColor: isDark ? '#181818' : '#fff' }} />
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Text style={{
        color: isDark ? '#fff' : '#181818',
        fontSize: getFontSize(22),
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center'
      }}>
        Statistiques globales
      </Text>
      {/* Filtres de dates, affichés seulement s'il y a des entrées */}
      {moneyEntries.length > 0 && (
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 16, alignItems: 'center' }}>
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
              {startDate ? format(startDate, 'dd/MM/yyyy') : 'Choisir'}
            </Text>
            {showStartPicker && (
              <DateTimePicker
                value={startDate || minDate}
                mode="date"
                display="spinner"
                onChange={(_, date) => {
                  setShowStartPicker(false);
                  if (date) setStartDate(date);
                }}
                minimumDate={minDate}
                maximumDate={endDate || maxDate}
              />
            )}
          </View>
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
              {endDate ? format(endDate, 'dd/MM/yyyy') : 'Choisir'}
            </Text>
            {showEndPicker && (
              <DateTimePicker
                value={endDate || maxDate}
                mode="date"
                display="spinner"
                onChange={(_, date) => {
                  setShowEndPicker(false);
                  if (date) setEndDate(date);
                }}
                minimumDate={startDate || minDate}
                maximumDate={maxDate}
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
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Affichage du graphique si données */}
        {filteredMonths.length > 0 && datasets.length > 0 ? (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ maxHeight: 340 }}
            >
              <ScrollView
                style={{ minWidth: Dimensions.get('window').width - 32 }}
                contentContainerStyle={{ minHeight: 260 }}
                showsVerticalScrollIndicator={true}
              >
                <LineChart
                  data={{
                    labels: filteredMonths.map(month => {
                      const [m, y] = month.split('/').map(Number);
                      return format(new Date(y, m - 1, 1), 'MMM yy', { locale: fr });
                    }),
                    datasets,
                    legend: gachas.map(g => g.toUpperCase()),
                  }}
                  width={Math.max(Dimensions.get('window').width - 32, filteredMonths.length * 70)}
                  height={Math.max(260, gachas.length * 40)}
                  yAxisSuffix={currency}
                  chartConfig={{
                    backgroundColor: isDark ? '#181818' : '#fff',
                    backgroundGradientFrom: isDark ? '#232323' : '#fff',
                    backgroundGradientTo: isDark ? '#232323' : '#fff',
                    decimalPlaces: 0,
                    color: (opacity = 1) => isDark
                      ? `rgba(108, 71, 255, ${opacity})`
                      : `rgba(108, 71, 255, ${opacity})`,
                    labelColor: () => isDark ? '#fff' : '#181818',
                    style: { borderRadius: 16 },
                    propsForBackgroundLines: { stroke: isDark ? '#444' : '#ddd' },
                  }}
                  bezier
                  style={{ borderRadius: 16 }}
                  onDataPointClick={({ value, x, y }) => {
                    setTooltip({ value, x, y });
                    setTimeout(() => setTooltip(null), 2000);
                  }}
                />
              </ScrollView>
            </ScrollView>
            <View style={{ alignItems: 'center', marginTop: 4, marginBottom: 8 }}>
              <MaterialIcons name="arrow-forward-ios" size={getFontSize(20)} color={isDark ? '#aaa' : '#888'} />
              <Text style={{ color: isDark ? '#aaa' : '#888', fontSize: getFontSize(12) }}>Glissez pour voir plus</Text>
            </View>
          </>
        ) : (
          <Text style={{ color: isDark ? '#aaa' : '#888', textAlign: 'center', marginTop: 32, fontSize: getFontSize(15) }}>
            Aucune donnée à afficher.
          </Text>
        )}

        {/* Total dépensé et camembert de répartition */}
        <View style={{ marginTop: 32, alignItems: 'center' }}>
          {(() => {
            // Préparation des segments pour le camembert
            const radius = 60;
            const strokeWidth = 24;
            const center = radius + strokeWidth / 2;
            const circumference = 2 * Math.PI * radius;
            let prevPercent = 0;

            const segments = Object.entries(totalByGacha)
              .filter(([_, v]) => v > 0)
              .map(([gachaId, value]) => {
                const percent = total ? value / total : 0;
                const dasharray = `${percent * circumference} ${circumference - percent * circumference}`;
                const rotate = prevPercent * 360;
                prevPercent += percent;
                return { gachaId, dasharray, rotate };
              });

            return (
              <>
                <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Svg width={center * 2} height={center * 2}>
                    <G rotation={-90} origin={`${center},${center}`}>
                      {segments.map((seg, i) => (
                        <Circle
                          key={seg.gachaId}
                          cx={center}
                          cy={center}
                          r={radius}
                          stroke={GACHA_COLORS[seg.gachaId] || '#888'}
                          strokeWidth={strokeWidth}
                          strokeDasharray={seg.dasharray}
                          strokeLinecap="butt"
                          fill="none"
                          rotation={seg.rotate}
                          origin={`${center},${center}`}
                        />
                      ))}
                    </G>
                  </Svg>
                  <View style={{
                    position: 'absolute',
                    left: 0, right: 0, top: 0, bottom: 0,
                    alignItems: 'center', justifyContent: 'center',
                    height: center * 2,
                  }}>
                    <Text style={{
                      color: isDark ? '#fff' : '#181818',
                      fontWeight: 'bold',
                      fontSize: getFontSize(20),
                      textAlign: 'center',
                    }}>
                      {total.toLocaleString('fr-FR')} {currency}
                    </Text>
                    <Text style={{
                      color: isDark ? '#aaa' : '#888',
                      fontSize: getFontSize(13),
                      textAlign: 'center',
                    }}>
                      Total dépensé
                    </Text>
                  </View>
                </View>
                {/* Légende du camembert */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {Object.entries(totalByGacha)
                    .filter(([_, v]) => v > 0)
                    .map(([gachaId, value]) => {
                      const percent = total ? ((value / total) * 100).toFixed(1) : 0;
                      const gacha = GACHAS.find(g => g.id === gachaId);
                      return (
                        <View key={gachaId} style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 8, marginVertical: 2 }}>
                          <View style={{
                            width: 14, height: 14, borderRadius: 7,
                            backgroundColor: GACHA_COLORS[gachaId] || '#888',
                            marginRight: 4,
                          }} />
                          <Text style={{ color: isDark ? '#fff' : '#181818', fontSize: getFontSize(13) }}>
                            {gacha?.name || gachaId} ({percent}%)
                          </Text>
                        </View>
                      );
                    })}
                </View>
              </>
            );
          })()}
        </View>

        {/* Tooltip sur le graphique */}
        {tooltip && (
          <View
            style={{
              position: 'absolute',
              left: tooltip.x - 40,
              top: tooltip.y + 10,
              backgroundColor: isDark ? '#232323' : '#fff',
              borderRadius: 8,
              paddingVertical: 4,
              paddingHorizontal: 12,
              borderWidth: 1,
              borderColor: isDark ? '#444' : '#ccc',
              zIndex: 10,
              shadowColor: '#000',
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 4,
            }}
            pointerEvents="none"
          >
            <Text style={{ color: isDark ? '#fff' : '#181818', fontWeight: 'bold', fontSize: getFontSize(15) }}>
              {tooltip.value.toLocaleString('fr-FR')} {currency}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
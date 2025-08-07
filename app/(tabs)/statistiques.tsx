import { GACHAS } from '@/data/gachas';
import { RootState } from '@/redux/store';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Dimensions, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, G } from 'react-native-svg';
import { useSelector } from 'react-redux';

// Génère dynamiquement les couleurs (tu peux personnaliser)
const GACHA_COLORS: Record<string, string> = {};
const colorPalette = [
  '#6C47FF', '#007AFF', '#FF9500', '#00B894', '#FF3B30', '#FFB300',
  '#E17055', '#00B8D4', '#A3CB38', '#8854D0', '#F97F51', '#1B9CFC',
  '#B33771', '#3B3B98', '#BDC581', '#FD7272', '#2C3A47', '#F8EFBA'
];
GACHAS.forEach((gacha, idx) => {
  GACHA_COLORS[gacha.id] = colorPalette[idx % colorPalette.length];
});

export default function StatistiquesScreen() {
  const rolls = useSelector((state: RootState) => state.rolls.rolls);
  const theme = useSelector((state: RootState) => state.theme.mode);
  const isDark = theme === 'dark';
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Génère la liste complète des mois/années entre le plus ancien et le plus récent roll
  function getMonthKey(date: string) {
    const d = new Date(date);
    return format(d, 'MM/yyyy');
  }

  function monthKeyToDate(monthKey: string) {
    const [m, y] = monthKey.split('/').map(Number);
    return new Date(y, m - 1, 1);
  }

  // Trouver le min et max date
  const allRollDates = rolls.map(r => new Date(r.date));
  const minDate = allRollDates.length ? new Date(Math.min(...allRollDates.map(d => d.getTime()))) : new Date();
  const maxDate = allRollDates.length ? new Date(Math.max(...allRollDates.map(d => d.getTime()))) : new Date();

  // Génère tous les mois entre minDate et maxDate
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

  // Liste des gachas présents dans les rolls
  const gachas = Array.from(new Set(rolls.map(r => r.gachaId)));

  // Filtrage par mois/année si sélectionné
  const filteredMonths = allMonths.filter(month => {
    const date = monthKeyToDate(month);
    let afterStart = true, beforeEnd = true;
    if (startDate) afterStart = date >= new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    if (endDate) beforeEnd = date <= new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    return afterStart && beforeEnd;
  });

  // Datasets pour chaque gacha, pour chaque mois (0 si pas de roll ce mois)
  const datasets = gachas.map(gachaId => {
    const data = filteredMonths.map(month => {
      const sum = rolls
        .filter(r => r.gachaId === gachaId && getMonthKey(r.date) === month)
        .reduce((acc, r) => acc + (r.currencyAmount || 0), 0);
      return sum;
    });
    return {
      data,
      color: () => GACHA_COLORS[gachaId] || '#888',
      strokeWidth: 2,
      gachaId,
    };
  });

  // Pour les pickers
  const monthsList = [
    { label: 'Janvier', value: '01' },
    { label: 'Février', value: '02' },
    { label: 'Mars', value: '03' },
    { label: 'Avril', value: '04' },
    { label: 'Mai', value: '05' },
    { label: 'Juin', value: '06' },
    { label: 'Juillet', value: '07' },
    { label: 'Août', value: '08' },
    { label: 'Septembre', value: '09' },
    { label: 'Octobre', value: '10' },
    { label: 'Novembre', value: '11' },
    { label: 'Décembre', value: '12' },
  ];
  const yearsList = Array.from(
    new Set(allMonths.map(m => m.split('/')[1]))
  ).sort();

  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#181818' : '#fff', padding: 16 }}>
      <View style={{ height: insets.top, backgroundColor: isDark ? '#181818' : '#fff' }} />
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Text style={{
        color: isDark ? '#fff' : '#181818',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center'
      }}>
        Statistiques globales
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 16 }}>
        <Picker
          selectedValue={selectedMonth}
          style={{ width: 140, color: isDark ? '#fff' : '#181818' }}
          onValueChange={setSelectedMonth}
          prompt="Mois"
        >
          <Picker.Item label="Tous les mois" value={null} />
          {monthsList.map(m => (
            <Picker.Item key={m.value} label={m.label} value={m.value} />
          ))}
        </Picker>
        <Picker
          selectedValue={selectedYear}
          style={{ width: 120, color: isDark ? '#fff' : '#181818' }}
          onValueChange={setSelectedYear}
          prompt="Année"
        >
          <Picker.Item label="Toutes les années" value={null} />
          {yearsList.map(y => (
            <Picker.Item key={y} label={y} value={y} />
          ))}
        </Picker>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 16 }}>
        <View style={{ alignItems: 'center', marginRight: 16 }}>
          <Text style={{ color: isDark ? '#aaa' : '#888', fontSize: 12 }}>Date de Début</Text>
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
            }}
          >
            {startDate ? format(startDate, 'MMM yyyy', { locale: fr }) : 'Choisir'}
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
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: isDark ? '#aaa' : '#888', fontSize: 12 }}>Date de Fin</Text>
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
            }}
          >
            {endDate ? format(endDate, 'MMM yyyy', { locale: fr }) : 'Choisir'}
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
      </View>
      {filteredMonths.length > 0 && datasets.length > 0 ? (
        <LineChart
          data={{
            labels: filteredMonths.map(month => {
              const [m, y] = month.split('/').map(Number);
              return format(new Date(y, m - 1, 1), 'MMM yy', { locale: fr });
            }),
            datasets,
            legend: gachas.map(g => g.toUpperCase()),
          }}
          width={Dimensions.get('window').width - 32}
          height={260}
          yAxisSuffix="€"
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
        />
      ) : (
        <Text style={{ color: isDark ? '#aaa' : '#888', textAlign: 'center', marginTop: 32 }}>
          Aucune donnée à afficher.
        </Text>
      )}
      {/* Total dépensé et barre de répartition */}
      <View style={{ marginTop: 32, alignItems: 'center' }}>
        {(() => {
          // Somme totale par gacha
          const totalByGacha: Record<string, number> = {};
          rolls.forEach(r => {
            totalByGacha[r.gachaId] = (totalByGacha[r.gachaId] || 0) + (r.currencyAmount || 0);
          });
          const total = Object.values(totalByGacha).reduce((a, b) => a + b, 0);

          // Prépare les segments pour le cercle
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
                    fontSize: 20,
                    textAlign: 'center',
                  }}>
                    {total.toLocaleString('fr-FR')} €
                  </Text>
                  <Text style={{
                    color: isDark ? '#aaa' : '#888',
                    fontSize: 13,
                    textAlign: 'center',
                  }}>
                    Total dépensé
                  </Text>
                </View>
              </View>
              {/* Légende */}
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
                        <Text style={{ color: isDark ? '#fff' : '#181818', fontSize: 13 }}>
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
    </SafeAreaView>
  );
}
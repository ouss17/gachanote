import { Theme } from '@/constants/Themes';
import { GACHAS } from '@/data/gachas';
import { computeAllRates } from '@/lib/StatsUtils';
import type { RootState } from '@/redux/store';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';

/**
 * Onglet "Statistiques" d'un gacha.
 * Agrège les rolls fournis (ou depuis le store) et affiche ressources, tickets, vedettes, spooks, sideUnits.
 */
export default function StatsTab({
  rolls,
  resourceType,
  showStatsPercent,
  setShowStatsPercent,
  isDark,
  totalMoney,
  currency,
  getFontSize,
  gachaId,
}: {
  rolls?: any[];
  resourceType: string;
  // extended with featuredItems / srItems toggles
  showStatsPercent: {
    featured: boolean;
    spook: boolean;
    sideUnit: boolean;
    tickets?: boolean;
    featuredItems?: boolean;
    srItems?: boolean;
  };
  setShowStatsPercent: React.Dispatch<React.SetStateAction<any>>;
  isDark: boolean;
  totalMoney: number;
  currency: string;
  getFontSize: (base: number) => number;
  gachaId: string;
}) {
  const theme = useSelector((state: any) => state.theme.mode);
  const themeColors = Theme[theme as keyof typeof Theme];

  const texts = require('@/data/texts.json');
  let lang = useSelector((state: any) => state.nationality.country) || 'fr';
  const t = (key: string) => texts[key]?.[lang] || texts[key]?.fr || key;

  // find gacha meta for header image
  const selectedGacha = GACHAS.find(g => g.id === String(gachaId)) ?? null;

  const StatCircle = ({
    label,
    value,
    color,
    borderColor,
    onPress,
    selected,
    fontSize,
    labelFontSize,
  }: {
    label: string;
    value: string;
    color: string;
    borderColor: string;
    onPress?: () => void;
    selected?: boolean;
    fontSize: number;
    labelFontSize: number;
  }) => {
    return (
      <TouchableOpacity
        activeOpacity={onPress ? 0.7 : 1}
        onPress={onPress}
        accessibilityRole={onPress ? 'button' : 'text'}
        accessible={true}
        accessibilityLabel={`${label.replace(/\n/g, ' ')} — ${value}`}
        accessibilityHint={onPress ? t('common.edit') || 'Toggle percent/absolute' : undefined}
        accessibilityState={{ selected: !!selected }}
        style={{ alignItems: 'center', marginHorizontal: 12 }}
      >
        <View
          style={{
            width: 90,
            height: 90,
            borderRadius: 45,
            borderWidth: 5,
            borderColor,
            backgroundColor: color,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <Text style={{ fontWeight: 'bold', fontSize, color: borderColor }}>{value}</Text>
        </View>
        <Text style={{ color: borderColor, fontWeight: 'bold', textAlign: 'center', fontSize: labelFontSize }}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const persistedRolls = useSelector((state: any) => state.rolls?.rolls ?? []);
  // base rolls for this gacha (before date filter)
  const baseRolls = Array.isArray(rolls) && rolls.length >= 0
    ? rolls
    : persistedRolls.filter((r: any) => String(r.gachaId) === String(gachaId));

  // Date filter state (local to this tab)
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Reset date filter when leaving this screen
  useFocusEffect(
    useCallback(() => {
      return () => {
        setStartDate(null);
        setEndDate(null);
        setShowStartPicker(false);
        setShowEndPicker(false);
      };
    }, [])
  );

  // apply date filter on top of baseRolls
  const sourceRolls = baseRolls.filter((r: any) => {
    if (!startDate && !endDate) return true;
    const d = new Date(r.date);
    let afterStart = true, beforeEnd = true;
    if (startDate) afterStart = d >= new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    if (endDate) {
      const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999);
      beforeEnd = d <= end;
    }
    return afterStart && beforeEnd;
  });

  // raw aggregation kept for absolute counts (resource, tickets, freePulls, featured/spook/sideUnit)
  const aggregated = sourceRolls.reduce(
    (acc: any, r: any) => {
      acc.resource += Number(r.resourceAmount ?? 0);
      acc.featured += Number(r.featuredCount ?? 0);
      acc.spook += Number(r.spookCount ?? 0);
      acc.sideUnit += Number(r.sideUnit ?? 0);
      acc.tickets += Number(r.ticketAmount ?? 0) + (r.resourceType === 'ticket' ? Number(r.resourceAmount ?? 0) : 0);
      acc.freePulls += Number(r.freePulls ?? 0);
      return acc;
    },
    { resource: 0, featured: 0, spook: 0, sideUnit: 0, tickets: 0, freePulls: 0 }
  );

  const ticketsCount = aggregated.tickets;
  const freePullsCount = aggregated.freePulls;
  const resourceCount = aggregated.resource;

  // compute pulls & aggregated rates using StatsUtils (more precise: per-roll conversion + sum)
  const statsResult = computeAllRates(sourceRolls, String(gachaId));
  const totalPulls = statsResult.aggregated?.pulls ?? 0;
  const aggRates = statsResult.aggregated;

  // items counts / rates (from StatsUtils aggregated)
  const featuredItemsCount = Number(aggRates?.featuredItemsCount ?? 0);
  const srItemsCount = Number(aggRates?.srItemsCount ?? 0);
  const featuredItemsRate = Number(aggRates?.featuredItemsRate ?? 0);
  const srItemsRate = Number(aggRates?.srItemsRate ?? 0);
  // --- money total filtered by the same date range ---
  const moneyEntriesForGacha = useSelector((state: RootState) => (state.money?.entries ?? []).filter((m: any) => String(m.gachaId) === String(gachaId)));
  const filteredMoneyEntries = moneyEntriesForGacha.filter((e: any) => {
    if (!startDate && !endDate) return true;
    const d = new Date(e.date);
    let afterStart = true, beforeEnd = true;
    if (startDate) afterStart = d >= new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    if (endDate) {
      const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999);
      beforeEnd = d <= end;
    }
    return afterStart && beforeEnd;
  });
  const filteredTotalMoney = filteredMoneyEntries.reduce((s: number, e: any) => s + Number(e.amount ?? 0), 0);


  function getMultiCost(gachaId: string) {
    switch (gachaId) {
      case 'dbl': return { cost: 1000 };
      case 'fgo': return { cost: 30 };
      case 'dokkan': return { cost: 50 };
      case 'sevenDS': return { cost: 30 };
      case 'opbr': return { cost: 50 };
      case 'nikke': return { cost: 3000 };
      case 'bbs': return { cost: 250 };
      case 'bsr': return { cost: 10 };
      case 'genshin': return { cost: 10 };
      case 'hsr': return { cost: 10 };
      case 'optc': return { cost: 50 };
      case 'uma': return { cost: 1500 };
      case 'ww': return { cost: 10 };
      case 'zenlesszone': return { cost: 1600 };
      case 'haikyufh': return { cost: 1500 };
      case 'jjkpp': return { cost: 3000 };
      case 'sdgundamgge': return { cost: 3000 };
      default: return { cost: 0 };
    }
  }


  return (
    <View style={{ flex: 1 }}>
      {/* Fixed date filter (always interactive) */}
      <View style={{
        width: '100%',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
        zIndex: 20,
        backgroundColor: themeColors.background,
        borderBottomWidth: 1,
        borderBottomColor: themeColors.card,
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => setShowStartPicker(true)} style={{ alignItems: 'center', marginRight: 12 }}>
            <Text style={{ color: themeColors.text, fontSize: getFontSize(12) }}>{t('statistiques.startDate') || 'Start'}</Text>
            <Text style={{ color: themeColors.primary, fontSize: getFontSize(13), marginTop: 6 }}>
              {startDate ? startDate.toLocaleDateString() : (t('statistiques.choose') || 'Choose')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setStartDate(null); }} style={{ padding: 6 }}>
            <Text style={{ color: themeColors.placeholder, fontSize: getFontSize(12) }}>{t('common.reset') || 'Reset'}</Text>
          </TouchableOpacity>
          <View style={{ width: 16 }} />
          <TouchableOpacity onPress={() => setShowEndPicker(true)} style={{ alignItems: 'center', marginLeft: 12 }}>
            <Text style={{ color: themeColors.text, fontSize: getFontSize(12) }}>{t('statistiques.endDate') || 'End'}</Text>
            <Text style={{ color: themeColors.primary, fontSize: getFontSize(13), marginTop: 6 }}>
              {endDate ? endDate.toLocaleDateString() : (t('statistiques.choose') || 'Choose')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setEndDate(null); }} style={{ padding: 6, marginLeft: 8 }}>
            <Text style={{ color: themeColors.placeholder, fontSize: getFontSize(12) }}>{t('common.reset') || 'Reset'}</Text>
          </TouchableOpacity>
        </View>
        {/* Date pickers (native) */}
        {showStartPicker && (
          <DateTimePicker
            value={startDate || new Date()}
            mode="date"
            display="default"
            onChange={(_, date) => {
              setShowStartPicker(false);
              if (date) setStartDate(date);
            }}
            maximumDate={endDate || new Date()}
          />
        )}
        {showEndPicker && (
          <DateTimePicker
            value={endDate || new Date()}
            mode="date"
            display="default"
            onChange={(_, date) => {
              setShowEndPicker(false);
              if (date) setEndDate(date);
            }}
            minimumDate={startDate || undefined}
          />
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 24,
          alignItems: 'center',
          paddingBottom: 80,
          paddingTop: 8, // spacing under fixed filter
        }}
        showsVerticalScrollIndicator={true}
      >
        {/* gacha banner image (centered, no name) */}
        {selectedGacha ? (
          <View style={{ width: '100%', alignItems: 'center', marginBottom: 5 }}>
            <Image
              source={selectedGacha.logo}
              style={{ width: 160, maxWidth: 420, height: 80, resizeMode: 'contain' }}
            />
          </View>
        ) : null}
        <View
          accessible={true}
          accessibilityLabel={t('gachaRolls.stats.title')}
          style={{
            width: '100%',
            maxWidth: 420,
            borderRadius: 16,
            backgroundColor: themeColors.card,
            marginBottom: 24,
            alignItems: 'center',
            padding: 24,
          }}
        >
          <Text accessibilityRole="header" style={{ color: themeColors.text, fontSize: getFontSize(18), fontWeight: 'bold', marginBottom: 12 }}>
            {t('gachaRolls.stats.title')}
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
              label={`${t('gachaRolls.form.resourceAmount')}\n(${resourceType.toUpperCase()})`}
              value={resourceCount.toString()}
              color={themeColors.card}
              borderColor={themeColors.primary}
              fontSize={getFontSize(20)}
              labelFontSize={getFontSize(13)}
              selected={false}
            />

            <StatCircle
              label={t('common.tickets') || 'Tickets'}
              value={
                showStatsPercent.tickets && totalPulls > 0
                  ? `${((ticketsCount / totalPulls) * 100).toFixed(2)}%`
                  : ticketsCount.toString()
              }
              color={themeColors.card}
              borderColor="#4A90E2"
              selected={false}
              fontSize={getFontSize(20)}
              labelFontSize={getFontSize(13)}
            />

            <StatCircle
              label={t('gachaRolls.form.freePullsShort') || 'Tirages gratuits'}
              value={
                showStatsPercent.tickets && totalPulls > 0
                  ? `${((freePullsCount / totalPulls) * 100).toFixed(2)}%`
                  : freePullsCount.toString()
              }
              color={themeColors.card}
              borderColor="#007AFF"
              selected={false}
              fontSize={getFontSize(20)}
              labelFontSize={getFontSize(13)}
            />

            <StatCircle
              label={t('common.featured')}
              value={
                showStatsPercent.featured && totalPulls > 0
                  ? `${((aggRates?.featuredRate ?? 0) * 100).toFixed(2)}%`
                  : aggregated.featured.toString()
              }
              color={themeColors.card}
              borderColor="#FF9500"
              onPress={() =>
                setShowStatsPercent((s: any) => ({ ...s, featured: !s.featured }))
              }
              selected={!!showStatsPercent.featured}
              fontSize={getFontSize(20)}
              labelFontSize={getFontSize(13)}
            />
            <StatCircle
              label={t('common.spook')}
              value={
                showStatsPercent.spook && totalPulls > 0
                  ? `${((aggRates?.spookRate ?? 0) * 100).toFixed(2)}%`
                  : aggregated.spook.toString()
              }
              color={themeColors.card}
              borderColor="#00B894"
              onPress={() =>
                setShowStatsPercent((s: any) => ({ ...s, spook: !s.spook }))
              }
              selected={!!showStatsPercent.spook}
              fontSize={getFontSize(20)}
              labelFontSize={getFontSize(13)}
            />
            <StatCircle
              label={t('common.sideUnits')}
              value={
                showStatsPercent.sideUnit && totalPulls > 0
                  ? `${((aggRates?.sideUnitRate ?? 0) * 100).toFixed(2)}%`
                  : String(aggregated.sideUnit ?? 0)
              }
              color={themeColors.card}
              borderColor="#6C47FF"
              onPress={() =>
                setShowStatsPercent((s: any) => ({ ...s, sideUnit: !s.sideUnit }))
              }
              selected={!!showStatsPercent.sideUnit}
              fontSize={getFontSize(20)}
              labelFontSize={getFontSize(13)}
            />

            {/* Items (objets) : global count + toggle percent */}
            <StatCircle
              label={t('gachaRolls.form.featuredItems') || 'Objets vedette'}
              value={
                showStatsPercent.featuredItems && totalPulls > 0
                  ? `${(featuredItemsRate * 100).toFixed(2)}%`
                  : featuredItemsCount.toString()
              }
              color={themeColors.card}
              borderColor="#FF5E3A"
              onPress={() => setShowStatsPercent((s: any) => ({ ...s, featuredItems: !s.featuredItems }))}
              selected={!!showStatsPercent.featuredItems}
              fontSize={getFontSize(20)}
              labelFontSize={getFontSize(13)}
            />

            <StatCircle
              label={t('gachaRolls.form.srItems') || 'Objets SR'}
              value={
                showStatsPercent.srItems && totalPulls > 0
                  ? `${(srItemsRate * 100).toFixed(2)}%`
                  : srItemsCount.toString()
              }
              color={themeColors.card}
              borderColor="#8E44FF"
              onPress={() => setShowStatsPercent((s: any) => ({ ...s, srItems: !s.srItems }))}
              selected={!!showStatsPercent.srItems}
              fontSize={getFontSize(20)}
              labelFontSize={getFontSize(13)}
            />
          </View>
          {/* Affichage du total d'argent dépensé */}
          <View style={{
            marginTop: 24,
            alignItems: 'center',
            backgroundColor: themeColors.background,
            borderRadius: 12,
            padding: 16,
            width: '100%',
            maxWidth: 320,
          }}>
            <Text style={{ color: themeColors.text, fontWeight: 'bold', fontSize: getFontSize(16) }}>
              {t('gachaRolls.stats.moneySpent')}
            </Text>
            <Text
              accessible={true}
              accessibilityRole="text"
              accessibilityLabel={`${filteredTotalMoney.toLocaleString('fr-FR')} ${currency}`}
              style={{ color: themeColors.text, fontSize: getFontSize(22), fontWeight: 'bold', marginTop: 8 }}
            >
              {filteredTotalMoney.toLocaleString('fr-FR')} {currency}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}



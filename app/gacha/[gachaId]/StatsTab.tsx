import { Theme } from '@/constants/Themes';
import { Text, TouchableOpacity, View } from 'react-native';
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
  gachaId, // identifiant du gacha pour filtrer les rolls persistés si nécessaire
}: {
  rolls?: any[]; // liste de rolls filtrés par le parent (index) si disponible
  resourceType: string;
  showStatsPercent: { featured: boolean; spook: boolean; sideUnit: boolean; tickets?: boolean };
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

  // StatCircle (same as before)
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

  // obtain persisted rolls from store only if parent didn't provide rolls
  const persistedRolls = useSelector((state: any) => state.rolls?.rolls ?? []);
  const sourceRolls = Array.isArray(rolls) && rolls.length >= 0 ? rolls : persistedRolls.filter((r: any) => String(r.gachaId) === String(gachaId));

  // aggregate stats from sourceRolls
  const aggregated = sourceRolls.reduce(
    (acc: any, r: any) => {
      acc.resource += Number(r.resourceAmount ?? 0);
      acc.featured += Number(r.featuredCount ?? 0);
      acc.spook += Number(r.spookCount ?? 0);
      acc.sideUnit += Number(r.sideUnit ?? 0);
      // tickets can be explicit (ticketAmount) or encoded as resource when resourceType === 'ticket'
      acc.tickets += Number(r.ticketAmount ?? 0) + (r.resourceType === 'ticket' ? Number(r.resourceAmount ?? 0) : 0);
      return acc;
    },
    { resource: 0, featured: 0, spook: 0, sideUnit: 0, tickets: 0 }
  );

  const ticketsCount = aggregated.tickets;
  const resourceCount = aggregated.resource;
  const totalSpend = resourceCount + ticketsCount;

  // Convert resources to number of pulls using multiCost (multi = 10 pulls)
  const { cost: multiCost } = getMultiCost(String(gachaId));
  const singleCost = multiCost > 0 ? multiCost / 10 : 0;
  const pullsFromResources = singleCost > 0 ? Math.floor(resourceCount / singleCost) : 0;
  // 1 ticket = 1 pull
  const totalPulls = pullsFromResources + ticketsCount;

  // getMultiCost moved here so multiCount is computed from aggregated stats
  function getMultiCost(gachaId: string) {
    switch (gachaId) {
      case 'dbl': return { cost: 1000, label: '1000cc', unit: 'multi' };
      case 'fgo': return { cost: 30, label: '30 SQ', unit: 'multi' };
      case 'dokkan': return { cost: 50, label: '50 DS', unit: 'multi' };
      case 'sevenDS': return { cost: 30, label: '30 gemmes', unit: 'multi' };
      case 'opbr': return { cost: 50, label: '50 diamants', unit: 'multi' };
      case 'nikke': return { cost: 3000, label: '3000 gemmes', unit: 'multi' };
      case 'bbs': return { cost: 250, label: '250 BBS', unit: 'multi' };
      case 'bsr': return { cost: 10, label: '10 Primalgem', unit: 'multi' };
      case 'genshin': return { cost: 10, label: '10 Primogems', unit: 'multi' };
      case 'hsr': return { cost: 10, label: '10 Hyperspace', unit: 'multi' };
      case 'optc': return { cost: 50, label: '50 Gems', unit: 'multi' };
      case 'uma': return { cost: 1500, label: '1500 carats', unit: 'multi' };
      case 'ww': return { cost: 10, label: '10 convenes', unit: 'multi' };
      default: return { cost: 0, label: '', unit: '' };
    }
  }

  const multiCount = multiCost > 0 ? Math.floor(resourceCount / multiCost) : 0;
  // multiCount peut être utilisé ici pour affichage dans StatsTab si besoin

  return (
    <View
      accessible={true}
      accessibilityLabel={t('gachaRolls.stats.title')}
      style={{
        padding: 24,
        borderRadius: 16,
        backgroundColor: themeColors.card,
        marginBottom: 24,
        alignItems: 'center'
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

        {/* Tickets stat: non cliquable.
            Percentage computed relative to total pulls (resources converted to pulls + tickets). */}
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
          label={t('common.featured')}
          value={
            showStatsPercent.featured && totalPulls > 0
              ? `${((aggregated.featured / totalPulls) * 100).toFixed(2)}%`
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
              ? `${((aggregated.spook / totalPulls) * 100).toFixed(2)}%`
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
              ? `${((aggregated.sideUnit / totalPulls) * 100).toFixed(2)}%`
              : aggregated.sideUnit?.toString()
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
          accessibilityLabel={`${totalMoney.toLocaleString('fr-FR')} ${currency}`}
          style={{ color: themeColors.text, fontSize: getFontSize(22), fontWeight: 'bold', marginTop: 8 }}
        >
          {totalMoney.toLocaleString('fr-FR')} {currency}
        </Text>
      </View>
    </View>
  );
}



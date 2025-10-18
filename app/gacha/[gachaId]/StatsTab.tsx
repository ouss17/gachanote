import { Theme } from '@/constants/Themes';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';

/**
 * Onglet "Statistiques" d'un gacha.
 * Affiche les statistiques de tirages, taux de drop, et l'argent total dépensé pour ce gacha.
 *
 * @param stats Statistiques agrégées (ressources, vedettes, spooks, side units)
 * @param resourceType Type de ressource utilisée pour ce gacha
 * @param showStatsPercent Indique si l'affichage est en pourcentage ou en valeur brute pour chaque stat
 * @param setShowStatsPercent Fonction pour basculer l'affichage pour chaque stat
 * @param isDark Thème sombre ou non
 * @param totalMoney Argent total dépensé pour ce gacha
 * @param currency Devise utilisée
 * @param getFontSize Fonction pour la taille de police dynamique
 */
export default function StatsTab({
  stats,
  resourceType,
  showStatsPercent,
  setShowStatsPercent,
  isDark,
  totalMoney,
  currency,
  getFontSize,
}: {
  stats: { resource: number; featured: number; spook: number; sideUnit: number };
  resourceType: string;
  showStatsPercent: { featured: boolean; spook: boolean; sideUnit: boolean };
  setShowStatsPercent: React.Dispatch<React.SetStateAction<any>>;
  isDark: boolean;
  totalMoney: number;
  currency: string;
  getFontSize: (base: number) => number;
}) {
  const theme = useSelector((state: any) => state.theme.mode);
  const themeColors = Theme[theme as keyof typeof Theme];

  // Add translation setup
  const texts = require('@/data/texts.json');
  let lang = useSelector((state: any) => state.nationality.country) || 'fr';
  const t = (key: string) => texts[key]?.[lang] || texts[key]?.fr || key;

  // StatCircle moved inside the component so it can use `t` from closure (fixes "Cannot find name 't'")
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
          value={stats.resource.toString()}
          color={themeColors.card}
          borderColor={themeColors.primary}
          fontSize={getFontSize(20)}
          labelFontSize={getFontSize(13)}
          selected={false}
        />
        <StatCircle
          label={t('common.featured')}
          value={
            showStatsPercent.featured && stats.resource > 0
              ? `${((stats.featured / stats.resource) * 100).toFixed(2)}%`
              : stats.featured.toString()
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
            showStatsPercent.spook && stats.resource > 0
              ? `${((stats.spook / stats.resource) * 100).toFixed(2)}%`
              : stats.spook.toString()
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
            showStatsPercent.sideUnit && stats.resource > 0
              ? `${((stats.sideUnit / stats.resource) * 100).toFixed(2)}%`
              : stats.sideUnit?.toString()
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



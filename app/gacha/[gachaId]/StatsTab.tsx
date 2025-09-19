import { Text, TouchableOpacity, View } from 'react-native';

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
  return (
    <View style={{
      padding: 24,
      borderRadius: 16,
      backgroundColor: isDark ? '#232323' : '#fff',
      marginBottom: 24,
      alignItems: 'center'
    }}>
      <Text style={{ color: isDark ? '#fff' : '#181818', fontSize: getFontSize(18), fontWeight: 'bold', marginBottom: 12 }}>
        Statistiques
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
          label={`Ressources\n(${resourceType.toUpperCase()})`}
          value={stats.resource.toString()}
          color={isDark ? '#232323' : '#fff'}
          borderColor="#007AFF"
          fontSize={getFontSize(20)}
          labelFontSize={getFontSize(13)}
        />
        <StatCircle
          label="Vedettes"
          value={
            showStatsPercent.featured && stats.resource > 0
              ? `${((stats.featured / stats.resource) * 100).toFixed(2)}%`
              : stats.featured.toString()
          }
          color={isDark ? '#232323' : '#fff'}
          borderColor="#FF9500"
          onPress={() =>
            setShowStatsPercent((s: any) => ({ ...s, featured: !s.featured }))
          }
          fontSize={getFontSize(20)}
          labelFontSize={getFontSize(13)}
        />
        <StatCircle
          label="Spooks"
          value={
            showStatsPercent.spook && stats.resource > 0
              ? `${((stats.spook / stats.resource) * 100).toFixed(2)}%`
              : stats.spook.toString()
          }
          color={isDark ? '#232323' : '#fff'}
          borderColor="#00B894"
          onPress={() =>
            setShowStatsPercent((s: any) => ({ ...s, spook: !s.spook }))
          }
          fontSize={getFontSize(20)}
          labelFontSize={getFontSize(13)}
        />
        <StatCircle
          label="Side units"
          value={
            showStatsPercent.sideUnit && stats.resource > 0
              ? `${((stats.sideUnit / stats.resource) * 100).toFixed(2)}%`
              : stats.sideUnit?.toString()
          }
          color={isDark ? '#232323' : '#fff'}
          borderColor="#6C47FF"
          onPress={() =>
            setShowStatsPercent((s: any) => ({ ...s, sideUnit: !s.sideUnit }))
          }
          fontSize={getFontSize(20)}
          labelFontSize={getFontSize(13)}
        />
      </View>
      {/* Affichage du total d'argent dépensé */}
      <View style={{
        marginTop: 24,
        alignItems: 'center',
        backgroundColor: isDark ? '#232323' : '#f2f2f2',
        borderRadius: 12,
        padding: 16,
        width: '100%',
        maxWidth: 320,
      }}>
        <Text style={{ color: isDark ? '#fff' : '#181818', fontWeight: 'bold', fontSize: getFontSize(16) }}>
          Argent dépensé
        </Text>
        <Text style={{ color: isDark ? '#fff' : '#181818', fontSize: getFontSize(22), fontWeight: 'bold', marginTop: 8 }}>
          {totalMoney.toLocaleString('fr-FR')} {currency}
        </Text>
      </View>
    </View>
  );
}

/**
 * Affiche un cercle statistique interactif (valeur ou pourcentage).
 *
 * @param label Libellé du cercle
 * @param value Valeur affichée
 * @param color Couleur de fond
 * @param borderColor Couleur de la bordure et du texte
 * @param onPress Fonction appelée au clic (pour basculer valeur/pourcentage)
 * @param fontSize Taille de la valeur
 * @param labelFontSize Taille du label
 */
function StatCircle({
  label,
  value,
  color,
  borderColor,
  onPress,
  fontSize,
  labelFontSize,
}: {
  label: string,
  value: string,
  color: string,
  borderColor: string,
  onPress?: () => void,
  fontSize: number,
  labelFontSize: number,
}) {
  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      style={{ alignItems: 'center', marginHorizontal: 12 }}
    >
      <View style={{
        width: 90,
        height: 90,
        borderRadius: 45,
        borderWidth: 5,
        borderColor,
        backgroundColor: color,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
      }}>
        <Text style={{ fontWeight: 'bold', fontSize, color: borderColor }}>{value}</Text>
      </View>
      <Text style={{ color: borderColor, fontWeight: 'bold', textAlign: 'center', fontSize: labelFontSize }}>{label}</Text>
    </TouchableOpacity>
  );
}



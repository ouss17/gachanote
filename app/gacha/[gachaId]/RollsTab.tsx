import { Theme } from '@/constants/Themes';
import { AntDesign } from '@expo/vector-icons';
import { FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';

/**
 * Onglet "Liste" d'un gacha.
 * Affiche la liste des rolls enregistrés, permet la recherche par vedette,
 * et propose l'édition ou la suppression d'un roll.
 *
 * @param rolls Liste des rolls à afficher
 * @param isDark Thème sombre ou non
 * @param search Valeur du champ de recherche
 * @param setSearch Fonction pour modifier la recherche
 * @param setEditRoll Fonction pour sélectionner un roll à éditer
 * @param setResourceAmount Fonction pour modifier le champ ressource
 * @param setNameFeatured Fonction pour modifier le champ vedette
 * @param setFeaturedCount Fonction pour modifier le champ nombre de vedettes
 * @param setSpookCount Fonction pour modifier le champ nombre de spooks
 * @param setSideUnit Fonction pour modifier le champ side unit
 * @param setDate Fonction pour modifier la date
 * @param setShowModal Fonction pour afficher/masquer le modal d'édition
 * @param dispatch Fonction Redux pour les actions
 * @param removeRoll Action Redux pour supprimer un roll
 * @param nameFeaturedRef Référence pour le champ vedette
 * @param featuredCountRef Référence pour le champ nombre de vedettes
 * @param spookCountRef Référence pour le champ spook
 * @param sideUnitRef Référence pour le champ side unit
 * @param getFontSize Fonction pour la taille de police dynamique
 */
export default function RollsTab({
  rolls,
  isDark,
  search,
  setSearch,
  setEditRoll,
  setResourceAmount,
  setNameFeatured,
  setFeaturedCount,
  setSpookCount,
  setSideUnit,
  setDate,
  setShowModal,
  dispatch,
  removeRoll,
  nameFeaturedRef,
  featuredCountRef,
  spookCountRef,
  sideUnitRef,
  getFontSize,
}: any) {
  // Get selected language from settings
  let lang = useSelector((state: any) => state.nationality.country) || 'fr';
  // Import texts.json
  const texts = require('@/data/texts.json');

  // Helper to get translation
  const t = (key: string) => texts[key]?.[lang] || texts[key]?.fr || key;

  const theme = useSelector((state: any) => state.theme.mode);
  const themeColors = Theme[theme as keyof typeof Theme];

  return (
    <>
      {/* Champ de recherche, affiché seulement s'il y a au moins un roll */}
      {rolls.length > 0 && (
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: themeColors.border,
            borderRadius: 8,
            padding: 12,
            marginBottom: 24,
            fontSize: getFontSize ? getFontSize(16) : 16,
            backgroundColor: themeColors.card,
            color: themeColors.text,
          }}
          placeholder={t('gachaRolls.searchPlaceholder')}
          placeholderTextColor={themeColors.placeholder}
          value={search}
          onChangeText={setSearch}
        />
      )}
      {/* Liste des rolls */}
      <FlatList
        data={rolls}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View
            style={{
              marginVertical: 8,
              padding: 8,
              borderWidth: 1,
              borderRadius: 8,
              borderColor: themeColors.border,
              backgroundColor: themeColors.card,
            }}
          >
            {/* Nom de la vedette si présent */}
            {item.nameFeatured ? (
              <Text style={{
                fontWeight: 'bold',
                fontSize: getFontSize ? getFontSize(18) : 18,
                textAlign: 'center',
                color: themeColors.text,
                marginBottom: 8,
              }}>
                {item.nameFeatured}
              </Text>
            ) : null}
            <Text style={{ color: themeColors.text, fontSize: getFontSize ? getFontSize(15) : 15 }}>
              {t('common.date')} : <Text style={{ fontWeight: 'bold' }}>
                {new Date(item.date).toLocaleDateString(
                  lang === 'en' ? 'en-US' : lang === 'jap' ? 'ja-JP' : 'fr-FR'
                )}
              </Text>
            </Text>
            <Text style={{ color: themeColors.text, fontSize: getFontSize ? getFontSize(15) : 15 }}>
              {t('common.resource')} : <Text style={{ fontWeight: 'bold' }}>
                {item.resourceAmount} {item.resourceType === 'ticket'
                  ? Number(item.resourceAmount) > 1
                    ? 'Tickets'
                    : 'Ticket'
                  : item.resourceType?.toUpperCase() ?? ''}
              </Text>
            </Text>
            <Text style={{ color: themeColors.text, fontSize: getFontSize ? getFontSize(15) : 15 }}>
              {t('common.featured')} : <Text style={{ fontWeight: 'bold' }}>{item.featuredCount}</Text>
            </Text>
            {item.spookCount > 0 && (
              <Text style={{ color: themeColors.text, fontSize: getFontSize ? getFontSize(15) : 15 }}>
                {t('common.spook')} : <Text style={{ fontWeight: 'bold' }}>{item.spookCount}</Text>
              </Text>
            )}
            <Text style={{ color: themeColors.text, fontSize: getFontSize ? getFontSize(15) : 15 }}>
              {t('common.sideUnits')} : <Text style={{ fontWeight: 'bold' }}>{item.sideUnit > 0 ? item.sideUnit : 0}</Text>
            </Text>
            {/* Actions d'édition et suppression */}
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              <TouchableOpacity
                onPress={() => {
                  setEditRoll(item);
                  setResourceAmount(item.resourceAmount.toString());
                  setNameFeatured(item.nameFeatured ?? '');
                  setFeaturedCount(item.featuredCount.toString());
                  setSpookCount(item.spookCount.toString());
                  setSideUnit(item.sideUnit?.toString() ?? '');
                  setDate(new Date(item.date));
                  setShowModal(true);
                }}
                style={{ marginRight: 16 }}
              >
                <AntDesign name="edit" size={getFontSize ? getFontSize(20) : 20} color={themeColors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => dispatch(removeRoll(item.id))}
              >
                <AntDesign name="delete" size={getFontSize ? getFontSize(20) : 20} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ color: themeColors.text, fontSize: getFontSize ? getFontSize(15) : 15 }}>
            {t('gachaRolls.list.empty')}
          </Text>
        }
        contentContainerStyle={{ paddingBottom: 80 }}
      />
    </>
  );
}
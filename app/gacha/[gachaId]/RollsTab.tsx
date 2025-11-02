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
 * @param setTicketAmount Fonction pour modifier le champ ticket
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
  setTicketAmount, // ajouté
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
  onModalVisibilityChange,
}: any) {
  // Get selected language from settings
  let lang = useSelector((state: any) => state.nationality.country) || 'fr';
  // Import texts.json
  const texts = require('@/data/texts.json');

  // Helper to get translation
  const t = (key: string) => texts[key]?.[lang] || texts[key]?.fr || key;

  const theme = useSelector((state: any) => state.theme.mode);
  const themeColors = Theme[theme as keyof typeof Theme];

  // placeholder clair en dark/night, sinon utilise la valeur du thème
  const placeholderColor = theme === 'dark' || theme === 'night' ? '#E5E7EB' : themeColors.placeholder;

  return (
    <>
      {rolls.length > 0 && (
        <TextInput
          accessible={true}
          accessibilityRole="search"
          accessibilityLabel={t('gachaRolls.searchPlaceholder')}
          accessibilityHint={t('gachaRolls.searchPlaceholder')}
          style={{
            borderWidth: 1,
            borderColor: themeColors.border,
            borderRadius: 8,
            padding: 12,
            marginBottom: 24,
            fontSize: getFontSize ? getFontSize(16) : 16,
            backgroundColor: 'transparent', // pas de fond, on garde le style du conteneur
            color: themeColors.text, // texte adapté au thème
          }}
          placeholder={t('gachaRolls.searchPlaceholder')}
          placeholderTextColor={placeholderColor}
          value={search}
          onChangeText={setSearch}
        />
      )}
      {/* Liste des rolls */}
      <FlatList
        data={rolls}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          // support both resource and tickets:
          const resAmt = Number(item.resourceAmount ?? 0);
          const resType = item.resourceType ?? '';
          // ticketAmount optional; legacy: resourceType === 'ticket' => resourceAmount was tickets
          const ticketAmt = (item.ticketAmount != null) ? Number(item.ticketAmount) : (resType === 'ticket' ? Number(item.resourceAmount ?? 0) : 0);

          // Decide what to show:
          const hasResourceNonTicket = !!resType && resType !== 'ticket' && resAmt > 0;
          const hasTicketsOnly = ticketAmt > 0 && !hasResourceNonTicket;
          const hasBoth = hasResourceNonTicket && ticketAmt > 0;

          const partsForA11y: string[] = [];
          if (item.nameFeatured) partsForA11y.push(item.nameFeatured);
          partsForA11y.push(`${t('common.date')}: ${new Date(item.date).toLocaleDateString(lang === 'en' ? 'en-US' : lang === 'jap' ? 'ja-JP' : 'fr-FR')}`);
          if (hasBoth) {
            partsForA11y.push(`${t('common.resource')}: ${resAmt} ${resType}`);
            partsForA11y.push(`${t('common.tickets') || 'Tickets'}: ${ticketAmt}`);
          } else if (hasTicketsOnly) {
            // show tickets as the resource line for clarity
            partsForA11y.push(`${t('common.resource')}: ${ticketAmt} ${t('common.tickets') || 'Tickets'}`);
          } else if (hasResourceNonTicket) {
            partsForA11y.push(`${t('common.resource')}: ${resAmt} ${resType}`);
          }

          return (
            <View
              accessible={true}
              accessibilityRole="text"
              accessibilityLabel={partsForA11y.join(', ')}
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
                <Text
                  accessibilityRole="header"
                  accessible={true}
                  accessibilityLabel={item.nameFeatured}
                  style={{
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

              {/* Affichage : si tickets seuls -> afficher "Ressource : <nb> Tickets" ; sinon afficher ressource et/ou tickets */}
              <View style={{ marginTop: 6 }}>
                {hasBoth ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ color: themeColors.text, fontSize: getFontSize ? getFontSize(15) : 15 }}>
                      {t('common.resource')} : <Text style={{ fontWeight: 'bold' }}>{resAmt} {String(resType).toUpperCase()}</Text>
                    </Text>
                    <Text style={{ color: themeColors.text, fontSize: getFontSize ? getFontSize(15) : 15, marginLeft: 12 }}>
                      {t('common.tickets') || 'Tickets'} : <Text style={{ fontWeight: 'bold' }}>{ticketAmt}</Text>
                    </Text>
                  </View>
                ) : hasTicketsOnly ? (
                  <Text style={{ color: themeColors.text, fontSize: getFontSize ? getFontSize(15) : 15 }}>
                    {t('common.resource')} : <Text style={{ fontWeight: 'bold' }}>{ticketAmt} {t('common.tickets') || 'Tickets'}</Text>
                  </Text>
                ) : hasResourceNonTicket ? (
                  <Text style={{ color: themeColors.text, fontSize: getFontSize ? getFontSize(15) : 15 }}>
                    {t('common.resource')} : <Text style={{ fontWeight: 'bold' }}>{resAmt} {String(resType).toUpperCase()}</Text>
                  </Text>
                ) : null}
              </View>

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
                  accessibilityRole="button"
                  accessible={true}
                  accessibilityLabel={t('common.edit')}
                  accessibilityHint={`Edit roll ${item.nameFeatured ?? ''}`}
                  onPress={() => {
                    // notify parent that a modal will open to block parent swipe
                    onModalVisibilityChange?.(true);
                    setEditRoll(item);
                    setResourceAmount(item.resourceAmount?.toString() ?? '');
                    setTicketAmount?.(item.ticketAmount?.toString() ?? '');
                    // new: populate ticketAmount if exists
                    // parent edit flow should account for ticketAmount field
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
                  accessibilityRole="button"
                  accessible={true}
                  accessibilityLabel={t('common.delete')}
                  accessibilityHint={`Delete roll ${item.nameFeatured ?? ''}`}
                  onPress={() => dispatch(removeRoll(item.id))}
                >
                  <AntDesign name="delete" size={getFontSize ? getFontSize(20) : 20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
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
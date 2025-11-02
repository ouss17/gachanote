import RollForm from '@/components/RollForm';
import RollsList from '@/components/RollsList';
import { Theme } from '@/constants/Themes';
import type { Roll } from '@/redux/slices/rollsSlice';
import { addRoll, removeRoll, updateRoll } from '@/redux/slices/rollsSlice';
import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

/**
 * Onglet "Liste" d'un gacha.
 * Affiche la liste des rolls enregistrés, permet la recherche par vedette,
 * et propose l'édition ou la suppression d'un roll.
 *
 * @param rolls Liste des rolls à afficher
 * @param search Valeur du champ de recherche
 * @param removeRoll Action Redux pour supprimer un roll
 * @param getFontSize Fonction pour la taille de police dynamique
 * @param onModalVisibilityChange Callback pour la visibilité du modal de formulaire
 */
export default function RollsTab({
  rolls,
  search,
  getFontSize,
  onModalVisibilityChange,
  gachaId, // must be passed from parent index.tsx
  resourceType: propResourceType, // optional, prefer parent-provided resourceType
}: any) {
  const dispatch = useDispatch();
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

  const [query, setQuery] = useState(search || '');
  const [editing, setEditing] = useState<null | any>(null);
  const [showForm, setShowForm] = useState(false);

  const filtered = rolls.filter((r: Roll) => !query || (r.nameFeatured ?? '').toLowerCase().includes(query.trim().toLowerCase()));

  const handleSubmit = (roll: any) => {
    if (editing && editing.id) {
      dispatch(updateRoll(roll));
    } else {
      dispatch(addRoll(roll));
    }
  };

  const handleEdit = (r: Roll) => {
    setEditing(r);
    setShowForm(true);
    onModalVisibilityChange?.(true);
  };

  const handleAddPress = () => {
    setEditing(null);
    setShowForm(true);
    onModalVisibilityChange?.(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditing(null);
    onModalVisibilityChange?.(false);
  };

  // derive resourceType fallback if parent didn't pass it
  function getResourceTypeFromGacha(id: string) {
    switch (id) {
      case 'dbl': return 'cc';
      case 'dokkan': return 'ds';
      case 'fgo': return 'sq';
      case 'sevenDS': return 'gemmes';
      case 'opbr': return 'diamants';
      default: return 'gemmes';
    }
  }
  const resourceType = propResourceType ?? (gachaId ? getResourceTypeFromGacha(String(gachaId)) : 'gemmes');

  return (
    <View style={{ flex: 1 }}>
      {/* Search */}
      {rolls.length > 0 && (
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('gachaRolls.searchPlaceholder')}
          placeholderTextColor={placeholderColor}
          style={{
            borderWidth: 1,
            borderColor: themeColors.border,
            borderRadius: 8,
            padding: 12,
            marginBottom: 24,
            fontSize: getFontSize ? getFontSize(16) : 16,
            backgroundColor: 'transparent',
            color: themeColors.text,
          }}
        />
      )}

      <RollsList
        rolls={filtered}
        getFontSize={getFontSize}
        onEdit={handleEdit}
        onDelete={(id: string) => dispatch(removeRoll(id))}
        t={t}
        themeMode={useSelector((s:any)=>s.theme.mode)}
      />

      {/* FAB to add roll */}
      <TouchableOpacity
        onPress={handleAddPress}
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
        }}
        accessibilityRole="button"
        accessible
        accessibilityLabel={t('common.add') || 'Add'}
      >
        <Text style={{ color: '#fff', fontSize: getFontSize(28), fontWeight: '700' }}>+</Text>
      </TouchableOpacity>

      <RollForm
        visible={showForm}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
        initial={editing}
        gachaId={gachaId ?? String(useSelector((s:any)=>s.rolls?.rolls?.[0]?.gachaId ?? ''))}
        resourceType={resourceType}
        getFontSize={getFontSize}
        themeColors={themeColors} // assure-toi que RollsTab calcule Theme[themeMode]
        t={t}
        onModalVisibilityChange={(v) => onModalVisibilityChange?.(v)}
      />
    </View>
  );
}
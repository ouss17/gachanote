import RollForm from '@/components/RollForm';
import RollsList from '@/components/RollsList';
import { Theme } from '@/constants/Themes';
import { GACHAS } from '@/data/gachas';
import type { Roll } from '@/redux/slices/rollsSlice';
import { addRoll, removeRoll, updateRoll } from '@/redux/slices/rollsSlice';
import React, { useState } from 'react';
import { Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
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
  // when adding a roll user can choose "simple" (only required fields) or "full" form
  const [formCompact, setFormCompact] = useState(false);
  // modal for choosing add mode
  const [showAddModeModal, setShowAddModeModal] = useState(false);

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
    setFormCompact(false); // edit = full form by default
    setShowForm(true);
    onModalVisibilityChange?.(true);
  };

  const handleAddPress = () => {
    setShowAddModeModal(true);
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

  // find gacha meta (logo + name) for header display
  const selectedGacha = GACHAS.find(g => g.id === String(gachaId)) ?? null;

  return (
    <View style={{ flex: 1 }}>
      {/* Gacha header (logo centered + name) */}
      {selectedGacha ? (
        <View style={{ alignItems: 'center', marginBottom: 5 }}>
          <Image
            source={selectedGacha.logo}
            style={{ width: 160, height: 80, resizeMode: 'contain' }}
          />
        </View>
      ) : null}

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

      {/* Add mode selection modal */}
      <Modal
        visible={showAddModeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModeModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowAddModeModal(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalWrapper}>
          <View style={[styles.modalCard, { backgroundColor: themeColors.card }]}>
            <Text style={{ color: themeColors.text, fontSize: getFontSize(18), fontWeight: 'bold', marginBottom: 8 }}>
              {t('gachaRolls.addModeTitle') || 'Ajouter un tirage'}
            </Text>
            <Text style={{ color: themeColors.placeholder, fontSize: getFontSize(14), marginBottom: 16 }}>
              {t('gachaRolls.addModeMessage') || "Choisir le mode d'ajout"}
            </Text>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  setEditing(null);
                  setFormCompact(true);
                  setShowForm(true);
                  setShowAddModeModal(false);
                  onModalVisibilityChange?.(true);
                }}
                style={[styles.modeCard, { borderColor: themeColors.border }]}
                accessibilityRole="button"
                accessible
                accessibilityLabel={t('gachaRolls.addMode.simple') || 'Simple'}
              >
                <Text style={{ fontWeight: '700', fontSize: getFontSize(16), color: themeColors.text, marginBottom: 6 }}>
                  {t('gachaRolls.addMode.simple') || 'Simple'}
                </Text>
                <Text style={{ color: themeColors.placeholder, fontSize: getFontSize(13) }}>
                  {t('gachaRolls.addMode.simpleDesc') || 'Champs obligatoires seulement'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setEditing(null);
                  setFormCompact(false);
                  setShowForm(true);
                  setShowAddModeModal(false);
                  onModalVisibilityChange?.(true);
                }}
                style={[styles.modeCard, { borderColor: themeColors.primary }]}
                accessibilityRole="button"
                accessible
                accessibilityLabel={t('gachaRolls.addMode.full') || 'Complet'}
              >
                <Text style={{ fontWeight: '700', fontSize: getFontSize(16), color: themeColors.text, marginBottom: 6 }}>
                  {t('gachaRolls.addMode.full') || 'Complet'}
                </Text>
                <Text style={{ color: themeColors.placeholder, fontSize: getFontSize(13) }}>
                  {t('gachaRolls.addMode.fullDesc') || 'Tous les champs du formulaire'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 16, alignItems: 'flex-end' }}>
              <TouchableOpacity onPress={() => setShowAddModeModal(false)} accessibilityRole="button">
                <Text style={{ color: themeColors.primary, fontSize: getFontSize(14) }}>{t('common.cancel') || 'Annuler'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
        compact={formCompact}
        onModalVisibilityChange={(v) => onModalVisibilityChange?.(v)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 12,
    padding: 16,
    elevation: 6,
  },
  modeCard: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
});
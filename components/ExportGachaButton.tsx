import { RootState } from '@/redux/store';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';

export default function ExportGachaButton({ getFontSize, themeColors }: { getFontSize: (n: number) => number, themeColors: any }) {
  // Récupère tous les rolls, money et simulations
  const rolls = useSelector((state: RootState) => state.rolls.rolls);
  const moneyEntries = useSelector((state: RootState) => state.money.entries);
  const banners = useSelector((state: RootState) => state.simulations.banners);
  // include wishlist items so users can export wishlist-only gachas
  const wishlistItems = useSelector((state: RootState) => (state.wishlist as any)?.items ?? (state.wishlist as any)?.list ?? []);

  // Liste unique des gachas présents dans les rolls
  const gachaIds = Array.from(new Set([
    ...rolls.map(r => r.gachaId),
    ...wishlistItems.map((w: any) => w.gachaId),
  ]));
  const gachaList = gachaIds.map(id => ({
    id,
    name: `${id}`,
  }));

  const [modalVisible, setModalVisible] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const handleToggle = (id: string) => {
    setSelected(sel =>
      sel.includes(id) ? sel.filter(i => i !== id) : [...sel, id]
    );
  };

  const handleExport = async () => {
    if (selected.length === 0) {
      Alert.alert('Sélectionnez au moins un gacha.');
      return;
    }
    try {
      // Filtrer les données des gachas sélectionnés
      const filteredRolls = rolls.filter(r => selected.includes(r.gachaId));
      const filteredMoney = moneyEntries.filter(e => selected.includes(e.gachaId));
      const filteredSimulations = banners.filter(b => selected.includes(b.gachaId));
      const filteredWishlist = (wishlistItems || []).filter((w: any) => selected.includes(w.gachaId));

      // Format global : chaque slice est une clé, tableau dans une propriété
      const exportData = {
        rolls: { rolls: filteredRolls },
        money: { entries: filteredMoney },
        simulations: { banners: filteredSimulations },
        wishlist: { items: filteredWishlist },
      };

      const json = JSON.stringify(exportData, null, 2);
      const dir = FileSystem.cacheDirectory;
      const fileUri = dir + 'gachanote-export-gacha.json';

      await FileSystem.writeAsStringAsync(fileUri, json, { encoding: 'utf8' });

      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Exporter les données du/des gacha(s)',
      });
      setModalVisible(false);   // Ferme la modal après export
      setSelected([]);          // Désélectionne tout après export
    } catch (e) {
      Alert.alert('Erreur', "L'export a échoué : " + e);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={{
          backgroundColor: themeColors.primary,
          borderRadius: 8,
          padding: 14,
          alignItems: 'center',
          marginBottom: 12,
        }}
        onPress={() => setModalVisible(true)}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: getFontSize(16) }}>
          Exporter un gacha (JSON)
        </Text>
      </TouchableOpacity>
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={{
          flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'
        }}>
          <View style={{
            backgroundColor: themeColors.card,
            padding: 24,
            borderRadius: 16,
            width: '90%',
            maxHeight: '80%',
          }}>
            <Text style={{ fontWeight: 'bold', fontSize: getFontSize(18), color: themeColors.primary, marginBottom: 12 }}>
              Sélectionnez le(s) gacha(s) à exporter
            </Text>
            <ScrollView style={{ maxHeight: 300, marginBottom: 16 }}>
              {gachaList.length === 0 && (
                <Text style={{ color: themeColors.text }}>Aucun gacha avec des rolls.</Text>
              )}
              {gachaList.map((g: any) => (
                <TouchableOpacity
                  key={g.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 10,
                  }}
                  onPress={() => handleToggle(g.id)}
                >
                  <View style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    borderWidth: 2,
                    borderColor: themeColors.primary,
                    backgroundColor: selected.includes(g.id) ? themeColors.primary : 'transparent',
                    marginRight: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {selected.includes(g.id) && (
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>✓</Text>
                    )}
                  </View>
                  <Text style={{ color: themeColors.text, fontSize: getFontSize(16) }}>{g.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={{
                backgroundColor: themeColors.primary,
                borderRadius: 8,
                padding: 14,
                alignItems: 'center',
                marginBottom: 8,
              }}
              onPress={handleExport}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: getFontSize(16) }}>
                Exporter la sélection
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 8 }} onPress={() => setModalVisible(false)}>
              <Text style={{ color: themeColors.primary, textAlign: 'center', fontSize: getFontSize(16) }}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}
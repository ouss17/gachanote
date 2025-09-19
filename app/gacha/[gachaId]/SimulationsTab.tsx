import { addBanner, addSimulationRoll, clearBannerRolls, removeBanner, SimulationBanner, SimulationCharacter } from '@/redux/slices/simulationsSlice';
import { RootState } from '@/redux/store';
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

export default function SimulationsTab({ getFontSize }: { getFontSize: (base: number) => number }) {
  const dispatch = useDispatch();
  const banners = useSelector((state: RootState) => state.simulations.banners);
  const fontSize = useSelector((state: RootState) => state.settings.fontSize);
  const { gachaId } = useLocalSearchParams();

  // Champs du formulaire
  const [name, setName] = useState('');
  const [rate, setRate] = useState('0.7');
  const [featuredInputs, setFeaturedInputs] = useState([{ name: '', rate: '0.7' }]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const { cost: multiCost, label: multiLabel } = getMultiCost(String(gachaId));

  const handleAddFeatured = () => {
    const lastInput = featuredInputs[featuredInputs.length - 1];
    if (!lastInput.name || !lastInput.rate) return;
    setFeaturedInputs([
      ...featuredInputs,
      { name: '', rate: '0.7' }
    ]);
  };

  const handleAddBanner = () => {
    if (!name || !rate) return;
    const id = Date.now().toString();
    const characters: SimulationCharacter[] = [
      { name, rate: parseFloat(rate), isFeatured: false },
      ...featuredInputs
        .filter(f => f.name && f.rate)
        .map(f => ({
          name: f.name,
          rate: parseFloat(f.rate),
          isFeatured: true,
        })),
    ];
    const banner: SimulationBanner = {
      id,
      name,
      characters,
      rolls: [],
      totalResourceUsed: 0,
      gachaId: String(gachaId),
    };
    dispatch(addBanner(banner));
    setName('');
    setRate('0.7');
    setFeaturedInputs([{ name: '', rate: '0.7' }]);
  };

  const handleSimulateRoll = (banner: SimulationBanner, count: number) => {
    const results: { [name: string]: number } = {};
    for (let i = 0; i < count; i++) {
      let obtained = null;
      for (const char of banner.characters) {
        if (Math.random() * 100 < char.rate) {
          obtained = char.name;
          break;
        }
      }
      if (obtained) {
        results[obtained] = (results[obtained] || 0) + 1;
      }
    }
    const rollResult = Object.entries(results).map(([name, count]) => ({ name, count }));
    const resourceUsed = count * (multiCost / 10);
    dispatch(addSimulationRoll({
      bannerId: banner.id,
      roll: {
        id: Date.now().toString(),
        results: rollResult,
        resourceUsed,
        date: new Date().toISOString(),
      }
    }));
  };

  const filteredBanners = banners
    .filter(b => b.gachaId === String(gachaId))
    .filter(b => b.name.toLowerCase().includes(search.trim().toLowerCase()));

  const hasAnyBanner = banners.some(b => b.gachaId === String(gachaId));

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {/* Phrase d'accroche dynamique */}
      <Text style={{ fontSize: getFontSize(15), color: '#007AFF', marginBottom: 8, fontWeight: 'bold' }}>
        Crée tes propres bannières, choisis les personnages et leurs taux de drop, et simule ta chance comme si tu étais sur le vrai jeu !
      </Text>

      {/* Champ de recherche */}
      {hasAnyBanner && (
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
            fontSize: getFontSize(16),
            backgroundColor: '#fff',
            color: '#181818',
          }}
          placeholder="Rechercher une bannière"
          placeholderTextColor="#888"
          value={search}
          onChangeText={setSearch}
        />
      )}

      <Text style={{ marginTop: 8, fontWeight: 'bold', fontSize: getFontSize(18) }}>Bannières existantes</Text>
      <FlatList
        data={filteredBanners}
        keyExtractor={item => item.id}
        renderItem={({ item: banner }) => (
          <View style={{
            marginTop: 24,
            padding: 16,
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 12,
            backgroundColor: '#f9f9f9'
          }}>
            <Text style={{ fontWeight: 'bold', fontSize: getFontSize(16) }}>{banner.name}</Text>
            <Text style={{ color: '#888', marginBottom: 8, fontSize: getFontSize(14) }}>
              {banner.characters.map(c => `${c.name} (${c.rate}%)`).join(', ')}
            </Text>
            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
              <TouchableOpacity
                style={[styles.addBtn, { marginRight: 8 }]}
                onPress={() => handleSimulateRoll(banner, 1)}
              >
                <Text style={{ color: '#fff', fontSize: getFontSize(14) }}>Tirage simple</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addBtn, { marginRight: 8 }]}
                onPress={() => handleSimulateRoll(banner, 10)}
              >
                <Text style={{ color: '#fff', fontSize: getFontSize(14) }}>Tirage x10</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => handleSimulateRoll(banner, 100)}
              >
                <Text style={{ color: '#fff', fontSize: getFontSize(14) }}>Tirage x100</Text>
              </TouchableOpacity>
            </View>
            {/* Historique des résultats */}
            {banner.rolls.length > 0 && (
              <View>
                <Text style={{ fontWeight: 'bold', marginTop: 8, fontSize: getFontSize(15) }}>Résultats :</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginLeft: 8 }}>
                  {banner.rolls.map(roll => (
                    <View
                      key={roll.id}
                      style={{
                        backgroundColor: '#fdecec',
                        borderRadius: 8,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        marginRight: 6,
                        marginBottom: 6,
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: '#d32f2f', fontWeight: 'bold', fontSize: getFontSize(13) }}>
                        {roll.results.map(r => `${r.name}×${r.count}`).join(', ')}
                      </Text>
                      <Text style={{ color: '#888', fontSize: getFontSize(12), marginLeft: 4 }}>
                        ({roll.resourceUsed / (multiCost / 10)} tirage{roll.resourceUsed / (multiCost / 10) > 1 ? 's' : ''})
                      </Text>
                    </View>
                  ))}
                </View>
                <Text style={{ color: '#888', marginTop: 4, fontSize: getFontSize(14) }}>
                  Ressource utilisée : {banner.totalResourceUsed} {multiLabel.replace(/.*?([a-zA-Z]+)$/, '$1')}
                </Text>
              </View>
            )}
            {/* Statistiques de la bannière */}
            {banner.rolls.length > 0 && (() => {
              const stats = getBannerStats(banner);
              return (
                <View style={{ marginTop: 8 }}>
                  <Text style={{ fontWeight: 'bold', marginBottom: 4, fontSize: getFontSize(15) }}>Statistiques :</Text>
                  <Text style={{ color: '#888', fontSize: getFontSize(14) }}>
                    Total de tirages simulés : {stats.totalRolls} {multiLabel.replace(/.*?([a-zA-Z]+)$/, '$1')}
                  </Text>
                  {stats.rates.map(r => (
                    <Text key={r.name} style={{ color: '#007AFF', marginLeft: 8, fontSize: getFontSize(14) }}>
                      {r.name} : {r.count} fois ({r.rate}%)
                    </Text>
                  ))}
                </View>
              );
            })()}
            <View style={{ flexDirection: 'row', marginTop: 12 }}>
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: '#FF3B30', marginRight: 8 }]}
                onPress={() => {
                  Alert.alert(
                    'Confirmation',
                    'Supprimer cette bannière et tout son historique ?',
                    [
                      { text: 'Annuler', style: 'cancel' },
                      { text: 'Supprimer', style: 'destructive', onPress: () => dispatch(removeBanner(banner.id)) }
                    ]
                  );
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: getFontSize(14) }}>Supprimer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: '#FFA500' }]}
                onPress={() => {
                  Alert.alert(
                    'Confirmation',
                    'Réinitialiser l\'historique de cette bannière ?',
                    [
                      { text: 'Annuler', style: 'cancel' },
                      { text: 'Réinitialiser', style: 'destructive', onPress: () => dispatch(clearBannerRolls(banner.id)) }
                    ]
                  );
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: getFontSize(14) }}>Réinitialiser</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 80 }}
        ListEmptyComponent={
          <Text style={{ color: '#888', textAlign: 'center', marginTop: 24, fontSize: getFontSize(15) }}>
            Aucune bannière trouvée.
          </Text>
        }
      />

      {/* Modal pour ajouter une bannière */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <View style={{
            backgroundColor: '#fff',
            padding: 24,
            borderRadius: 16,
            width: '90%',
          }}>
            <Text style={[styles.title, { fontSize: getFontSize(18) }]}>Créer une bannière de simulation</Text>
            <TextInput
              style={[styles.input, { fontSize: getFontSize(16) }]}
              placeholder="Nom du perso vedette"
              value={name}
              onChangeText={setName}
            />
            <Text style={{ marginBottom: 4, fontSize: getFontSize(14) }}>Taux de drop (%)</Text>
            <TextInput
              style={[styles.input, { fontSize: getFontSize(16) }]}
              placeholder="Taux (ex: 0.7)"
              value={rate}
              onChangeText={setRate}
              keyboardType="numeric"
            />

            {/* Ajout de personnages featurés */}
            <Text style={{ marginTop: 12, fontWeight: 'bold', fontSize: getFontSize(15) }}>Personnages featurés (optionnel)</Text>
            {featuredInputs.map((input, idx) => (
              <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 8, fontSize: getFontSize(16) }]}
                  placeholder="Nom du perso"
                  value={input.name}
                  onChangeText={text => {
                    const arr = [...featuredInputs];
                    arr[idx].name = text;
                    setFeaturedInputs(arr);
                  }}
                />
                <TextInput
                  style={[styles.input, { width: 70, marginRight: 8, fontSize: getFontSize(16) }]}
                  placeholder="Taux"
                  value={input.rate}
                  onChangeText={text => {
                    const arr = [...featuredInputs];
                    arr[idx].rate = text;
                    setFeaturedInputs(arr);
                  }}
                  keyboardType="numeric"
                />
                {featuredInputs.length > 1 && (
                  <TouchableOpacity
                    onPress={() => setFeaturedInputs(featuredInputs.filter((_, i) => i !== idx))}
                    style={[styles.addBtn, { backgroundColor: '#FF3B30' }]}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: getFontSize(16) }}>–</Text>
                  </TouchableOpacity>
                )}
                {idx === featuredInputs.length - 1 && (
                  <TouchableOpacity onPress={handleAddFeatured} style={styles.addBtn}>
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: getFontSize(16) }}>+</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <TouchableOpacity style={styles.validateBtn} onPress={() => { handleAddBanner(); setShowModal(false); }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: getFontSize(16) }}>Ajouter la bannière</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 16 }} onPress={() => {
              setShowModal(false);
              setName('');
              setRate('0.7');
              setFeaturedInputs([{ name: '', rate: '0.7' }]);
            }}>
              <Text style={{ color: '#007AFF', textAlign: 'center', fontSize: getFontSize(16) }}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bouton flottant pour ajouter une bannière */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          right: 24,
          bottom: 50,
          borderRadius: 32,
          width: 56,
          height: 56,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#007AFF',
          elevation: 4,
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
        }}
        onPress={() => setShowModal(true)}
        activeOpacity={0.7}
      >
        <Text style={{ color: '#fff', fontSize: getFontSize(32), fontWeight: 'bold' }}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

function getBannerStats(banner: SimulationBanner) {
  const totalRolls = banner.rolls.reduce((sum, roll) => sum + roll.resourceUsed, 0);
  const counts: { [name: string]: number } = {};
  banner.rolls.forEach(roll => {
    roll.results.forEach(r => {
      counts[r.name] = (counts[r.name] || 0) + r.count;
    });
  });
  const rates = Object.entries(counts).map(([name, count]) => ({
    name,
    count,
    rate: totalRolls > 0 ? ((count / totalRolls) * 100).toFixed(2) : '0.00',
  }));
  return { totalRolls, rates };
}

function getMultiCost(gachaId: string) {
  switch (gachaId) {
    case 'dbl':
      return { cost: 1000, label: '1000cc', unit: 'multi' };
    case 'fgo':
      return { cost: 30, label: '30 SQ', unit: 'multi' };
    case 'dokkan':
      return { cost: 50, label: '50 DS', unit: 'multi' };
    case 'sevenDS':
      return { cost: 30, label: '30 gemmes', unit: 'multi' };
    case 'opbr':
      return { cost: 50, label: '50 diamants', unit: 'multi' };
    case 'nikke':
      return { cost: 3000, label: '3000 gemmes', unit: 'multi' };
    default:
      return { cost: 0, label: '', unit: '' };
  }
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  addBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  validateBtn: {
    backgroundColor: '#00B894',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
});
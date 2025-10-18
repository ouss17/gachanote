import { Theme } from '@/constants/Themes';
import { addBanner, addSimulationRoll, clearBannerRolls, removeBanner, SimulationBanner, SimulationCharacter } from '@/redux/slices/simulationsSlice';
import { RootState } from '@/redux/store';
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, Vibration, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

export default function SimulationsTab({ getFontSize }: { getFontSize: (base: number) => number }) {
  const dispatch = useDispatch();
  const banners = useSelector((state: RootState) => state.simulations.banners);
  const fontSize = useSelector((state: RootState) => state.settings.fontSize);
  const { gachaId } = useLocalSearchParams();
  const theme = useSelector((state: RootState) => state.theme.mode);
  const themeColors = Theme[theme as keyof typeof Theme];

  // translation setup (like MoneyTab)
  let lang = useSelector((state: any) => state.nationality.country) || 'fr';
  const texts = require('@/data/texts.json');
  const t = (key: string) => texts[key]?.[lang] || texts[key]?.fr || key;

  // Champs du formulaire
  const [name, setName] = useState('');
  const [rate, setRate] = useState('0.7');
  const [featuredInputs, setFeaturedInputs] = useState([{ name: '', rate: '0.7' }]);
  const [pityThreshold, setPityThreshold] = useState('90'); // default shown in form (string for TextInput)
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  // new states for "Afficher tous les résultats" modal
  const [showAllResultsModal, setShowAllResultsModal] = useState(false);
  const [modalRolls, setModalRolls] = useState<any[]>([]);

  const { cost: multiCost, label: multiLabel } = getMultiCost(String(gachaId));

  // Calcule le nombre de pulls effectués depuis le dernier obtention du "vedette" (premier personnage)
  // On utilise roll.resourceUsed pour estimer le nombre de pulls dans chaque roll :
  // pullsInRoll ≈ Math.floor(resourceUsed / (multiCost / 10))
  const computePityProgress = (banner: SimulationBanner) => {
    const vedetteName = banner?.characters?.[0]?.name;
    if (!vedetteName || !banner || !banner.rolls || banner.rolls.length === 0) return 0;
    let pullsSinceVedette = 0;
    // itérer du plus récent au plus ancien
    const rollsReversed = banner.rolls.slice().reverse();
    for (const roll of rollsReversed) {
      // compter combien de vedette sont présents dans ce roll
      const vedetteCountInRoll = roll.results.reduce((sum: number, r: any) => {
        return sum + (r.name === vedetteName ? r.count : 0);
      }, 0);

      // approximer le nombre de pulls dans ce roll (utiliser floor)
      const pullsInRoll = multiCost && multiCost > 0 ? Math.floor(roll.resourceUsed / (multiCost / 10)) : 0;

      // si ce roll contient la vedette, on considère que le dernier vedette est à l'intérieur de ce roll
      if (vedetteCountInRoll > 0) {
        break;
      }

      pullsSinceVedette += pullsInRoll || 0;
    }
    return pullsSinceVedette;
  };

  // Validation helpers
  const validateCharacters = (chars: SimulationCharacter[]) => {
    if (!chars || chars.length === 0) return 'no-characters';
    const names = new Set<string>();
    for (const c of chars) {
      if (!c.name || !String(c.name).trim()) return 'empty-name';
      const r = Number(c.rate);
      if (Number.isNaN(r) || r < 0 || r > 100) return 'invalid-rate';
      const key = String(c.name).trim().toLowerCase();
      if (names.has(key)) return 'duplicate-name';
      names.add(key);
    }
    return null; // ok
  };

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

    const err = validateCharacters(characters);
    if (err) {
      const map: any = {
        'no-characters': t('simulationsTab.validation.noCharacters'),
        'empty-name': t('simulationsTab.validation.emptyName'),
        'invalid-rate': t('simulationsTab.validation.invalidRate'),
        'duplicate-name': t('simulationsTab.validation.duplicateName'),
      };
      Alert.alert(map[err] || 'Invalid input');
      return;
    }

    const id = Date.now().toString();
    const banner: SimulationBanner = {
      id,
      name,
      characters,
      rolls: [],
      totalResourceUsed: 0,
      gachaId: String(gachaId),
      pityThreshold: pityThreshold ? Number(pityThreshold) : null,
    };
    dispatch(addBanner(banner));
    setName('');
    setRate('0.7');
    setFeaturedInputs([{ name: '', rate: '0.7' }]);
    setPityThreshold('90');
  };

  const MAX_ROLLS = 100000;
  const handleSimulateRoll = (banner: SimulationBanner, count: number) => {
    const err = validateCharacters(banner.characters);
    if (err) {
      Alert.alert(t('simulationsTab.validation.invalidBanner') || t(`simulationsTab.validation.${err}`));
      return;
    }
    if (count > MAX_ROLLS) {
      Alert.alert(t('simulationsTab.validation.tooManyRolls'));
      return;
    }
    Vibration.vibrate(50);
    const results: { [name: string]: number } = {};
    // Use banner-specific pityThreshold if provided, otherwise fallback to default 90
    const PITY_DEFAULT = 90;
    const PITY_THRESHOLD = typeof banner.pityThreshold === 'number' ? banner.pityThreshold : PITY_DEFAULT;

    const featuredChars = banner.characters.filter(c => c.isFeatured);
    const hasFeatured = featuredChars.length > 0;
    const featuredTotalRate = featuredChars.reduce((s, c) => s + Number(c.rate), 0);

    // target the vedette (first character) for pity
    const vedette = banner.characters[0];
    const vedetteName = vedette?.name;
    const vedetteRate = vedette ? Number(vedette.rate) : 0;
    const hasVedette = !!vedetteName;

    // start pity counter from history (pulls since last vedette)
    let consecutiveNoVedette = computePityProgress(banner);
    console.debug('pity start', { bannerId: banner.id, consecutiveNoVedette, PITY_THRESHOLD });

    for (let i = 0; i < count; i++) {
      let obtained: string | null = null;

      // pity activation when threshold reached (if pity enabled) -> force vedette
      // Interpret threshold N as "guarantee on the Nth pull".
      // consecutiveNoVedette counts how many pulls WITHOUT vedette have already occurred.
      // To guarantee on the Nth pull we must force when consecutiveNoVedette >= N-1.
      const pityTriggerAt = PITY_THRESHOLD > 0 ? Math.max(0, PITY_THRESHOLD - 1) : Number.POSITIVE_INFINITY;
      if (hasVedette && PITY_THRESHOLD > 0 && consecutiveNoVedette >= pityTriggerAt) {
        console.debug('pity forced (vedette)', { bannerId: banner.id, pullIndex: i, consecutiveNoVedette, pityTriggerAt });
        obtained = vedetteName;
      } else {
        for (const char of banner.characters) {
          if (Math.random() * 100 < char.rate) {
            obtained = char.name;
            break;
          }
        }
      }

      if (obtained) {
        // check if obtained is the vedette
        const isVedetteObtained = obtained === vedetteName;
        if (isVedetteObtained) console.debug('vedette obtained', { bannerId: banner.id, obtained, i, consecutiveNoVedette });
        results[obtained] = (results[obtained] || 0) + 1;
        if (isVedetteObtained) consecutiveNoVedette = 0;
        else consecutiveNoVedette++;
      } else {
        consecutiveNoVedette++;
      }
    }
    const rollResult = Object.entries(results).map(([name, count]) => ({ name, count }));
    const resourceUsed = Math.round(count * (multiCost / 10));
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

  // show newest banners first (most recently added first)
  const filteredBanners = banners
    .filter(b => b.gachaId === String(gachaId))
    .filter(b => b.name.toLowerCase().includes(search.trim().toLowerCase()))
    .slice()
    .reverse();

  const hasAnyBanner = banners.some(b => b.gachaId === String(gachaId));

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: themeColors.background }}>
      {/* Phrase d'accroche dynamique */}
      <Text style={{ fontSize: getFontSize(15), color: themeColors.primary, marginBottom: 8, fontWeight: 'bold' }}>
        {t('simulationsTab.intro')}
      </Text>

      {/* Champ de recherche */}
      {hasAnyBanner && (
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: themeColors.border,
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
            fontSize: getFontSize(16),
            backgroundColor: themeColors.card,
            color: themeColors.text,
          }}
          placeholder={t('simulationsTab.searchPlaceholder')}
          placeholderTextColor={themeColors.placeholder}
          value={search}
          onChangeText={setSearch}
        />
      )}

      <Text style={{ marginTop: 8, fontWeight: 'bold', fontSize: getFontSize(18), color: themeColors.text }}>{t('simulationsTab.existingBanners')}</Text>
      <FlatList
        data={filteredBanners}
        keyExtractor={item => item.id}
        renderItem={({ item: banner }) => {
          // aggregate total counts across all rolls for this banner
          const aggregated: { [name: string]: number } = {};
          banner.rolls.forEach(roll => {
            roll.results.forEach((r: any) => {
              aggregated[r.name] = (aggregated[r.name] || 0) + r.count;
            });
          });

          // ORDER: ensure featured characters that were obtained appear first (most left),
          // then the other obtained characters sorted by count desc
          const orderedEntries: [string, number][] = (() => {
            const featuredNames = banner.characters.filter(c => c.isFeatured).map(c => c.name);
            const obtainedNames = Object.keys(aggregated);

            // featured obtained, keep banner order
            const featuredEntries = featuredNames
              .filter(n => obtainedNames.includes(n))
              .map(n => [n, aggregated[n]] as [string, number]);

            // other obtained names sorted by count desc
            const otherEntries = obtainedNames
              .filter(n => !featuredNames.includes(n))
              .map(n => [n, aggregated[n]] as [string, number])
              .sort((a, b) => b[1] - a[1]);

            return [...featuredEntries, ...otherEntries];
          })();

          const bannerIsValid = validateCharacters(banner.characters) === null;

          return (
            <View style={{
              marginTop: 24,
              padding: 16,
              borderWidth: 1,
              borderColor: themeColors.border,
              borderRadius: 12,
              backgroundColor: themeColors.card
            }}>
              {/* Title bigger and centered */}
              <Text style={{
                fontWeight: 'bold',
                fontSize: getFontSize(20),
                color: themeColors.text,
                textAlign: 'center',
                marginBottom: 8
              }}>{banner.name}</Text>

              <Text style={{ color: themeColors.placeholder, marginBottom: 8, fontSize: getFontSize(14) }}>
                {banner.characters.map(c => `${c.name} (${c.rate}%)`).join(', ')}
              </Text>

              <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                <TouchableOpacity
                  disabled={!bannerIsValid}
                  style={[styles.addBtn, { marginRight: 8, backgroundColor: themeColors.primary, opacity: bannerIsValid ? 1 : 0.5 }]}
                  onPress={() => handleSimulateRoll(banner, 1)}
                >
                  <Text style={{ color: '#fff', fontSize: getFontSize(14) }}>{t('simulationsTab.draw.single')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={!bannerIsValid}
                  style={[styles.addBtn, { marginRight: 8, backgroundColor: themeColors.primary, opacity: bannerIsValid ? 1 : 0.5 }]}
                  onPress={() => handleSimulateRoll(banner, 10)}
                >
                  <Text style={{ color: '#fff', fontSize: getFontSize(14) }}>{t('simulationsTab.draw.x10')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={!bannerIsValid}
                  style={[styles.addBtn, { backgroundColor: themeColors.primary, opacity: bannerIsValid ? 1 : 0.5 }]}
                  onPress={() => handleSimulateRoll(banner, 100)}
                >
                  <Text style={{ color: '#fff', fontSize: getFontSize(14) }}>{t('simulationsTab.draw.x100')}</Text>
                </TouchableOpacity>
              </View>

              {/* Results header with "Afficher tous les résultats" */}
              {banner.rolls.length > 0 && (
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                    <Text style={{ fontWeight: 'bold', fontSize: getFontSize(15), color: themeColors.text }}>{t('simulationsTab.results')} :</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setModalRolls(banner.rolls);
                        setShowAllResultsModal(true);
                      }}
                    >
                      <Text style={{ color: themeColors.primary, fontSize: getFontSize(13) }}>{t('simulationsTab.viewAllResults')}</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Aggregated results in small chips (only characters + counts) */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
                    {orderedEntries.map(([name, count]) => (
                      <View
                        key={name}
                        style={{
                          backgroundColor: themeColors.simulationResultBg ?? '#fdecec',
                          borderRadius: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 6,
                          marginRight: 6,
                          marginBottom: 6,
                          minWidth: 80,
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ color: themeColors.simulationResultText ?? '#d32f2f', fontWeight: 'bold', fontSize: getFontSize(13) }}>{name}</Text>
                        <Text style={{ color: themeColors.text, fontSize: getFontSize(12), marginTop: 2 }}>{count}×</Text>
                      </View>
                    ))}
                  </View>

                  {/* Resources used - enlarged with number below */}
                  <View style={{ marginTop: 12, alignItems: 'center' }}>
                    <Text style={{ color: themeColors.placeholder, fontSize: getFontSize(14) }}>{t('simulationsTab.resourceUsed')}</Text>
                    <Text style={{ color: themeColors.text, fontWeight: 'bold', fontSize: getFontSize(18), marginTop: 6 }}>
                      {banner.totalResourceUsed} {multiLabel.replace(/.*?([a-zA-Z]+)$/, '$1')}
                    </Text>
                  </View>
                </View>
              )}

              {/* Statistiques (inchangées) */}
              {banner.rolls.length > 0 && (() => {
                const stats = getBannerStats(banner);
                return (
                  <View style={{ marginTop: 8 }}>
                    <Text style={{ fontWeight: 'bold', marginBottom: 4, fontSize: getFontSize(15), color: themeColors.text }}>{t('simulationsTab.statistics')} :</Text>
                    <Text style={{ color: themeColors.placeholder, fontSize: getFontSize(14) }}>
                      {t('simulationsTab.totalSimulated')}: {stats.totalRolls} {multiLabel.replace(/.*?([a-zA-Z]+)$/, '$1')}
                    </Text>
                    {stats.rates.map(r => (
                      <Text key={r.name} style={{ color: themeColors.primary, marginLeft: 8, fontSize: getFontSize(14) }}>
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
                      t('settings.reset') === 'Reset' ? 'Confirmation' : t('settings.reset'), // simple localized title fallback
                      t('simulationsTab.deleteBannerConfirmMessage'),
                      [
                        { text: t('common.cancel'), style: 'cancel' },
                        { text: t('common.delete'), style: 'destructive', onPress: () => dispatch(removeBanner(banner.id)) }
                      ]
                    );
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: getFontSize(14) }}>{t('common.delete')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.addBtn, { backgroundColor: '#FFA500' }]}
                  onPress={() => {
                    Alert.alert(
                      t('settings.reset') === 'Reset' ? 'Confirmation' : t('settings.reset'),
                      t('simulationsTab.resetBannerConfirmMessage'),
                      [
                        { text: t('common.cancel'), style: 'cancel' },
                        { text: t('common.reset'), style: 'destructive', onPress: () => dispatch(clearBannerRolls(banner.id)) }
                      ]
                    );
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: getFontSize(14) }}>{t('common.reset')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        contentContainerStyle={{ paddingBottom: 80 }}
        ListEmptyComponent={
          <Text style={{ color: themeColors.placeholder, textAlign: 'center', marginTop: 24, fontSize: getFontSize(15) }}>
            {t('simulationsTab.noBanners')}
          </Text>
        }
      />

      {/* Modal pour afficher tous les tirages (popup) */}
      <Modal visible={showAllResultsModal} animationType="slide" transparent onRequestClose={() => setShowAllResultsModal(false)}>
        <TouchableWithoutFeedback onPress={() => setShowAllResultsModal(false)}>
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            {/* Prevent outer touch from closing when tapping inside the content */}
            <TouchableWithoutFeedback onPress={() => { /* noop to block propagation */ }}>
              <View style={{
                backgroundColor: themeColors.card,
                padding: 16,
                borderRadius: 12,
                width: '92%',
                maxHeight: '80%',
              }}>
                <Text style={{ color: themeColors.text, fontWeight: 'bold', fontSize: getFontSize(18), marginBottom: 8 }}>{t('simulationsTab.viewAllResultsTitle')}</Text>
                <FlatList
                  data={modalRolls}
                  keyExtractor={(r) => r.id}
                  renderItem={({ item: roll }) => (
                    <View style={{ borderWidth: 1, borderColor: themeColors.border, borderRadius: 10, padding: 10, marginBottom: 8, backgroundColor: themeColors.background }}>
                      <Text style={{ color: themeColors.placeholder, fontSize: getFontSize(12) }}>{new Date(roll.date).toLocaleString()}</Text>
                      <Text style={{ color: themeColors.text, fontWeight: 'bold', marginTop: 6 }}>{roll.results.map((r: any) => `${r.name}×${r.count}`).join(', ')}</Text>
                      <Text style={{ color: themeColors.placeholder, marginTop: 6 }}>{roll.resourceUsed} {multiLabel.replace(/.*?([a-zA-Z]+)$/, '$1')}</Text>
                    </View>
                  )}
                />
                <TouchableOpacity onPress={() => setShowAllResultsModal(false)} style={{ marginTop: 8, alignSelf: 'center' }}>
                  <Text style={{ color: themeColors.primary, fontSize: getFontSize(16) }}>{t('settings.close')}</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

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
            backgroundColor: themeColors.card,
            padding: 24,
            borderRadius: 16,
            width: '90%',
          }}>
            <Text style={[styles.title, { fontSize: getFontSize(18), color: themeColors.text }]}>{t('simulationsTab.addBannerModalTitle')}</Text>
            <TextInput
              style={[styles.input, { fontSize: getFontSize(16), color: themeColors.text, backgroundColor: themeColors.card, borderColor: themeColors.border }]
              }
              placeholder={t('gachaRolls.form.nameFeatured')}
              placeholderTextColor={themeColors.placeholder}
              value={name}
              onChangeText={setName}
            />
            <Text style={{ marginBottom: 4, fontSize: getFontSize(14), color: themeColors.text }}>{t('simulationsTab.dropRate')}</Text>
            <TextInput
              style={[styles.input, { fontSize: getFontSize(16), color: themeColors.text, backgroundColor: themeColors.card, borderColor: themeColors.border }]
              }
              placeholder="Taux (ex: 0.7)"
              placeholderTextColor={themeColors.placeholder}
              value={rate}
              onChangeText={setRate}
              keyboardType="numeric"
            />
            <Text style={{ marginTop: 8, marginBottom: 4, fontSize: getFontSize(13), color: themeColors.placeholder }}>Pity threshold (nombre de tirages sans featured avant garantie, vide = désactivé)</Text>
            <TextInput
              style={[styles.input, { fontSize: getFontSize(16), color: themeColors.text, backgroundColor: themeColors.card, borderColor: themeColors.border }]}
              placeholder="Ex: 90"
              placeholderTextColor={themeColors.placeholder}
              value={pityThreshold}
              onChangeText={setPityThreshold}
              keyboardType="numeric"
            />

            {/* Ajout de personnages featurés */}
            <Text style={{ marginTop: 12, fontWeight: 'bold', fontSize: getFontSize(15), color: themeColors.text }}>{t('simulationsTab.featuredCharacters')}</Text>
            {featuredInputs.map((input, idx) => (
              <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 8, fontSize: getFontSize(16), color: themeColors.text, backgroundColor: themeColors.card, borderColor: themeColors.border }]
                  }
                  placeholder={t('gachaRolls.form.nameFeatured')}
                  placeholderTextColor={themeColors.placeholder}
                  value={input.name}
                  onChangeText={text => {
                    const arr = [...featuredInputs];
                    arr[idx].name = text;
                    setFeaturedInputs(arr);
                  }}
                />
                <TextInput
                  style={[styles.input, { width: 70, marginRight: 8, fontSize: getFontSize(16), color: themeColors.text, backgroundColor: themeColors.card, borderColor: themeColors.border }]
                  }
                  placeholder={t('simulationsTab.dropRate')}
                  placeholderTextColor={themeColors.placeholder}
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
                  <TouchableOpacity onPress={handleAddFeatured} style={[styles.addBtn, { backgroundColor: themeColors.primary }]}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: getFontSize(16) }}>+</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <TouchableOpacity style={[styles.validateBtn, { backgroundColor: themeColors.success }]} onPress={() => { handleAddBanner(); setShowModal(false); }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: getFontSize(16) }}>{t('simulationsTab.addBannerButton')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 16 }} onPress={() => {
              setShowModal(false);
              setName('');
              setRate('0.7');
              setFeaturedInputs([{ name: '', rate: '0.7' }]);
              setPityThreshold('90');
            }}>
              <Text style={{ color: themeColors.primary, textAlign: 'center', fontSize: getFontSize(16) }}>{t('common.cancel')}</Text>
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
          backgroundColor: themeColors.primary,
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
    // increase precision: 4 decimal places
    rate: totalRolls > 0 ? ((count / totalRolls) * 100).toFixed(4) : '0.0000',
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
  pityBarBg: {
    width: 140,
    height: 8,
    backgroundColor: '#EEE',
    borderRadius: 8,
    overflow: 'hidden',
  },
  pityBarFill: {
    height: '100%',
    borderRadius: 8,
  },
});
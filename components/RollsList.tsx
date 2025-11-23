import { Theme } from '@/constants/Themes';
import { computeRatesForRoll } from '@/lib/StatsUtils';
import type { Roll } from '@/redux/slices/rollsSlice';
import { removeRoll } from '@/redux/slices/rollsSlice';
import { AntDesign } from '@expo/vector-icons';
import React from 'react';
import { Alert, FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch } from 'react-redux';

type Props = {
  rolls: Roll[];
  getFontSize: (n: number) => number;
  onEdit: (r: Roll) => void;
  onDelete?: (id: string) => void; 
  t: (k: string) => string;
  themeMode: string;
};

export default function RollsList({ rolls, getFontSize, onEdit, onDelete, t, themeMode }: Props) {
  const themeColors = Theme[themeMode as keyof typeof Theme];
  const dispatch = useDispatch();
  if (rolls.length === 0) {
    return <Text style={{ color: themeColors.text }}>{t('gachaRolls.list.empty')}</Text>;
  }

  return (
    <FlatList
      data={rolls}
      keyExtractor={(r, idx) => `${r.id}_${idx}`}
      renderItem={({ item }) => {
        const rates = computeRatesForRoll(item as any, String(item.gachaId ?? '')) || null;
        const featuredPct = rates ? (rates.featuredRate * 100).toFixed(2) : null;
        const spookPct = rates ? (rates.spookRate * 100).toFixed(2) : null;
        const sideUnitPct = rates ? (rates.sideUnitRate * 100).toFixed(2) : null;
        const featuredItemsPct = rates ? (rates.featuredItemsRate * 100).toFixed(2) : null;
        const srItemsPct = rates ? (rates.srItemsRate * 100).toFixed(2) : null;
        // Hypothetical next-pull rates : computeRatesForRoll retourne `pulls` (total), on l'utilise explicitement
        const totalPulls = typeof rates?.pulls === 'number' ? rates!.pulls : null;
        const safeTotal = (totalPulls && totalPulls > 0) ? totalPulls : null;
        const getCountFromRate = (rate: number | undefined, total: number) =>
          typeof rate === 'number' ? Math.round(rate * total) : null;

        let hypotheticalFeaturedPct: number | null = null;
        let hypotheticalSideUnitPct: number | null = null;
        let hypotheticalFeaturedItemPct: number | null = null;
        if (rates && safeTotal != null) {
          const featuredCount = (rates.featuredCount != null) ? rates.featuredCount : getCountFromRate(rates.featuredRate, safeTotal) ?? 0;
          const sideUnitCount = (rates.sideUnitCount != null) ? rates.sideUnitCount : getCountFromRate(rates.sideUnitRate, safeTotal) ?? 0;
          const featuredItemsCount = (rates.featuredItemsCount != null) ? rates.featuredItemsCount : getCountFromRate(rates.featuredItemsRate, safeTotal) ?? 0;

          hypotheticalFeaturedPct = ((featuredCount + 1) / (safeTotal + 1)) * 100;
          hypotheticalSideUnitPct = ((sideUnitCount + 1) / (safeTotal + 1)) * 100;
          hypotheticalFeaturedItemPct = ((featuredItemsCount + 1) / (safeTotal + 1)) * 100;
        }

        const resAmt = Number(item.resourceAmount ?? 0);
        const resType = item.resourceType ?? '';
        const freePullsAmt = Number(item.freePulls ?? 0);
        const baseTicketAmt = (item.ticketAmount != null) ? Number(item.ticketAmount) : (resType === 'ticket' ? Number(item.resourceAmount ?? 0) : 0);
        const ticketAmt = baseTicketAmt + freePullsAmt;

        const hasResourceNonTicket = !!resType && resType !== 'ticket' && resAmt > 0;
        const hasTicketsOnly = ticketAmt > 0 && !hasResourceNonTicket;
        const hasBoth = hasResourceNonTicket && ticketAmt > 0;

        const partsForA11y: string[] = [];
        if (item.nameFeatured) partsForA11y.push(item.nameFeatured);
        partsForA11y.push(`${t('common.date')}: ${item.date}`);
        if (hasBoth) {
          partsForA11y.push(`${t('common.resource')}: ${resAmt} ${resType}`);
          partsForA11y.push(`${t('common.tickets') || 'Tickets'}: ${ticketAmt}`);
        } else if (hasTicketsOnly) {
          partsForA11y.push(`${t('common.resource')}: ${ticketAmt} ${t('common.tickets') || 'Tickets'}`);
        } else if (hasResourceNonTicket) {
          partsForA11y.push(`${t('common.resource')}: ${resAmt} ${resType}`);
        }

        const imgSize = Math.round(getFontSize(56));
        const imageUri = (item as any).thumbUri ?? (item as any).imageUri ?? null;

        return (
          <TouchableOpacity
            onPress={() => onEdit(item)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessible={true}
            accessibilityLabel={partsForA11y.join(' • ')}
            style={{ marginVertical: 8 }}
          >
            <View style={{ padding: 8, borderRadius: 8, borderWidth: 1, borderColor: themeColors.border, backgroundColor: themeColors.card }}>
              {imageUri ? (
                <>
                  <View style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 10, backgroundColor: themeColors.background }}>
                    <Image
                      source={{ uri: imageUri }}
                      style={{ width: '100%', height: Math.round(getFontSize(160)) }}
                      resizeMode="cover"
                    />
                    {item.nameFeatured ? (
                      <View
                        pointerEvents="none"
                        style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          top: 0,
                          bottom: 0,
                          justifyContent: 'center',
                          alignItems: 'center',
                          backgroundColor: 'rgba(0,0,0,0.35)',
                          paddingHorizontal: 12,
                        }}
                      >
                        <Text
                          numberOfLines={2}
                          ellipsizeMode="tail"
                          style={{
                            color: '#fff',
                            fontWeight: 'bold',
                            fontSize: getFontSize(24),
                            textAlign: 'center',
                          }}
                        >
                          {item.nameFeatured}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={{ paddingHorizontal: 4 }}>

                    <Text style={{ color: themeColors.text, fontSize: getFontSize(15) }}>
                      {t('common.date')} : <Text style={{ fontWeight: 'bold' }}>{new Date(item.date).toLocaleDateString()}</Text>
                    </Text>

                    <View style={{ marginTop: 6 }}>
                      {(() => {
                        const resourceProvided = !!resType && resType !== 'ticket' && resAmt > 0;
                        const ticketProvided = baseTicketAmt > 0;
                        const freeProvided = freePullsAmt > 0;

                        if (resourceProvided && !ticketProvided && !freeProvided) {
                          return (
                            <Text style={{ color: themeColors.text, fontSize: getFontSize(15) }}>
                              {t('common.resource')} : <Text style={{ fontWeight: 'bold' }}>{resAmt} {String(resType).toUpperCase()}</Text>
                            </Text>
                          );
                        }
                        if (ticketProvided && !resourceProvided && !freeProvided) {
                          return (
                            <Text style={{ color: themeColors.text, fontSize: getFontSize(15) }}>
                              {t('common.tickets') || 'Tickets'} : <Text style={{ fontWeight: 'bold' }}>{String(baseTicketAmt)}</Text>
                            </Text>
                          );
                        }
                        if (freeProvided && !resourceProvided && !ticketProvided) {
                          return (
                            <Text style={{ color: themeColors.text, fontSize: getFontSize(15) }}>
                              {t('gachaRolls.form.freePullsShort') || 'Tirages gratuits'} : <Text style={{ fontWeight: 'bold' }}>{String(freePullsAmt)}</Text>
                            </Text>
                          );
                        }
                        return (
                          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                            {resourceProvided && (
                              <Text style={{ color: themeColors.text, fontSize: getFontSize(15) }}>
                                {t('common.resource')} : <Text style={{ fontWeight: 'bold' }}>{resAmt} {String(resType).toUpperCase()}</Text>
                              </Text>
                            )}
                            {ticketProvided && (
                              <Text style={{ color: themeColors.text, fontSize: getFontSize(15), marginLeft: resourceProvided ? 12 : 0 }}>
                                {t('common.tickets') || 'Tickets'} : <Text style={{ fontWeight: 'bold' }}>{String(baseTicketAmt)}</Text>
                              </Text>
                            )}
                            {freeProvided && (
                              <Text style={{ color: themeColors.text, fontSize: getFontSize(15), marginLeft: (resourceProvided || ticketProvided) ? 12 : 0 }}>
                                {t('gachaRolls.form.freePullsShort') || 'Tirages gratuits'} : <Text style={{ fontWeight: 'bold' }}>{String(freePullsAmt)}</Text>
                              </Text>
                            )}
                          </View>
                        );
                      })()}
                    </View>

                    <Text style={{ color: themeColors.text, fontSize: getFontSize(15), marginTop: 8 }}>
                      {t('common.featured')} : <Text style={{ fontWeight: 'bold' }}>{String(item.featuredCount ?? 0)}</Text>{featuredPct ? ` (${featuredPct}%)` : ''}
                      {hypotheticalFeaturedPct != null && (
                        <Text style={{ color: themeColors.placeholder, fontSize: getFontSize(13) }}> {' '}
                          {(t('gachaRolls.hypothetical.ifNextInline') || 'si prochain tirage :')} <Text style={{ fontWeight: 'bold' }}>{`${hypotheticalFeaturedPct.toFixed(2)}%`}</Text>
                        </Text>
                      )}
                    </Text>
                    {(item.spookCount ?? 0) > 0 && (
                      <Text style={{ color: themeColors.text, fontSize: getFontSize(15) }}>
                        {t('common.spook')} : <Text style={{ fontWeight: 'bold' }}>{String(item.spookCount ?? 0)}</Text>{spookPct ? ` (${spookPct}%)` : ''}
                      </Text>
                    )}
                    <Text style={{ color: themeColors.text, fontSize: getFontSize(15) }}>
                      {t('common.sideUnits')} : <Text style={{ fontWeight: 'bold' }}>{String(item.sideUnit ?? 0)}</Text>{sideUnitPct ? ` (${sideUnitPct}%)` : ''}
                      {hypotheticalSideUnitPct != null && (
                        <Text style={{ color: themeColors.placeholder, fontSize: getFontSize(13) }}> {' '}
                          {(t('gachaRolls.hypothetical.ifNextInline') || 'si prochain tirage :')} <Text style={{ fontWeight: 'bold' }}>{`${hypotheticalSideUnitPct.toFixed(2)}%`}</Text>
                        </Text>
                      )}
                    </Text>

                    {(item.featuredItemsCount ?? 0) > 0 && (
                      <Text style={{ color: themeColors.text, fontSize: getFontSize(15), marginTop: 4 }}>
                        {t('gachaRolls.form.featuredItems') || 'Objets vedette'} : <Text style={{ fontWeight: 'bold' }}>{String(item.featuredItemsCount)}</Text>{featuredItemsPct ? ` (${featuredItemsPct}%)` : ''}
                        {hypotheticalFeaturedItemPct != null && (
                          <Text style={{ color: themeColors.placeholder, fontSize: getFontSize(13) }}> {' '}
                            {(t('gachaRolls.hypothetical.ifNextInline') || 'si prochain tirage :')} <Text style={{ fontWeight: 'bold' }}>{`${hypotheticalFeaturedItemPct.toFixed(2)}%`}</Text>
                          </Text>
                        )}
                      </Text>
                    )}
                    {(item.srItemsCount ?? 0) > 0 && (
                      <Text style={{ color: themeColors.text, fontSize: getFontSize(15), marginTop: 4 }}>
                        {t('gachaRolls.form.srItems') || 'Objets SR'} : <Text style={{ fontWeight: 'bold' }}>{String(item.srItemsCount)}</Text>{srItemsPct ? ` (${srItemsPct}%)` : ''}
                      </Text>
                    )}

                    {item.notes ? (
                      <Text style={{ color: themeColors.placeholder, fontSize: getFontSize(13), marginTop: 8 }}>
                        {item.notes}
                      </Text>
                    ) : null}
                  </View>
                </>
              ) : (
                /* no image: render content without any image or placeholder */
                <View style={{ paddingHorizontal: 4 }}>
                  {item.nameFeatured ? (
                    <Text
                      style={{
                        fontWeight: 'bold',
                        marginBottom: 8,
                        fontSize: getFontSize(25),
                        color: themeColors.text,
                        textAlign: 'center',
                        alignSelf: 'stretch'
                      }}
                    >
                      {item.nameFeatured}
                    </Text>
                  ) : null}

                  <Text style={{ color: themeColors.text, fontSize: getFontSize(15) }}>
                    {t('common.date')} : <Text style={{ fontWeight: 'bold' }}>{new Date(item.date).toLocaleDateString()}</Text>
                  </Text>

                  <View style={{ marginTop: 6 }}>
                    {(() => {
                      const resourceProvided = !!resType && resType !== 'ticket' && resAmt > 0;
                      const ticketProvided = baseTicketAmt > 0;
                      const freeProvided = freePullsAmt > 0;

                      if (resourceProvided && !ticketProvided && !freeProvided) {
                        return (
                          <Text style={{ color: themeColors.text, fontSize: getFontSize(15) }}>
                            {t('common.resource')} : <Text style={{ fontWeight: 'bold' }}>{resAmt} {String(resType).toUpperCase()}</Text>
                          </Text>
                        );
                      }
                      if (ticketProvided && !resourceProvided && !freeProvided) {
                        return (
                          <Text style={{ color: themeColors.text, fontSize: getFontSize(15) }}>
                            {t('common.tickets') || 'Tickets'} : <Text style={{ fontWeight: 'bold' }}>{String(baseTicketAmt)}</Text>
                          </Text>
                        );
                      }
                      if (freeProvided && !resourceProvided && !ticketProvided) {
                        return (
                          <Text style={{ color: themeColors.text, fontSize: getFontSize(15) }}>
                            {t('gachaRolls.form.freePullsShort') || 'Tirages gratuits'} : <Text style={{ fontWeight: 'bold' }}>{String(freePullsAmt)}</Text>
                          </Text>
                        );
                      }
                      return (
                        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                          {resourceProvided && (
                            <Text style={{ color: themeColors.text, fontSize: getFontSize(15) }}>
                              {t('common.resource')} : <Text style={{ fontWeight: 'bold' }}>{resAmt} {String(resType).toUpperCase()}</Text>
                            </Text>
                          )}
                          {ticketProvided && (
                            <Text style={{ color: themeColors.text, fontSize: getFontSize(15), marginLeft: resourceProvided ? 12 : 0 }}>
                              {t('common.tickets') || 'Tickets'} : <Text style={{ fontWeight: 'bold' }}>{String(baseTicketAmt)}</Text>
                            </Text>
                          )}
                          {freeProvided && (
                            <Text style={{ color: themeColors.text, fontSize: getFontSize(15), marginLeft: (resourceProvided || ticketProvided) ? 12 : 0 }}>
                              {t('gachaRolls.form.freePullsShort') || 'Tirages gratuits'} : <Text style={{ fontWeight: 'bold' }}>{String(freePullsAmt)}</Text>
                            </Text>
                          )}
                        </View>
                      );
                    })()}
                  </View>

                  <Text style={{ color: themeColors.text, fontSize: getFontSize(15), marginTop: 8 }}>
                    {t('common.featured')} : <Text style={{ fontWeight: 'bold' }}>{String(item.featuredCount ?? 0)}</Text>{featuredPct ? ` (${featuredPct}%)` : ''}
                    {hypotheticalFeaturedPct != null && (
                      <Text style={{ color: themeColors.placeholder, fontSize: getFontSize(13) }}> {' '}
                        {(t('gachaRolls.hypothetical.ifNextInline') || 'si prochain tirage :')} <Text style={{ fontWeight: 'bold' }}>{`${hypotheticalFeaturedPct.toFixed(2)}%`}</Text>
                      </Text>
                    )}
                  </Text>
                  {(item.spookCount ?? 0) > 0 && (
                    <Text style={{ color: themeColors.text, fontSize: getFontSize(15) }}>
                      {t('common.spook')} : <Text style={{ fontWeight: 'bold' }}>{String(item.spookCount ?? 0)}</Text>{spookPct ? ` (${spookPct}%)` : ''}
                    </Text>
                  )}
                  <Text style={{ color: themeColors.text, fontSize: getFontSize(15) }}>
                    {t('common.sideUnits')} : <Text style={{ fontWeight: 'bold' }}>{String(item.sideUnit ?? 0)}</Text>{sideUnitPct ? ` (${sideUnitPct}%)` : ''}
                    {hypotheticalSideUnitPct != null && (
                      <Text style={{ color: themeColors.placeholder, fontSize: getFontSize(13) }}> {' '}
                        {(t('gachaRolls.hypothetical.ifNextInline') || 'si prochain tirage :')} <Text style={{ fontWeight: 'bold' }}>{`${hypotheticalSideUnitPct.toFixed(2)}%`}</Text>
                      </Text>
                    )}
                  </Text>

                  {(item.featuredItemsCount ?? 0) > 0 && (
                    <Text style={{ color: themeColors.text, fontSize: getFontSize(15), marginTop: 4 }}>
                      {t('gachaRolls.form.featuredItems') || 'Objets vedette'} : <Text style={{ fontWeight: 'bold' }}>{String(item.featuredItemsCount)}</Text>{featuredItemsPct ? ` (${featuredItemsPct}%)` : ''}
                      {hypotheticalFeaturedItemPct != null && (
                        <Text style={{ color: themeColors.placeholder, fontSize: getFontSize(13) }}> {' '}
                          {(t('gachaRolls.hypothetical.ifNextInline') || 'si prochain tirage :')} <Text style={{ fontWeight: 'bold' }}>{`${hypotheticalFeaturedItemPct.toFixed(2)}%`}</Text>
                        </Text>
                      )}
                    </Text>
                  )}
                  {(item.srItemsCount ?? 0) > 0 && (
                    <Text style={{ color: themeColors.text, fontSize: getFontSize(15), marginTop: 4 }}>
                      {t('gachaRolls.form.srItems') || 'Objets SR'} : <Text style={{ fontWeight: 'bold' }}>{String(item.srItemsCount)}</Text>{srItemsPct ? ` (${srItemsPct}%)` : ''}
                    </Text>
                  )}

                  {item.notes ? (
                    <Text style={{ color: themeColors.placeholder, fontSize: getFontSize(13), marginTop: 8 }}>
                      {item.notes}
                    </Text>
                  ) : null}
                </View>
              )}

              {/* actions */}
              <View style={{ flexDirection: 'row', marginTop: 8, justifyContent: 'flex-end', gap: 8 }}>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    onEdit(item);
                  }}
                  accessibilityRole="button"
                  accessible={true}
                  accessibilityLabel={t('common.edit') || 'Edit'}
                  style={{
                    marginRight: 8,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <AntDesign name="edit" size={getFontSize(20)} color={themeColors.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    Alert.alert(
                      t('gachaRolls.confirmDeleteTitle') || (t('common.delete') || 'Delete'),
                      t('gachaRolls.confirmDeleteMessage') || 'Supprimer ce tirage ?',
                      [
                        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
                        {
                          text: t('common.delete') || 'Delete',
                          style: 'destructive',
                          onPress: () => {
                            if (typeof onDelete === 'function') onDelete(item.id);
                            else dispatch(removeRoll(item.id));
                          },
                        },
                      ],
                      { cancelable: true }
                    );
                  }}
                  accessibilityRole="button"
                  accessible={true}
                  accessibilityLabel={t('common.delete') || 'Delete'}
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <AntDesign name="delete" size={getFontSize(24)} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        );
       }}
      contentContainerStyle={{ paddingBottom: 80 }}
    />
  );
}
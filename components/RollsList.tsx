import { Theme } from '@/constants/Themes';
import type { Roll } from '@/redux/slices/rollsSlice';
import { removeRoll } from '@/redux/slices/rollsSlice';
import { AntDesign } from '@expo/vector-icons';
import React from 'react';
import { Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch } from 'react-redux';

type Props = {
  rolls: Roll[];
  getFontSize: (n: number) => number;
  onEdit: (r: Roll) => void;
  onDelete?: (id: string) => void; // optional — if not provided we dispatch removeRoll directly
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
      keyExtractor={(r) => r.id}
      renderItem={({ item }) => {
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
              {item.nameFeatured ? <Text style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: 8, fontSize: getFontSize(18), color: themeColors.text }}>{item.nameFeatured}</Text> : null}

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

                  // multiple types present => show each present (resource / tickets / free pulls)
                  return (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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

              <Text style={{ color: themeColors.text, fontSize: getFontSize(15) }}>
                {t('common.featured')} : <Text style={{ fontWeight: 'bold' }}>{item.featuredCount}</Text>
              </Text>
              {(item.spookCount ?? 0) > 0 && (
                <Text style={{ color: themeColors.text, fontSize: getFontSize(15) }}>
                  {t('common.spook')} : <Text style={{ fontWeight: 'bold' }}>{String(item.spookCount ?? 0)}</Text>
                </Text>
              )}
              <Text style={{ color: themeColors.text, fontSize: getFontSize(15) }}>
                {t('common.sideUnits')} : <Text style={{ fontWeight: 'bold' }}>{String(item.sideUnit ?? 0)}</Text>
              </Text>

              {item.notes ? (
                <Text style={{ color: themeColors.placeholder, fontSize: getFontSize(13), marginTop: 8 }}>
                  {item.notes}
                </Text>
              ) : null}

              {/* free pulls now shown next to tickets above; no duplicated line here */}

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
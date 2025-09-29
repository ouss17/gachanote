import { RootState } from '@/redux/store';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import React from 'react';
import { Alert, Text, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';

export default function ExportDataButton({ getFontSize, themeColors }: { getFontSize: (n: number) => number, themeColors: any }) {
  const state = useSelector((state: RootState) => state);

  const handleExport = async () => {
    try {
      const json = JSON.stringify(state, null, 2);
      const dir = FileSystem.cacheDirectory;
      const fileUri = dir + 'gachanote-export.json';

      await FileSystem.writeAsStringAsync(fileUri, json, { encoding: 'utf8' });

      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Exporter toutes les données',
      });
    } catch (e) {
      Alert.alert('Erreur', "L'export a échoué : " + e);
    }
  };

  return (
    <TouchableOpacity
      style={{
        backgroundColor: themeColors.primary,
        borderRadius: 8,
        padding: 14,
        alignItems: 'center',
        marginBottom: 12,
      }}
      onPress={handleExport}
    >
      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: getFontSize(16) }}>
        Exporter tout (JSON)
      </Text>
    </TouchableOpacity>
  );
}
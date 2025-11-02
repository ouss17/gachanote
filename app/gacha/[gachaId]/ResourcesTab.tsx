import ResourcesScreen from '@/components/ResourcesScreen';
import React from 'react';

export default function ResourcesTab({
  getFontSize,
  gachaId,
  onModalVisibilityChange,
}: {
  getFontSize: (n: number) => number;
  gachaId: string;
  onModalVisibilityChange?: (v: boolean) => void;
}) {
  // opcionnel : si tu veux récupérer settings/theme etc, tu peux ici
  return <ResourcesScreen getFontSize={getFontSize} gachaId={gachaId} />;
}
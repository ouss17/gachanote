export const getDefaultServerForGacha = (gachaId: string): string => {
  try {
    const { GACHAS } = require('@/data/gachas') as { GACHAS: any[] };
    const g = (GACHAS || []).find((x: any) => String(x.id) === String(gachaId));
    if (g && Array.isArray(g.serverTags) && g.serverTags.length > 0) return g.serverTags[0];
  } catch (e) {
    // ignore
  }
  return 'global';
};
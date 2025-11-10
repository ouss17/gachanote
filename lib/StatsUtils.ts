type Roll = {
  id: string;
  gachaId: string;
  resourceAmount: number;
  ticketAmount?: number;
  freePulls?: number;
  featuredItemsCount?: number;
  srItemsCount?: number;
  featuredCount: number;
  spookCount?: number;
  sideUnit?: number;
  date: string;
  resourceType?: string;
  nameFeatured?: string;
  notes?: string;
};

function getMultiCost(gachaId: string) {
  switch (gachaId) {
    case 'dbl': return { cost: 1000 };
    case 'fgo': return { cost: 30 };
    case 'dokkan': return { cost: 50 };
    case 'sevenDS': return { cost: 30 };
    case 'opbr': return { cost: 50 };
    case 'nikke': return { cost: 3000 };
    case 'bbs': return { cost: 250 };
    case 'bsr': return { cost: 10 };
    case 'genshin': return { cost: 10 };
    case 'hsr': return { cost: 10 };
    case 'optc': return { cost: 50 };
    case 'uma': return { cost: 1500 };
    case 'ww': return { cost: 10 };
    case 'zenlesszone': return { cost: 1600 };
    case 'haikyufh': return { cost: 1500 };
    case 'jjkpp': return { cost: 3000 };
    case 'sdgundamgge': return { cost: 3000 };
    default: return { cost: 0 };
  }
}

/**
 * Retourne le nombre de pulls représentés par un roll.
 * - 1 ticket = 1 pull
 * - 1 freePull = 1 pull
 * - resourceAmount converti en pulls via multiCost/10 (float pour précision)
 */
export function computePullsForRoll(roll: Roll, gachaId: string) {
  const multiCost = getMultiCost(gachaId).cost;
  const singleCost = multiCost > 0 ? multiCost / 10 : 0;

  const tickets = Number(roll.ticketAmount ?? 0);
  const freePulls = Number(roll.freePulls ?? 0);

  let resourcePulls = 0;
  if ((roll.resourceType ?? '') === 'ticket') {
    resourcePulls = Number(roll.resourceAmount ?? 0);
  } else if (singleCost > 0) {
    resourcePulls = Number(roll.resourceAmount ?? 0) / singleCost; // float
  }

  const totalPulls = tickets + freePulls + resourcePulls;
  return { totalPulls, tickets, freePulls, resourcePulls };
}

/**
 * Calcule les taux pour un roll (valeurs en proportion 0..1).
 * Retourne null si aucun pull représenté (divide-by-zero).
 */
export function computeRatesForRoll(roll: Roll, gachaId: string) {
  const { totalPulls } = computePullsForRoll(roll, gachaId);
  if (!totalPulls || totalPulls <= 0) return null;

  const featured = Number(roll.featuredCount ?? 0);
  const spook = Number(roll.spookCount ?? 0);
  const sideUnit = Number(roll.sideUnit ?? 0);
  const featuredItems = Number(roll.featuredItemsCount ?? 0);
  const srItems = Number(roll.srItemsCount ?? 0);

  return {
    pulls: totalPulls,
    featuredRate: featured / totalPulls,
    spookRate: spook / totalPulls,
    sideUnitRate: sideUnit / totalPulls,
    featuredItemsRate: featuredItems / totalPulls,
    srItemsRate: srItems / totalPulls,
    // counts bruts
    featuredCount: featured,
    spookCount: spook,
    sideUnitCount: sideUnit,
    featuredItemsCount: featuredItems,
    srItemsCount: srItems,
  };
}

/**
 * Calculs par-roll et agrégés pour un tableau de rolls
 */
export function computeAllRates(rolls: Roll[], gachaId: string) {
  const perRoll = rolls.map(r => ({ id: r.id, rates: computeRatesForRoll(r, gachaId) }));
  const totals = rolls.reduce((acc, r) => {
    const { totalPulls } = computePullsForRoll(r, gachaId);
    acc.pulls += totalPulls;
    acc.featured += Number(r.featuredCount ?? 0);
    acc.spook += Number(r.spookCount ?? 0);
    acc.sideUnit += Number(r.sideUnit ?? 0);
    acc.featuredItems += Number(r.featuredItemsCount ?? 0);
    acc.srItems += Number(r.srItemsCount ?? 0);
    return acc;
  }, { pulls: 0, featured: 0, spook: 0, sideUnit: 0, featuredItems: 0, srItems: 0 });

  return {
    perRoll,
    aggregated: totals.pulls > 0 ? {
      pulls: totals.pulls,
      featuredRate: totals.featured / totals.pulls,
      spookRate: totals.spook / totals.pulls,
      sideUnitRate: totals.sideUnit / totals.pulls,
      featuredItemsRate: totals.featuredItems / totals.pulls,
      srItemsRate: totals.srItems / totals.pulls,
      // counts bruts disponibles si besoin
      featuredCount: totals.featured,
      spookCount: totals.spook,
      sideUnitCount: totals.sideUnit,
      featuredItemsCount: totals.featuredItems,
      srItemsCount: totals.srItems,
    } : null
  };
}
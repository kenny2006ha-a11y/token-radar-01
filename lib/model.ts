// The token radar's model: one snapshot of the protocol universe in, one ranked board out.
//
// The board ranks only protocols that genuinely record no token. A protocol is pre-token when its
// index entry records no token (no market cap, no CoinGecko id, no symbol) AND it is not a wrapped,
// staked or bridged product of a token that already trades: its category is not Bridge, Canonical
// Bridge, Liquid Staking, Liquid Restaking, Restaked BTC or CEX, its name carries no whole word
// wrapped, staked or staking, does not begin with an exchange's name, and does not end in a version
// marker. That is the watchlist's own rule, minus the TVL floor, applied to the whole snapshot: the
// floor is where the house's reading started, not where ours stops. The 144 protocols the rule sets
// aside (Binance staked ETH, Bitget SOL, every bridge) are shown in the dashboard's "Not a launch"
// view, with the reason each is set aside, so the separation is visible, not hidden.
//
// Implied value is a comparable-multiples model, derived from the snapshot's own figures:
//
//   multiple   = median(mcap_usd / tvl_usd) of the live-token protocols in the same category
//                (at least 3 of them; otherwise the global median across all live protocols),
//                clamped to [0.05, 1.50]
//   base       = tvl_usd x multiple
//   growth     = clamp(change_7d, -80, 150) per cent
//   growthMult = 1 + 0.55 x growth/100 + 0.25 x max(0, growth - 30)/100
//   chainsMult = 1 + 0.02 x min(chains - 1, 10)
//   maturity   = 0.55 + 0.45 x min(age_days, 1095) / 1095   (age unknown: 365 days)
//   earlyBonus = 1.12 when age_days < 120 and growth > 15, else 1.00
//   implied    = max(1, round(base x growthMult x chainsMult x maturity x earlyBonus))
//
// The multiple is the market's own verdict: in this snapshot, live lending protocols trade at a
// median 0.13x TVL, live DEXs at 0.34x, live RWA at 0.28x. A pre-token protocol is valued the way
// the market already values its category, then adjusted for its own growth, breadth and age. No
// protocol name is ever special-cased: the same function scores every row.

/** The snapshot's protocol entry: exactly the ten fields the sealed input carries. */
export interface SnapshotProtocol {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  gecko_id: string | null;
  symbol: string | null;
}

/** The whole snapshot document. */
export interface Snapshot {
  as_of: string;
  source: string;
  floor_usd: number;
  protocols: SnapshotProtocol[];
  watchlist: string[];
}

/** The model's constants, as the dashboard states them. */
export interface ModelConstants {
  multiple_floor: number;
  multiple_cap: number;
  multiple_min_live: number;
  growth_weight: number;
  growth_bonus_weight: number;
  growth_bonus_above: number;
  growth_floor: number;
  growth_cap: number;
  chain_step: number;
  chain_max_steps: number;
  maturity_floor: number;
  maturity_range: number;
  maturity_days: number;
  unknown_age_days: number;
  early_age_days: number;
  early_growth_pct: number;
  early_bonus: number;
}

export const MODEL: ModelConstants = {
  multiple_floor: 0.05,
  multiple_cap: 1.5,
  multiple_min_live: 3,
  growth_weight: 0.55,
  growth_bonus_weight: 0.25,
  growth_bonus_above: 30,
  growth_floor: -80,
  growth_cap: 150,
  chain_step: 0.02,
  chain_max_steps: 10,
  maturity_floor: 0.55,
  maturity_range: 0.45,
  maturity_days: 1095,
  unknown_age_days: 365,
  early_age_days: 120,
  early_growth_pct: 15,
  early_bonus: 1.12,
};

/** The model's version label: the dashboard names it. */
export const MODEL_VERSION = 'radar-2';

/** How many live-token protocols the Live token view carries, by market cap. */
export const LIVE_ROWS = 24;

/** A farm step: the action, what it costs, and how long it takes. */
export interface FarmStep {
  text: string;
  cost: string;
  time: string;
}

/** One row of board.json: the ranked board's row. */
export interface BoardRow {
  rank: number;
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  gecko_id: string | null;
  symbol: string | null;
  token_status: 'pre-token';
  age_days: number | null;
  implied_value_usd: number;
  model: {
    category_multiple: number;
    growth_pct: number;
    growth_multiplier: number;
    chains_multiplier: number;
    maturity_multiplier: number;
    early_bonus: number;
    age_days: number | null;
  };
  farm_steps: string[];
}

/** The dashboard's compact view of one board row. */
export interface RadarRow {
  rank: number;
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  age_days: number | null;
  implied_value_usd: number;
  category_multiple: number;
  growth_multiplier: number;
  chains_multiplier: number;
  maturity_multiplier: number;
  early_bonus: number;
}

/** A live-token protocol: it already trades, so the board shows the market's own value, not a model's. */
export interface LiveRow {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  mcap_usd: number | null;
  change_7d: number | null;
}

/** A protocol set aside from the ranking, with the reason it is not a launch of its own. */
export interface SetAsideRow {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  reason: string;
}

/** One category's comparable multiple, as the snapshot's live protocols price it. */
export interface CategoryMultiple {
  category: string;
  multiple: number;
  live_count: number;
  median_mcap_tvl: number | null;
}

/** Everything the dashboard needs: the board, the live set, the set-aside set, and the model it runs. */
export interface RadarData {
  as_of: string;
  source: string;
  floor_usd: number;
  model: ModelConstants;
  model_version: string;
  watchlist: string[];
  watchlist_size: number;
  board_size: number;
  early_size: number;
  live_size: number;
  set_aside_size: number;
  global_multiple: number;
  category_multiples: CategoryMultiple[];
  rows: RadarRow[];
  live: LiveRow[];
  set_aside: SetAsideRow[];
}

/** Why the snapshot is not one this model can score. */
export class SnapshotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SnapshotError';
  }
}

const DAY_MS = 86_400_000;

/** A finite number, else `fallback`. */
function finite(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** A whole day count from `from` to `to`, clamped at zero; null when either date is absent or bad. */
export function ageDays(asOf: string, listedAt: string | null): number | null {
  if (listedAt === null) return null;
  const a = Date.parse(`${asOf}T00:00:00Z`);
  const b = Date.parse(`${listedAt}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.max(0, Math.floor((a - b) / DAY_MS));
}

/** DefiLlama's version-marker rule: a name ending in a release is a pool of another protocol. */
const VERSIONED = /\s(V\d+(\.\d+)?|v\d+(\.\d+)?|\d+\.\d+)$/;
/** A name carrying a whole word wrapped, staked or staking. */
const WRAPPED_WORD = /\b(wrapped|staked|staking)\b/i;
/** The exchanges whose products are not launches of their own. */
const EXCHANGE_NAMES = ['Binance', 'Coinbase', 'Bybit', 'Kraken', 'Bitget', 'OKX', 'Bitfinex', 'Gemini'];
/** Categories that are a wrapped, staked or bridged product of a token that already trades. */
const PRODUCT_CATEGORIES = new Set(['Bridge', 'Canonical Bridge', 'Liquid Staking', 'Liquid Restaking', 'Restaked BTC', 'CEX']);

/** Whether a protocol records no token at all. */
export function isPreToken(p: SnapshotProtocol): boolean {
  return p.mcap_usd === null && p.gecko_id === null && p.symbol === null;
}

/** The reason a protocol is not a launch of its own, or null when it is a genuine pre-token protocol. */
export function setAsideReason(p: SnapshotProtocol): string | null {
  if (!isPreToken(p)) return 'its token already trades';
  if (p.category !== null && PRODUCT_CATEGORIES.has(p.category)) {
    if (p.category === 'CEX') return 'a centralised exchange, not a protocol launch';
    return `a ${p.category.toLowerCase()} product of a token that already trades`;
  }
  if (VERSIONED.test(p.name)) return 'a versioned pool of another protocol';
  if (WRAPPED_WORD.test(p.name)) return 'a wrapped or staked product of a token that already trades';
  if (EXCHANGE_NAMES.some((e) => p.name.startsWith(e))) return 'an exchange product, not a protocol launch';
  return null;
}

/** Whether a protocol is one the board may rank: genuinely pre-token, not a product of one that trades. */
export function isRankable(p: SnapshotProtocol): boolean {
  return setAsideReason(p) === null;
}

/** The median of a non-empty list of numbers. */
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/**
 * The comparable multiples: for each category, the median mcap/TVL of the live-token protocols in
 * that category (at least `multiple_min_live` of them), else the global median across all live
 * protocols. Clamped to [multiple_floor, multiple_cap]. Computed from the snapshot at run time.
 */
export function categoryMultiples(snapshot: Snapshot, model: ModelConstants = MODEL): { byCategory: Map<string, number>; global: number; table: CategoryMultiple[] } {
  const live = snapshot.protocols.filter((p) => !isPreToken(p) && p.mcap_usd !== null && p.mcap_usd > 0 && p.tvl_usd > 0);
  const global = median(live.map((p) => p.mcap_usd! / p.tvl_usd));
  const byCat = new Map<string, number[]>();
  for (const p of live) {
    const key = p.category ?? 'Other';
    const list = byCat.get(key) ?? [];
    list.push(p.mcap_usd! / p.tvl_usd);
    byCat.set(key, list);
  }
  const byCategory = new Map<string, number>();
  const table: CategoryMultiple[] = [];
  for (const [cat, ratios] of [...byCat.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
    const med = ratios.length >= model.multiple_min_live ? median(ratios) : null;
    // Rounded to 4 decimals here, so the dashboard's recompute from the stored multiple
    // reproduces the board's implied value exactly.
    const multiple = round4(Math.min(model.multiple_cap, Math.max(model.multiple_floor, med ?? global)));
    byCategory.set(cat, multiple);
    table.push({ category: cat, multiple, live_count: ratios.length, median_mcap_tvl: med === null ? null : round4(med) });
  }
  return { byCategory, global: round4(Math.min(model.multiple_cap, Math.max(model.multiple_floor, global))), table };
}

/** The five factors and the implied value one protocol gets under `model`. */
export function impliedValue(
  protocol: SnapshotProtocol,
  asOf: string,
  multiple: number,
  model: ModelConstants,
): { implied: number; growthPct: number; growthMult: number; chainsMult: number; maturityMult: number; early: number; age: number | null } {
  const age = ageDays(asOf, protocol.listed_at);
  const rawGrowth = finite(protocol.change_7d, 0);
  const growthPct = Math.min(model.growth_cap, Math.max(model.growth_floor, rawGrowth));
  // Every factor is rounded to 4 decimals before it is multiplied in, so the dashboard's
  // recompute from the stored factors reproduces the board's implied value exactly.
  const mult = round4(multiple);
  const growthMult = round4(
    1 + (growthPct / 100) * model.growth_weight + (Math.max(0, growthPct - model.growth_bonus_above) / 100) * model.growth_bonus_weight,
  );
  const chainsMult = round4(1 + model.chain_step * Math.min(Math.max(protocol.chains.length - 1, 0), model.chain_max_steps));
  const ageForModel = age ?? model.unknown_age_days;
  const maturityMult = round4(model.maturity_floor + (Math.min(Math.max(ageForModel, 0), model.maturity_days) / model.maturity_days) * model.maturity_range);
  const early = age !== null && age < model.early_age_days && growthPct > model.early_growth_pct ? model.early_bonus : 1;
  const implied = Math.max(1, Math.round(protocol.tvl_usd * mult * growthMult * chainsMult * maturityMult * early));
  return { implied, growthPct, growthMult, chainsMult, maturityMult, early, age };
}

const round4 = (n: number): number => Math.round(n * 1e4) / 1e4;

/** The snapshot's protocol by slug. */
function bySlug(protocols: SnapshotProtocol[]): Map<string, SnapshotProtocol> {
  return new Map(protocols.map((p) => [p.slug, p]));
}

/** The protocols the board ranks, strongest first, with ranks 1..n. */
export function buildBoard(snapshot: Snapshot, model: ModelConstants = MODEL): BoardRow[] {
  const { byCategory, global } = categoryMultiples(snapshot, model);
  const index = bySlug(snapshot.protocols);
  const chosen = new Map<string, SnapshotProtocol>();
  // The watchlist is the floor: every slug, even one the snapshot no longer carries.
  for (const slug of snapshot.watchlist) {
    const p = index.get(slug);
    if (p !== undefined) chosen.set(slug, p);
  }
  // The early radar: every other genuinely pre-token protocol, not just the largest by TVL.
  for (const p of snapshot.protocols) {
    if (!chosen.has(p.slug) && isRankable(p)) chosen.set(p.slug, p);
  }
  const scored = [...chosen.values()].map((p) => {
    const multiple = byCategory.get(p.category ?? 'Other') ?? global;
    const v = impliedValue(p, snapshot.as_of, multiple, model);
    return { p, multiple, ...v };
  });
  scored.sort((a, b) => b.implied - a.implied || (a.p.slug < b.p.slug ? -1 : a.p.slug > b.p.slug ? 1 : 0));
  return scored.map((s, i) => ({
    rank: i + 1,
    slug: s.p.slug,
    name: s.p.name,
    category: s.p.category,
    chains: s.p.chains,
    tvl_usd: s.p.tvl_usd,
    change_7d: s.p.change_7d,
    mcap_usd: s.p.mcap_usd,
    listed_at: s.p.listed_at,
    gecko_id: s.p.gecko_id,
    symbol: s.p.symbol,
    token_status: 'pre-token',
    age_days: s.age,
    implied_value_usd: s.implied,
    model: {
      category_multiple: round4(s.multiple),
      growth_pct: s.growthPct,
      growth_multiplier: round4(s.growthMult),
      chains_multiplier: round4(s.chainsMult),
      maturity_multiplier: round4(s.maturityMult),
      early_bonus: s.early,
      age_days: s.age,
    },
    farm_steps: farmSteps(s.p, s.age).map(stepText),
  }));
}

/** A step as one string: its action, then its cost and time, within the gate's 20..600 characters. */
export function stepText(step: FarmStep): string {
  let s = `${step.text} Cost: ${step.cost}. Time: ${step.time}.`;
  if (s.length > 600) s = `${s.slice(0, 596)}...`;
  if (s.length < 20) s = `${s} Hold the position and check the protocol's own page.`;
  return s;
}

/** The first chain a protocol names, or a neutral phrase. */
function chainOf(p: SnapshotProtocol): string {
  return p.chains.length > 0 ? p.chains[0]! : 'its main chain';
}

/** How much capital one farm position needs, from the protocol's own TVL. */
function capitalFor(p: SnapshotProtocol): number {
  if (p.tvl_usd >= 5_000_000_000) return 250;
  if (p.tvl_usd >= 1_000_000_000) return 150;
  if (p.tvl_usd >= 100_000_000) return 100;
  return 50;
}

/** How long to hold, from the protocol's age: younger protocols get a longer qualifying window. */
function holdDaysFor(age: number | null): number {
  if (age === null) return 30;
  if (age < 180) return 60;
  if (age < 365) return 45;
  return 30;
}

/** The category's core action, in the words a farmer can follow. */
function actionFor(p: SnapshotProtocol, capital: number, chain: string): string {
  const c = (p.category ?? '').toLowerCase();
  const name = p.name;
  if (c.includes('lend') || c.includes('cdp') || c.includes('collateral')) return `Supply $${capital} of USDC to ${name} on ${chain}, then borrow $20 of it back and repay it, so both sides of the book show your wallet.`;
  if (c.includes('dex') || c.includes('leveraged farm')) return `Provide $${capital} of liquidity to ${name}'s main pool on ${chain}, then swap $10 through it so your wallet shows as both a maker and a taker.`;
  if (c.includes('yield aggregator')) return `Deposit $${capital} into the highest-yield ${name} vault on ${chain} and let the strategy run.`;
  if (c.includes('yield')) return `Deposit $${capital} into a ${name} yield vault on ${chain} and claim the yield it accrues.`;
  if (c.includes('perpetual') || c.includes('derivative') || c.includes('options') || c.includes('synthetic')) return `Deposit $${capital} of USDC as margin on ${name} on ${chain}, open one small position, then close it.`;
  if (c.includes('prediction')) return `Fund $${capital} and place one market position on ${name}, then settle it when the market resolves.`;
  if (c.includes('curator') || c.includes('allocator') || c.includes('vault')) return `Deposit $${capital} into a ${name} vault on ${chain} and keep the shares until the next rebalance.`;
  if (c.includes('stable')) return `Mint or deposit $${capital} of the stable asset through ${name} on ${chain} and hold it in the protocol.`;
  if (c.includes('rwa') || c.includes('basis trad')) return `Mint $${capital} of the protocol's yield-bearing asset on ${chain} and hold it through one full accrual period.`;
  if (c.includes('privacy')) return `Use ${name}'s private transfer or pool on ${chain} with $${capital}, then withdraw to a fresh address.`;
  if (c.includes('insurance')) return `Buy $${capital} of cover from ${name} on ${chain} and keep the policy active.`;
  if (c.includes('nft') || c.includes('gaming')) return `Use ${name} on ${chain} with $${capital}: hold or trade its core asset and complete one in-app action.`;
  if (c.includes('ai') || c.includes('compute')) return `Spend $${capital} on ${name}'s compute or agent product on ${chain} and run one job to completion.`;
  if (c.includes('social')) return `Create a profile on ${name}, connect your wallet, and complete one on-chain social action.`;
  if (c.includes('index')) return `Buy $${capital} of the ${name} index on ${chain} and hold it through one rebalance.`;
  if (c.includes('farm')) return `Deposit $${capital} into ${name}'s farm on ${chain} and harvest the rewards it pays.`;
  return `Deposit $${capital} of USDC into ${name} on ${chain} and keep the position open.`;
}

/** The category's weekly qualifying action: the repeatable step that keeps the wallet active. */
function weeklyFor(p: SnapshotProtocol, chain: string): string {
  const c = (p.category ?? '').toLowerCase();
  if (c.includes('lend') || c.includes('cdp') || c.includes('collateral')) return 'Borrow $10 against the deposit and repay it the same week.';
  if (c.includes('dex') || c.includes('leveraged farm')) return 'Swap $10 through the pool, alternating direction each week.';
  if (c.includes('perpetual') || c.includes('derivative') || c.includes('options') || c.includes('synthetic')) return 'Open and close one small position, keeping the margin in place.';
  if (c.includes('yield') || c.includes('curator') || c.includes('allocator') || c.includes('vault')) return 'Top up the vault by $10 and claim any yield it has accrued.';
  if (c.includes('prediction')) return 'Place one small position on a new market each week.';
  if (c.includes('rwa') || c.includes('basis trad')) return 'Top up the position by $10 and check the accrual.';
  if (c.includes('privacy')) return 'Run one more private transfer, alternating the amount.';
  if (c.includes('stable')) return 'Mint $10 more of the stable asset and hold it.';
  if (c.includes('insurance')) return 'Check the policy and renew or extend it before it lapses.';
  if (c.includes('nft') || c.includes('gaming')) return 'Complete one in-app action, such as a trade, a quest or a stake.';
  if (c.includes('ai') || c.includes('compute')) return 'Run one more job on the product and pay for it from the wallet.';
  if (c.includes('social')) return 'Post or vote once from the connected wallet.';
  if (c.includes('index')) return 'Add $10 to the index position after each rebalance.';
  return 'Make one qualifying action each week, such as a deposit, a borrow, a swap or a vote.';
}

/**
 * A protocol's farm plan: six steps, each an action with a cost and a time, plus a seventh for
 * multi-chain protocols. The plan is derived from the protocol's own record (category, chains, TVL,
 * age), never from a hand-written list of names.
 */
export function farmSteps(p: SnapshotProtocol, age: number | null): FarmStep[] {
  const chain = chainOf(p);
  const capital = capitalFor(p);
  const hold = holdDaysFor(age);
  const action = actionFor(p, capital, chain);
  const steps: FarmStep[] = [
    {
      text: `Use a fresh wallet that holds only the funds you plan to farm, and keep its seed phrase offline.`,
      cost: 'under $3 of gas for the first transaction',
      time: '5 minutes',
    },
    {
      text: action,
      cost: `$${capital} of capital and about $${capital >= 150 ? 8 : 4} of gas`,
      time: '15 minutes to set up',
    },
    {
      text: weeklyFor(p, chain),
      cost: 'about $2 of gas a week',
      time: '10 minutes a week',
    },
    {
      text: `Hold the position for at least ${hold} days so the activity is counted in more than one snapshot.`,
      cost: `the $${capital} stays in the position`,
      time: `${hold} days`,
    },
    {
      text: `Before you withdraw, open the protocol's own points or rewards page and claim only from the link it publishes.`,
      cost: 'no fee to check, and never pay to claim',
      time: '10 minutes',
    },
    {
      text: `Write the wallet, the dates and every transaction in a farm log so you can repeat the position or unwind it.`,
      cost: 'nothing but the log',
      time: '5 minutes',
    },
  ];
  if (p.chains.length > 1) {
    const second = p.chains[1]!;
    steps.splice(3, 0, {
      text: `Repeat the core action on ${second} as well, so the activity is visible on more than one network.`,
      cost: `about $${Math.round(capital / 2)} of capital and $2 of gas`,
      time: '15 minutes',
    });
  }
  return steps;
}

/** The live-token protocols, by market cap, for the dashboard's Live token view. */
export function liveRows(snapshot: Snapshot): LiveRow[] {
  return snapshot.protocols
    .filter((p) => !isPreToken(p) && p.category !== 'CEX')
    .sort((a, b) => (b.mcap_usd ?? 0) - (a.mcap_usd ?? 0) || b.tvl_usd - a.tvl_usd)
    .slice(0, LIVE_ROWS)
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      category: p.category,
      chains: p.chains,
      tvl_usd: p.tvl_usd,
      mcap_usd: p.mcap_usd,
      change_7d: p.change_7d,
    }));
}

/** The pre-token protocols set aside from the ranking, with the reason each is not a launch of
 * its own. (Live-token protocols are not set aside here: they have their own view.) */
export function setAsideRows(snapshot: Snapshot): SetAsideRow[] {
  return snapshot.protocols
    .filter((p) => isPreToken(p) && setAsideReason(p) !== null)
    .sort((a, b) => b.tvl_usd - a.tvl_usd)
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      category: p.category,
      chains: p.chains,
      tvl_usd: p.tvl_usd,
      change_7d: p.change_7d,
      reason: setAsideReason(p)!,
    }));
}

/** A board row's compact form for data.js, with the farm plan generated in the page. */
export function radarRow(row: BoardRow): RadarRow {
  return {
    rank: row.rank,
    slug: row.slug,
    name: row.name,
    category: row.category,
    chains: row.chains,
    tvl_usd: row.tvl_usd,
    change_7d: row.change_7d,
    mcap_usd: row.mcap_usd,
    listed_at: row.listed_at,
    age_days: row.age_days,
    implied_value_usd: row.implied_value_usd,
    category_multiple: row.model.category_multiple,
    growth_multiplier: row.model.growth_multiplier,
    chains_multiplier: row.model.chains_multiplier,
    maturity_multiplier: row.model.maturity_multiplier,
    early_bonus: row.model.early_bonus,
  };
}

/** Everything the dashboard renders, from the snapshot. */
export function buildRadar(snapshot: Snapshot, model: ModelConstants = MODEL): { board: BoardRow[]; radar: RadarData } {
  const board = buildBoard(snapshot, model);
  const live = liveRows(snapshot);
  const setAside = setAsideRows(snapshot);
  const { global, table } = categoryMultiples(snapshot, model);
  const early = board.filter((r) => !snapshot.watchlist.includes(r.slug)).length;
  const radar: RadarData = {
    as_of: snapshot.as_of,
    source: snapshot.source,
    floor_usd: snapshot.floor_usd,
    model,
    model_version: MODEL_VERSION,
    watchlist: [...snapshot.watchlist],
    watchlist_size: snapshot.watchlist.length,
    board_size: board.length,
    early_size: early,
    live_size: live.length,
    set_aside_size: setAside.length,
    global_multiple: round4(global),
    category_multiples: table,
    rows: board.map(radarRow),
    live,
    set_aside: setAside,
  };
  return { board, radar };
}

/** The snapshot out of a file's text, refused unless it is the shape the model scores. */
export function parseSnapshot(text: string): Snapshot {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new SnapshotError('snapshot.json is not JSON');
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) throw new SnapshotError('snapshot.json is not a JSON object');
  const o = raw as Record<string, unknown>;
  if (typeof o.as_of !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(o.as_of)) throw new SnapshotError('snapshot.json has no as_of date');
  if (typeof o.source !== 'string') throw new SnapshotError('snapshot.json has no source');
  if (typeof o.floor_usd !== 'number' || !Number.isSafeInteger(o.floor_usd) || o.floor_usd <= 0) throw new SnapshotError('snapshot.json has no floor_usd');
  if (!Array.isArray(o.protocols)) throw new SnapshotError('snapshot.json has no protocols array');
  if (!Array.isArray(o.watchlist) || o.watchlist.some((s) => typeof s !== 'string')) throw new SnapshotError('snapshot.json has no watchlist of slugs');
  const protocols = o.protocols.map((v, i) => {
    if (typeof v !== 'object' || v === null || Array.isArray(v)) throw new SnapshotError(`snapshot.json's protocol ${i} is not an object`);
    const p = v as Record<string, unknown>;
    if (typeof p.slug !== 'string' || typeof p.name !== 'string' || typeof p.tvl_usd !== 'number' || !Number.isFinite(p.tvl_usd)) {
      throw new SnapshotError(`snapshot.json's protocol ${i} lacks a slug, a name or a TVL`);
    }
    return {
      slug: p.slug,
      name: p.name,
      category: typeof p.category === 'string' ? p.category : null,
      chains: Array.isArray(p.chains) ? p.chains.filter((c): c is string => typeof c === 'string') : [],
      tvl_usd: p.tvl_usd,
      change_7d: typeof p.change_7d === 'number' && Number.isFinite(p.change_7d) ? p.change_7d : null,
      mcap_usd: typeof p.mcap_usd === 'number' && Number.isFinite(p.mcap_usd) ? p.mcap_usd : null,
      listed_at: typeof p.listed_at === 'string' ? p.listed_at : null,
      gecko_id: typeof p.gecko_id === 'string' ? p.gecko_id : null,
      symbol: typeof p.symbol === 'string' ? p.symbol : null,
    };
  });
  return {
    as_of: o.as_of,
    source: o.source,
    floor_usd: o.floor_usd,
    protocols,
    watchlist: o.watchlist as string[],
  };
}

/** Why a board is not one the gate will take, or null: coverage, ranks, order, one shared implied value, and farm steps. */
export function boardIssue(board: BoardRow[], snapshot: Snapshot): string | null {
  const slugs = new Set(board.map((r) => r.slug));
  const missing = snapshot.watchlist.filter((s) => !slugs.has(s));
  if (missing.length > 0) return `the board misses ${missing.length} watchlist slug${missing.length === 1 ? '' : 's'}: ${missing.slice(0, 5).join(', ')}`;
  const ranks = board.map((r) => r.rank).sort((a, b) => a - b);
  for (let i = 0; i < ranks.length; i++) if (ranks[i] !== i + 1) return `rank ${i + 1} is ${ranks[i]}`;
  for (let i = 1; i < board.length; i++) if (board[i]!.implied_value_usd > board[i - 1]!.implied_value_usd) return `row ${i + 1} outranks row ${i} on implied value`;
  if (board.length >= 2 && board[0]!.implied_value_usd === board[board.length - 1]!.implied_value_usd) {
    return `all ${board.length} rows share the same implied value $${board[0]!.implied_value_usd}: a board that ranks nothing by value is not a ranking`;
  }
  for (const r of board) {
    const steps = r.farm_steps;
    if (steps.length < 3 || steps.length > 12) return `${r.slug} has ${steps.length} farm steps`;
    for (const s of steps) if (s.length < 20 || s.length > 600) return `${r.slug} has a farm step of ${s.length} characters`;
    if (!Number.isSafeInteger(r.implied_value_usd) || r.implied_value_usd <= 0) return `${r.slug} has implied value ${r.implied_value_usd}`;
  }
  return null;
}

/** A compact data.js: the dashboard's whole dataset as one script, no fetch and no network. */
export function dataScript(radar: RadarData): string {
  return `window.RADAR=${JSON.stringify(radar)};\n`;
}

/** Price helpers safe for server components (no React hooks, no catalog data) */
export const rub = (n: number) => `${n.toLocaleString('ru-RU')}\u00a0₽`;

/** Set at build time from data/offers.json (next.config.ts): false until a store feed is connected */
export const HAS_PRICES = process.env.NEXT_PUBLIC_HAS_PRICES === '1';

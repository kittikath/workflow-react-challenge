export const capitalize = (str: string): string => {
  if (!str) {
    return '';
  }
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const ADJECTIVES = ['calm', 'fast', 'bold', 'kind', 'neat', 'easy', 'wise', 'cool'];
const NOUNS = ['cat', 'sun', 'tree', 'star', 'bird', 'hill', 'wave', 'leaf'];

const randIndex = (max: number) => {
  try {
    const u = new Uint32Array(1);
    crypto.getRandomValues(u);
    return u[0] % max;
  } catch {
    return Math.floor(Math.random() * max);
  }
};

export const generateReadableId = (separator = '_') => {
  const a = ADJECTIVES[randIndex(ADJECTIVES.length)];
  const n = NOUNS[randIndex(NOUNS.length)];
  const ts = Date.now().toString(36).slice(-3);
  return `${a}${separator}${n}${separator}${ts}`.toLowerCase();
};

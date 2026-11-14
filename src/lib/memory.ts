/** Concrete, easy-to-picture nouns: what memory sport uses, since images are what you store. */
export const WORDS = (
  "anchor apple arrow axe baby balloon banana barrel basket bat bath beard bed bee bell bicycle bird blanket boat bone book boot bottle bow bowl box bread brick bridge broom brush bucket bull butter button cake camel camera candle cannon car carpet carrot castle cat chain chair cheese cherry chicken chimney clock cloud clown coat coin comb cow crab crown cup curtain dice dog doll dolphin donkey door dragon drum duck eagle egg elephant envelope eye fan feather fence fire fish flag flower flute fork fox frog ghost giraffe glove goat guitar hammer hat helmet honey horse hose iceberg igloo jelly kettle key king kite knife ladder lamp lemon lion lobster lock magnet map mask match melon mirror monkey moon mouse mushroom nail needle nest net onion orange owl paint panda parrot peach pear pencil penguin piano pig pillow pineapple pipe pizza plane pumpkin puppet queen rabbit radio rain ring robot rocket rope rose sail saw scarf scissors shark sheep shell ship shoe skull snail snake snow sock sofa spider spoon stamp star sun sword table tent tiger toast tomato tooth torch tower tractor train tree trumpet tyre umbrella violin volcano wagon wall watch whale wheel whistle window wolf zebra"
).split(" ");

export function sample<T>(xs: readonly T[], n: number, rand: () => number = Math.random): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a.slice(0, n);
}

export function randomDigits(n: number, rand: () => number = Math.random): string {
  let s = "";
  for (let i = 0; i < n; i++) s += Math.floor(rand() * 10);
  return s;
}

/** Lenient match: case, spaces and a single typo are forgiven. */
export function sameWord(a: string, b: string): boolean {
  const x = a.trim().toLowerCase().replace(/[^a-z]/g, "");
  const y = b.trim().toLowerCase().replace(/[^a-z]/g, "");
  if (!x || !y) return false;
  if (x === y || x === `${y}s` || y === `${x}s`) return true;
  if (Math.abs(x.length - y.length) > 1 || y.length < 4) return false;
  // Levenshtein distance <= 1
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < x.length && j < y.length) {
    if (x[i] === y[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (x.length > y.length) i++;
    else if (y.length > x.length) j++;
    else {
      i++;
      j++;
    }
  }
  return edits + (x.length - i) + (y.length - j) <= 1;
}

/**
 * The Major system: digits are consonant sounds, vowels (and w, h, y) are free.
 * Decodes a word's spelling into digits. Spelling is a rough stand-in for
 * sound, so common digraphs are handled and double letters count once.
 */
export const MAJOR: Record<string, string> = { s: "0", z: "0", t: "1", d: "1", n: "2", m: "3", r: "4", l: "5", j: "6", k: "7", g: "7", q: "7", f: "8", v: "8", p: "9", b: "9", c: "7", x: "70" };

export function majorDigits(word: string): string {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  let out = "";
  let prev = "";
  for (let i = 0; i < w.length; i++) {
    const two = w.slice(i, i + 2);
    let d: string | undefined;
    let skip = 0;
    const digraph: Record<string, string> = { sh: "6", ch: "6", th: "1", ph: "8", ck: "7", ng: "27", gh: "" };
    if (two in digraph) {
      d = digraph[two];
      skip = 1;
    } else if (w[i] === "c" && /[eiy]/.test(w[i + 1] ?? "")) d = "0"; // soft c: city
    else if (w[i] === "g" && /[eiy]/.test(w[i + 1] ?? "") && i > 0) d = "6"; // soft g: page
    else d = MAJOR[w[i]!];
    const letter = w.slice(i, i + 1 + skip);
    if (d !== undefined && d !== "" && !(letter === prev)) out += d;
    prev = letter;
    i += skip;
  }
  return out;
}

export const MAJOR_EXAMPLES: Record<string, string[]> = {
  "00": ["sauce", "seas"], "01": ["suit", "seed"], "12": ["tin", "dune"], "14": ["tyre", "door"], "21": ["net", "nut"], "23": ["name", "enemy"],
  "32": ["moon", "man"], "41": ["rat", "road"], "52": ["lion", "lane"], "62": ["chain", "shin"], "71": ["cat", "goat"], "81": ["foot", "vat"],
  "91": ["bat", "pot"], "95": ["bell", "pool"], "99": ["baby", "pipe"], "33": ["mummy", "mime"], "44": ["rower", "aurora"], "77": ["cake", "cog"],
};

export function randomPairs(n: number, rand: () => number = Math.random): string[] {
  return Array.from({ length: n }, () => String(Math.floor(rand() * 100)).padStart(2, "0"));
}

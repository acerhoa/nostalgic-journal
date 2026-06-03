export interface Settings {
  theme: string;
  font: string;
  textSize: number; // 14-24px range
  journalTitle: string;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'cream',
  font: "'Lora', Georgia, serif",
  textSize: 17,
  journalTitle: 'My Journal',
};

export const TEXT_SIZE_MIN = 14;
export const TEXT_SIZE_MAX = 24;

export const THEMES: ReadonlyArray<[string, string]> = [
  ['cream', 'Cream & Cocoa'],
  ['terracotta', 'Terracotta'],
  ['honey', 'Honey & Walnut'],
  ['slate', 'Slate & Mist'],
  ['ocean', 'Ocean & Pearl'],
  ['sage', 'Sage & Moss'],
  ['forest', 'Forest & Linen'],
  ['midnight', 'Midnight'],
  ['espresso', 'Espresso'],
  ['plum', 'Plum Dusk'],
];

export const FONTS: ReadonlyArray<[string, string]> = [
  ["'Lora', Georgia, serif", 'Lora — classic serif'],
  ["'Caveat', cursive", 'Caveat — handwritten'],
  ["'Special Elite', monospace", 'Special Elite — typewriter'],
  ["'Quicksand', sans-serif", 'Quicksand — rounded'],
  ["'Nunito', sans-serif", 'Nunito — clean sans'],
];

// Line height multiplier for text size
export const LINE_HEIGHT_RATIO = 1.76;

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

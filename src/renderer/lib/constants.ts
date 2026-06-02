export type SizeKey = 's' | 'm' | 'l';

export interface Settings {
  theme: string;
  font: string;
  size: SizeKey;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'cream',
  font: "'Lora', Georgia, serif",
  size: 'm',
};

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

// [font-size, line-height]
export const SIZES: Record<SizeKey, [string, string]> = {
  s: ['15px', '26px'],
  m: ['17px', '30px'],
  l: ['20px', '34px'],
};

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

import { THEMES, FONTS, type Settings, type SizeKey } from '../lib/constants';

export interface ThemeVars {
  paper: string;
  accent: string;
}

interface Props {
  settings: Settings;
  themeVars: Record<string, ThemeVars>;
  onTheme: (theme: string) => void;
  onSize: (size: SizeKey) => void;
  onFont: (font: string) => void;
}

const SIZE_OPTS: ReadonlyArray<[SizeKey, string]> = [
  ['s', 'Small'],
  ['m', 'Medium'],
  ['l', 'Large'],
];

export default function SettingsPanel({ settings, themeVars, onTheme, onSize, onFont }: Props) {
  return (
    <>
      <h3>Settings</h3>

      <div className="set-group">
        <div className="set-label">Color theme</div>
        <div className="swatches" id="set-swatches">
          {THEMES.map(([id, name]) => {
            const tv = themeVars[id];
            return (
              <button
                key={id}
                className={`swatch${settings.theme === id ? ' sel' : ''}`}
                title={name}
                style={tv ? { background: tv.paper } : undefined}
                onClick={() => onTheme(id)}
              >
                <span style={tv ? { background: tv.accent } : undefined} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="set-group">
        <div className="set-label">Text size</div>
        <div className="seg" id="set-size">
          {SIZE_OPTS.map(([size, label]) => (
            <button
              key={size}
              className={settings.size === size ? 'sel' : undefined}
              onClick={() => onSize(size)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="set-group">
        <div className="set-label">Font</div>
        <div className="font-list" id="set-fonts">
          {FONTS.map(([font, label]) => (
            <button
              key={font}
              className={`font-opt${settings.font === font ? ' sel' : ''}`}
              style={{ fontFamily: font }}
              onClick={() => onFont(font)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

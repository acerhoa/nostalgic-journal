import { THEMES, FONTS, TEXT_SIZE_MIN, TEXT_SIZE_MAX, type Settings } from '../lib/constants';

export interface ThemeVars {
  paper: string;
  accent: string;
}

interface Props {
  settings: Settings;
  themeVars: Record<string, ThemeVars>;
  onTheme: (theme: string) => void;
  onTextSize: (size: number) => void;
  onFont: (font: string) => void;
  onTitle: (title: string) => void;
}

export default function SettingsPanel({ settings, themeVars, onTheme, onTextSize, onFont, onTitle }: Props) {
  return (
    <>
      <h3>Settings</h3>

      <div className="set-group">
        <div className="set-label">Journal Title</div>
        <input
          type="text"
          className="title-input"
          value={settings.journalTitle}
          maxLength={20}
          placeholder="My Journal"
          onChange={(e) => onTitle(e.target.value)}
        />
      </div>

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
        <div className="set-label">Text size — {settings.textSize}px</div>
        <input
          type="range"
          className="size-slider"
          min={TEXT_SIZE_MIN}
          max={TEXT_SIZE_MAX}
          value={settings.textSize}
          onChange={(e) => onTextSize(Number(e.target.value))}
        />
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

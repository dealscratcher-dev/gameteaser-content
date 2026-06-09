import { useEffect, useState } from 'react';

export type SeasonTheme = {
  name: string;
  primary: string;
  secondary: string;
  background: string;
};

const seasonMap: Record<string, SeasonTheme> = {
  winter: {
    name: 'Winter',
    primary: '#00BFFF', // DeepSkyBlue
    secondary: '#1E90FF', // DodgerBlue
    background: 'linear-gradient(135deg, #001F54, #004E92)',
  },
  spring: {
    name: 'Spring',
    primary: '#77DD77', // PastelGreen
    secondary: '#FFB347', // PastelOrange
    background: 'linear-gradient(135deg, #A8E6CF, #56C596)',
  },
  summer: {
    name: 'Summer',
    primary: '#FFD700', // Gold
    secondary: '#FF8C00', // DarkOrange
    background: 'linear-gradient(135deg, #FFEFBA, #FFD3A5)',
  },
  autumn: {
    name: 'Autumn',
    primary: '#FF7F50', // Coral
    secondary: '#8B4513', // SaddleBrown
    background: 'linear-gradient(135deg, #FFB347, #FFCC33)',
  },
  default: {
    name: 'Default',
    primary: '#6366F1', // Indigo-600
    secondary: '#A78BFA', // Indigo-400
    background: 'linear-gradient(135deg, #6366F1, #A78BFA)',
  },
};

/**
 * Hook that returns a seasonal UI configuration.
 * The season is derived from the current month or an optional URL query param `season`.
 * Allows manual override via the `override` argument.
 */
export function useSeasonConfig(override?: string): SeasonTheme {
  const [theme, setTheme] = useState<SeasonTheme>(seasonMap['default']);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paramSeason = urlParams.get('season')?.toLowerCase();
    const month = new Date().getMonth() + 1; // 1-12
    let seasonKey: string | undefined;

    if (override) {
      seasonKey = override.toLowerCase();
    } else if (paramSeason && seasonMap[paramSeason]) {
      seasonKey = paramSeason;
    } else if (month >= 12 || month <= 2) {
      seasonKey = 'winter';
    } else if (month >= 3 && month <= 5) {
      seasonKey = 'spring';
    } else if (month >= 6 && month <= 8) {
      seasonKey = 'summer';
    } else if (month >= 9 && month <= 11) {
      seasonKey = 'autumn';
    }

    const chosen = seasonKey && seasonMap[seasonKey] ? seasonMap[seasonKey] : seasonMap['default'];
    setTheme(chosen);
  }, [override]);

  return theme;
}

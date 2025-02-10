const _presets = {
  thumbnail: {
    quality: 40,
    output: 'webp',
    fit: 'inside',
    w: 400,
    ll: '',
  },

  avatar: {
    quality: 80,
    output: 'webp',
    fit: 'cover',
    w: 256,
    h: 256,
    ll: '',
  },

  avatar_s: {
    quality: 50,
    output: 'webp',
    fit: 'cover',
    w: 128,
    h: 128,
    ll: '',
  },

  avatar_t: {
    quality: 50,
    output: 'webp',
    fit: 'cover',
    w: 64,
    h: 64,
    ll: '',
  },

  raw: {},
} as const;
export type Preset = keyof typeof _presets;
export const presets = _presets as Record<
  string,
  Record<string, string | number>
>;

export const isValidPreset = (preset: string): preset is Preset => {
  return Object.keys(presets).includes(preset);
};

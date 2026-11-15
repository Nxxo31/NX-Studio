export interface DiskLook {
  brightness: number;
  speed: number;
  stretch: number;
  detail: number;
  turbulence: number;
  density: number;
  doppler: number;
  cloudScale: number;
  cloudSpeed: number;
  cloudStrength: number;
  spare0: number;
  spare1: number;
  spare2: number;
  spare3: number;
}

export interface StarLook {
  brightness: number;
  density: number;
  contrast: number;
  warmth: number;
  twinkle: number;
}

export interface BloomLook {
  strength: number;
  threshold: number;
  knee: number;
  radius: number;
}

export interface HeroSettings {
  cameraY: number;
  distance: number;
  diskRadius: number;
  fov: number;
  centerX: number;
  centerY: number;
  cameraRoll: number;
  mouseYaw: number;
  centerFade: number;
  bloom: BloomLook;
  disk: DiskLook;
  stars: StarLook;
}

/** Shared deterministic production defaults for the browser and headless renderer. */
export function defaultHeroSettings(): HeroSettings {
  return {
    cameraY: 0.16,
    distance: 13.5,
    diskRadius: 9,
    fov: 3,
    centerX: 0.8,
    centerY: 0.3,
    cameraRoll: -0.27,
    mouseYaw: 0.15,
    centerFade: 0,
    bloom: { strength: 1.2, threshold: 0.02, knee: 0.22, radius: 1.6 },
        disk: {
          brightness: 0.7,
          speed: 0.75,
          stretch: 10.0,
          detail: 1.5,
          turbulence: 0.6,
          density: 0.55,
          doppler: 1.4,
          cloudScale: 20,
          cloudSpeed: 0.3,
          cloudStrength: 0.015,
          spare0: 0.43,
          spare1: -0.25,
          spare2: -0.67,
          spare3: 0.69,
        },
        stars: { brightness: 0.85, density: 1, contrast: 18, warmth: 1.15, twinkle: 0.15 },
  };
}

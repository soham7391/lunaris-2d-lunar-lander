/**
 * @file levels.ts
 * Centralized level configurations, terrain parameters, visual themes,
 * and mission scoring metrics for LUNARIS.
 */

export interface LevelTheme {
  spaceGradient: [string, string, string];
  nebulaColor: string;
  nebulaCenter: [number, number]; // [xRatio, yRatio]
  terrainGradient: [string, string, string];
  terrainRidgeColor: string;
  padSlabColor: string;
  padBorderColor: string;
  padChevronColor: string;
  padLabelColor: string;
  beaconColorPort: string;
  beaconColorStarboard: string;
  hudAccentColor: string; // Tailwind text class
  hudBorderColor: string; // Tailwind border class
  hudBadgeBg: string; // Tailwind badge class
  celestialBody: 'EARTH' | 'JUPITER' | 'MARS';
}

export interface LevelConfig {
  id: number;
  name: string;
  sector: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  // Landing Pad Dimensions relative to viewport
  padStartXRatio: number;
  padEndXRatio: number;
  padYRatio: number;
  padLabel: string;
  // Terrain Generation Parameters
  terrainRoughness: number;
  craterDepth: number;
  cragFrequency: number;
  // Spawn Conditions
  initialLanderXRatio: number;
  initialLanderYRatio: number;
  initialVx: number; // px/s
  initialVy: number; // px/s
  // Theme & Visual Identity
  theme: LevelTheme;
}

export const LEVELS: LevelConfig[] = [
  // -------------------------------------------------------------
  // LEVEL 1: Easy · Mare Tranquillitatis
  // -------------------------------------------------------------
  {
    id: 1,
    name: 'Mare Tranquillitatis',
    sector: 'Site Alpha · Primary Staging',
    description: 'Smooth lunar basalt basin with a wide central landing pad. Ideal for flight computer calibration and soft descent practice.',
    difficulty: 'Easy',
    padStartXRatio: 0.36,
    padEndXRatio: 0.64, // 28% width wide pad
    padYRatio: 0.78,
    padLabel: 'TRANQUILLITY BASE · SITE ALPHA',
    terrainRoughness: 0.5,
    craterDepth: 18,
    cragFrequency: 0.8,
    initialLanderXRatio: 0.5, // Centered directly above pad
    initialLanderYRatio: 0.12,
    initialVx: 0,
    initialVy: 4, // Gentle 0.5 m/s descent
    theme: {
      spaceGradient: ['#04060d', '#070a14', '#090d1a'],
      nebulaColor: 'rgba(14, 165, 233, 0.05)',
      nebulaCenter: [0.75, 0.25],
      terrainGradient: ['#1e293b', '#0f172a', '#020617'],
      terrainRidgeColor: '#64748b',
      padSlabColor: '#1e293b',
      padBorderColor: '#38bdf8',
      padChevronColor: '#f59e0b',
      padLabelColor: '#94a3b8',
      beaconColorPort: '#f59e0b',
      beaconColorStarboard: '#10b981',
      hudAccentColor: 'text-cyan-400',
      hudBorderColor: 'border-cyan-800',
      hudBadgeBg: 'bg-cyan-950/60',
      celestialBody: 'EARTH',
    },
  },

  // -------------------------------------------------------------
  // LEVEL 2: Medium · Oceanus Procellarum
  // -------------------------------------------------------------
  {
    id: 2,
    name: 'Oceanus Procellarum',
    sector: 'Site Bravo · Eastern Plateau',
    description: 'Undulating terrain with an offset starboard landing pad. Requires lateral vector translation and roll compensation during descent.',
    difficulty: 'Medium',
    padStartXRatio: 0.60,
    padEndXRatio: 0.80, // 20% width offset pad
    padYRatio: 0.76,
    padLabel: 'OCEANUS PROCELLARUM · SITE BRAVO',
    terrainRoughness: 1.1,
    craterDepth: 28,
    cragFrequency: 1.2,
    initialLanderXRatio: 0.32, // Offset left - player must glide rightwards to reach pad
    initialLanderYRatio: 0.11,
    initialVx: 2,
    initialVy: 5,
    theme: {
      spaceGradient: ['#07040f', '#0f0b1e', '#160d28'],
      nebulaColor: 'rgba(168, 85, 247, 0.06)',
      nebulaCenter: [0.25, 0.35],
      terrainGradient: ['#281a3d', '#170f26', '#090510'],
      terrainRidgeColor: '#8b5cf6',
      padSlabColor: '#1d122e',
      padBorderColor: '#c084fc',
      padChevronColor: '#fbbf24',
      padLabelColor: '#c4b5fd',
      beaconColorPort: '#fbbf24',
      beaconColorStarboard: '#a855f7',
      hudAccentColor: 'text-amber-400',
      hudBorderColor: 'border-amber-800',
      hudBadgeBg: 'bg-amber-950/60',
      celestialBody: 'JUPITER',
    },
  },

  // -------------------------------------------------------------
  // LEVEL 3: Hard · Tycho Crater Basin
  // -------------------------------------------------------------
  {
    id: 3,
    name: 'Tycho Crater Basin',
    sector: 'Site Gamma · Chasm Depression',
    description: 'Rugged jagged mountain ridges flank a narrow crater floor pad. Severe crag collision hazards require high throttle precision.',
    difficulty: 'Hard',
    padStartXRatio: 0.44,
    padEndXRatio: 0.56, // 12% width narrow pad
    padYRatio: 0.80,
    padLabel: 'TYCHO CENTRAL PEAK · SITE GAMMA',
    terrainRoughness: 1.8,
    craterDepth: 44,
    cragFrequency: 1.8,
    initialLanderXRatio: 0.5,
    initialLanderYRatio: 0.08, // High drop into hazardous chute
    initialVx: 3,
    initialVy: 6,
    theme: {
      spaceGradient: ['#0d0407', '#17080d', '#220b13'],
      nebulaColor: 'rgba(244, 63, 94, 0.07)',
      nebulaCenter: [0.8, 0.2],
      terrainGradient: ['#38141d', '#200a10', '#0a0205'],
      terrainRidgeColor: '#f43f5e',
      padSlabColor: '#260a12',
      padBorderColor: '#fb7185',
      padChevronColor: '#34d399',
      padLabelColor: '#fda4af',
      beaconColorPort: '#f43f5e',
      beaconColorStarboard: '#34d399',
      hudAccentColor: 'text-rose-400',
      hudBorderColor: 'border-rose-800',
      hudBadgeBg: 'bg-rose-950/60',
      celestialBody: 'MARS',
    },
  },
];

const UNLOCKED_LEVELS_STORAGE_KEY = 'lunaris_unlocked_levels_v1';

/**
 * Retrieves the set of currently unlocked level IDs (persisted in localStorage).
 */
export function getUnlockedLevels(): number[] {
  try {
    const raw = localStorage.getItem(UNLOCKED_LEVELS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.includes(1)) {
        return parsed;
      }
    }
  } catch {
    // Ignore storage errors
  }
  return [1]; // Level 1 is always unlocked by default
}

/**
 * Unlocks the next level sequentially.
 */
export function unlockLevel(levelId: number): void {
  try {
    const current = getUnlockedLevels();
    if (!current.includes(levelId)) {
      const updated = [...current, levelId].sort((a, b) => a - b);
      localStorage.setItem(UNLOCKED_LEVELS_STORAGE_KEY, JSON.stringify(updated));
    }
  } catch {
    // Ignore storage errors
  }
}

/**
 * Gets level by numerical ID (falls back to Level 1 if invalid).
 */
export function getLevelById(id: number): LevelConfig {
  const found = LEVELS.find((l) => l.id === id);
  return found || LEVELS[0];
}

export interface MissionScoreBreakdown {
  fuelScore: number;
  descentRateScore: number;
  lateralDriftScore: number;
  tiltScore: number;
  difficultyMultiplier: number;
  totalScore: number;
}

/**
 * Calculates authentic mission flight performance score.
 */
export function calculateMissionScore(
  fuelPercent: number,
  descentRateMs: number,
  driftSpeedMs: number,
  tiltDeg: number,
  level: LevelConfig
): MissionScoreBreakdown {
  // Fuel bonus: up to 1,500 points
  const fuelScore = Math.round(Math.max(0, fuelPercent) * 15);

  // Soft landing bonus: up to 1,500 points (rewarding slow touchdown)
  const maxVy = 3.2;
  const descentRateScore = Math.round(
    Math.max(0, (maxVy - Math.min(maxVy, descentRateMs)) / maxVy) * 1500
  );

  // Zero-drift bonus: up to 1,000 points
  const maxVx = 1.8;
  const lateralDriftScore = Math.round(
    Math.max(0, (maxVx - Math.min(maxVx, driftSpeedMs)) / maxVx) * 1000
  );

  // Perpendicular attitude bonus: up to 1,000 points
  const maxTilt = 10.0;
  const tiltScore = Math.round(
    Math.max(0, (maxTilt - Math.min(maxTilt, tiltDeg)) / maxTilt) * 1000
  );

  // Difficulty Multipliers: L1 = 1.0, L2 = 1.5, L3 = 2.0
  const multipliers: Record<number, number> = { 1: 1.0, 2: 1.5, 3: 2.0 };
  const difficultyMultiplier = multipliers[level.id] || 1.0;

  const baseScore = fuelScore + descentRateScore + lateralDriftScore + tiltScore;
  const totalScore = Math.round(baseScore * difficultyMultiplier);

  return {
    fuelScore,
    descentRateScore,
    lateralDriftScore,
    tiltScore,
    difficultyMultiplier,
    totalScore,
  };
}

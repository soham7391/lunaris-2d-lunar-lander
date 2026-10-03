/**
 * @file game.ts
 * Core type definitions for LUNARIS 2D Lunar Landing Simulation.
 * Organized to support modular physics, transformations, rendering, and collision detection.
 */

export type GameView = 'MENU' | 'BRIEFING' | 'SIMULATION';

export type SimulationStatus = 'FLYING' | 'LANDED' | 'CRASHED' | 'PAUSED';

export interface Vector2D {
  x: number;
  y: number;
}

export interface Transform2D {
  position: Vector2D;
  rotation: number; // in radians
  scale: number;
}

export interface LanderModel {
  width: number;
  height: number;
  centerOfMass: Vector2D;
  leftFootpad: Vector2D;
  rightFootpad: Vector2D;
  mainNozzle: Vector2D;
}

export interface TerrainPoint {
  x: number;
  y: number;
}

export interface LandingPad {
  startX: number;
  endX: number;
  y: number;
  label: string;
}

export interface TelemetryData {
  altitude: number; // meters
  verticalVelocity: number; // m/s
  horizontalVelocity: number; // m/s
  pitchAngle: number; // degrees
  fuelPercent: number; // 0 - 100
  throttlePercent: number; // 0 - 100
  status: SimulationStatus;
}

export interface CGDebugOptions {
  showWireframe: boolean;
  showLocalAxes: boolean;
  showWorldGrid: boolean;
  showLandingZoneBounds: boolean;
  showCenterOfMass: boolean;
}

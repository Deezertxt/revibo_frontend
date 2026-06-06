import type { Region } from 'react-native-maps';

let savedMapRegion: Region | null = null;

export function getSavedMapRegion(): Region | null {
  return savedMapRegion;
}

export function setSavedMapRegion(region: Region): void {
  savedMapRegion = region;
}

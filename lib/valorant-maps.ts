import type { IMapsResponse, IValorantMap } from '../components/landing/supported-maps/IMapsResponse';

const MAPS_API_URL = 'https://valorant-api.com/v1/maps';

export async function fetchValorantMaps(): Promise<IValorantMap[]> {
  const response = await fetch(MAPS_API_URL);
  if (!response.ok) {
    throw new Error(`Valorant maps API returned ${response.status}`);
  }

  const payload: IMapsResponse = await response.json();
  return payload.data;
}

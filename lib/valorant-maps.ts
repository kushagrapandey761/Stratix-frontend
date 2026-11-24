import type { IMapsResponse, IValorantMap } from '../components/landing/supported-maps/IMapsResponse';

const MAPS_API_URL = 'https://valorant-api.com/v1/maps';
const COMPETITIVE_MAP_NAMES = [
  'Ascent',
  'Bind',
  'Haven',
  'Split',
  'Lotus',
  'Sunset',
  'Icebox',
  'Breeze',
  'Fracture',
  'Pearl',
  'Abyss',
  'Corrode',
];

export async function fetchCompetitiveMaps(): Promise<IValorantMap[]> {
  const response = await fetch(MAPS_API_URL);
  if (!response.ok) {
    throw new Error(`Valorant maps API returned ${response.status}`);
  }

  const payload: IMapsResponse = await response.json();
  const mapsByName = new Map(
    payload.data.map((map) => [map.displayName.toLowerCase(), map] as const)
  );

  return COMPETITIVE_MAP_NAMES.flatMap((name) => {
    const map = mapsByName.get(name.toLowerCase());
    return map ? [map] : [];
  });
}

export function getMapSiteCount(map: IValorantMap): number | undefined {
  const description = map.tacticalDescription?.toLowerCase() ?? '';
  const match = description.match(/\b(1|2|3|one|two|three)\s+sites?\b/);
  if (!match) return undefined;

  const count = match[1];
  if (count === 'one') return 1;
  if (count === 'two') return 2;
  if (count === 'three') return 3;
  return Number(count);
}

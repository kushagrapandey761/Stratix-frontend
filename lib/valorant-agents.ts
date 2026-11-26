export interface IValorantAgent {
  uuid: string;
  displayName: string;
  displayIcon: string | null;
}

interface IAgentsResponse {
  data: IValorantAgent[];
}

const AGENTS_API_URL = 'https://valorant-api.com/v1/agents?isPlayableCharacter=true';

export async function fetchPlayableAgents(): Promise<IValorantAgent[]> {
  const response = await fetch(AGENTS_API_URL);
  if (!response.ok) {
    throw new Error(`Valorant agents API returned ${response.status}`);
  }

  const payload: IAgentsResponse = await response.json();
  return payload.data;
}

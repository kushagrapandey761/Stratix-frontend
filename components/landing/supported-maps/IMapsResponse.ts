export interface IValorantMap {
  uuid: string;
  displayName: string;
  splash: string;
}

export interface IMapsResponse {
  data: IValorantMap[];
}

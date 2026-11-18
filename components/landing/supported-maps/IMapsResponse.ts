export interface IValorantMap {
  uuid: string;
  displayName: string;
  displayIcon: string;
}

export interface IMapsResponse {
  data: IValorantMap[];
}

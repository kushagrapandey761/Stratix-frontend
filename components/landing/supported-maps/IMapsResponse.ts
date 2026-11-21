export interface IValorantMap {
  uuid: string;
  displayName: string;
  displayIcon: string;
  splash?: string;
  listViewIcon?: string;
}

export interface IMapsResponse {
  data: IValorantMap[];
}

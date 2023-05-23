import * as NodeAPI from "./node-api";

export interface ExtrudePoint {
  x: number;
  y: number;
  z: number;
  a: number;
}

export class State {
  stage?:
    | "stage-1" // 导入牙模
    | "stage-2" // 对牙位
    | "stage-3" // 点牙位
    | null;
  modelFile?: string;
  modelMatrix?: number[];
  refModelMatrix?: number[];
  extrudePoints?: ExtrudePoint[];
}

export type SCJB = typeof NodeAPI;

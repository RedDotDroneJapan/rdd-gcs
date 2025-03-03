import { Cartesian3 } from "cesium";

export type Point = Cartesian3
export type Path = Point[];
export interface Track {
    [x: string]: Path;
}
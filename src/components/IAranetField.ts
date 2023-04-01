export interface IAranetField {
    label: string;
    field: number;
    parse: (view: DataView, index: number) => number;
    scale: (parsed: number) => number;
}
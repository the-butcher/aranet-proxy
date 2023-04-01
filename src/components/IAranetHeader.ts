export interface IAranetHeader {
    field: number;
    updateRepeat: number;
    updateOffset: number;
    recordTotal: number;
    recordStart: number;
    recordCount: number;
    toTimestamp: (index: number) => number;
}
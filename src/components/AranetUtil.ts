import { IAranetField } from "./IAranetField";
import { IAranetHeader } from "./IAranetHeader";

export class AranetUtil {

    static createCommand(field: IAranetField, min: number, max: number): Uint8Array {
        const paramsB = new ArrayBuffer(6);
        const paramsV = new DataView(paramsB);
        paramsV.setUint8(0, 0x61);
        paramsV.setUint8(1, field.field);
        paramsV.setUint16(2, min, true);
        paramsV.setUint16(4, max, true);
        return new Uint8Array(paramsB);
    }

    /**
     * parses header information from a historic data value
     * sdafsfd
     * @param view
     * @returns
     */
    static parseHeader(view: DataView): IAranetHeader {
        const now = Date.now();
        const updateRepeat = view.getUint16(1, true);
        const recordTotal = view.getUint16(3, true);
        const updateOffset = view.getUint16(5, true);
        const recordStart = view.getUint16(7, true);
        const recordCount = view.getUint8(9);
        return {
            field: view.getUint8(0),
            updateRepeat: updateRepeat,
            recordTotal,
            updateOffset: updateOffset,
            recordStart,
            recordCount,
            toTimestamp: (index: number) => {
                return now - (updateOffset + (recordTotal - recordStart - index) * updateRepeat) * 1000;
            }
        }
    }

}
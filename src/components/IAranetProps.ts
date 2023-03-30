export interface IAranetProps {
    device: BluetoothDevice;
    handleDeviceRemove: (device: BluetoothDevice) => void;
}
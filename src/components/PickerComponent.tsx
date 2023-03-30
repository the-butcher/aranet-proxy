
import SettingsBluetoothIcon from '@mui/icons-material/SettingsBluetooth';
import { Button } from '@mui/material';
import { useEffect } from 'react';
import { IPickerProps } from './IPickerProps';

export const SENSOR_SERVICE_UUID = 'f0cd1400-95da-4f4b-9ac8-aa55d312af0c'


function PickerComponent(props: IPickerProps) {

    const { handleDevicePicked } = props;

    useEffect(() => {
        console.debug('✨ building PickerComponent');
    }, []);

    const requestDevices = () => {

        const bluetooth: Bluetooth = navigator.bluetooth;

        console.debug('bluetooth', bluetooth);
        bluetooth.requestDevice({
            filters: [
                {
                    services: [SENSOR_SERVICE_UUID],
                },
            ],
            optionalServices: [
                'device_information',
                'battery_service'
            ],
        }).then(device => {
            handleDevicePicked(device);
        }).catch((e: any) => {
            console.error(e);
        });

    };


    return (
        <Button size='small' variant="outlined" endIcon={<SettingsBluetoothIcon />} onClick={requestDevices}>
            connect to aranet device
        </Button>
    );
}

export default PickerComponent;
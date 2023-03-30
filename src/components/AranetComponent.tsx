
import BluetoothDisabledIcon from '@mui/icons-material/BluetoothDisabled';
import { Stack, Typography } from '@mui/material';
import Card from '@mui/material/Card';
import { useEffect, useRef, useState } from 'react';
import { IAranetProps } from './IAranetProps';
import { SENSOR_SERVICE_UUID } from './PickerComponent';

export const CHARACTERISTIC_LATEST_VALUES = 'f0cd3001-95da-4f4b-9ac8-aa55d312af0c';
export const CHARACTERISTIC_READ_INTERVAL = 'f0cd2002-95da-4f4b-9ac8-aa55d312af0c';
export const CHARACTERISTIC_LAST_MEASURED = 'f0cd2004-95da-4f4b-9ac8-aa55d312af0c';

function AranetComponent(props: IAranetProps) {

    const { device, handleDeviceRemove: handleDisconnect } = props;
    const [connectionState, setConnectionState] = useState<string>('connecting');
    const [gatt, setGatt] = useState<BluetoothRemoteGATTServer>();

    const [latestValuesCharacteristic, setLatestValuesCharacteristic] = useState<BluetoothRemoteGATTCharacteristic>();
    const [readIntervalCharacteristic, setReadIntervalCharacteristic] = useState<BluetoothRemoteGATTCharacteristic>();
    const [lastMeasuredCharacteristic, setLastMeasuredCharacteristic] = useState<BluetoothRemoteGATTCharacteristic>();
    const [co2, setCo2] = useState<number>();
    const [color, setColor] = useState<string>('#ffffff');

    const intervalHandle = useRef<number>(-1);

    useEffect(() => {
        console.debug('✨ building AranetComponent');
    }, []);

    useEffect(() => {
        console.debug('⚙ updating AranetComponent (device)', device);
        device.gatt?.connect().then(gatt => {
            setGatt(gatt);
        }).catch((e: any) => {
            setConnectionState('failed connecting to gatt server');
            console.error(e);
        });
    }, [device]);

    useEffect(() => {
        console.debug('⚙ updating AranetComponent (connectionState)', connectionState);
    }, [connectionState]);

    useEffect(() => {

        console.debug('⚙ updating AranetComponent (gatt)', gatt);
        gatt?.getPrimaryService(SENSOR_SERVICE_UUID).then(service => {

            console.log('service', service);
            service.getCharacteristics().then(charateristics => {

                const latestValuesCharacteristic = charateristics.filter(charateristic => charateristic.uuid === CHARACTERISTIC_LATEST_VALUES)[0];
                setLatestValuesCharacteristic(latestValuesCharacteristic);

                const readIntervalCharacteristic = charateristics.filter(charateristic => charateristic.uuid === CHARACTERISTIC_READ_INTERVAL)[0];
                setReadIntervalCharacteristic(readIntervalCharacteristic);

                const lastMeasuredCharacteristic = charateristics.filter(charateristic => charateristic.uuid === CHARACTERISTIC_LAST_MEASURED)[0];
                setLastMeasuredCharacteristic(lastMeasuredCharacteristic);

                setConnectionState('connected');

            }).catch((e: any) => {
                setConnectionState('failed retrieving charateristics');
                console.error(e);
            });

        }).catch((e: any) => {
            setConnectionState('failed retrieving primary service');
            console.error(e);
        });

    }, [gatt]);


    useEffect(() => {

        console.debug('⚙ updating AranetComponent (characteristics)', readIntervalCharacteristic, lastMeasuredCharacteristic, latestValuesCharacteristic);

        if (readIntervalCharacteristic && lastMeasuredCharacteristic && latestValuesCharacteristic) {

            readIntervalCharacteristic.readValue().then(value => {

                const readInterval = value.getUint16(0, true);
                console.log('readInterval', readInterval);

                lastMeasuredCharacteristic.readValue().then(value => {

                    const lastMeasured = value.getUint16(0, true);
                    console.log('lastMeasured', lastMeasured);

                    const readCo2 = () => {
                        latestValuesCharacteristic?.readValue().then(value => {
                            setConnectionState('connected');
                            setCo2(value.getUint16(0, true));
                            // temperature: value.getUint16(2, true) / 20,
                            // pressure: value.getUint16(4, true) / 10,
                            // humidity: value.getUint8(6),
                            // battery: value.getUint8(7),
                        }).catch((e: any) => {
                            setConnectionState('failed reading value');
                            console.error(e);
                        });
                    }

                    readCo2(); // immediate display
                    window.setTimeout(() => {
                        readCo2(); // second display (aimed to hit the device's refresh cycle)
                        intervalHandle.current = window.setInterval(() => {
                            readCo2(); // third to nth display (in sync with the device's refresh cycle)
                        }, readInterval * 1000);
                    }, (readInterval + 1 - lastMeasured) * 1000);

                }).catch((e: any) => {
                    setConnectionState('failed retrieving last measurement time');
                    console.error(e);
                });

            }).catch((e: any) => {
                setConnectionState('failed retrieving interval');
                console.error(e);
            });

        }

    }, [readIntervalCharacteristic, lastMeasuredCharacteristic, latestValuesCharacteristic]);

    const handleDisconnectButtonClick = () => {
        gatt?.disconnect();
        window.clearInterval(intervalHandle.current);
        handleDisconnect(device);
    }

    useEffect(() => {
        console.debug('⚙ updating AranetComponent (co2)', co2);
        let _color = '#ffffff';
        if (co2) {
            if (co2 >= 1000) {
                _color = '#ff9999';
            } else if (co2 >= 800) {
                _color = '#ffff99';
            } else {
                _color = '#99ff99';
            }
        }
        setColor(_color);
    }, [co2]);

    return (
        <Card sx={{ height: '100%', backgroundColor: color }}>
            <Stack sx={{ height: '100%' }} direction="column" justifyContent={'center'} textAlign="center">
                <Typography sx={{ fontSize: '10vw' }}>{co2}</Typography>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Typography variant='caption' sx={{ display: 'flex', alignItems: 'center', textAlign: 'center' }}>{device.name} - {connectionState}&nbsp;<BluetoothDisabledIcon sx={{ cursor: 'pointer' }} onMouseUp={handleDisconnectButtonClick} /></Typography>
                </div>
            </Stack>
        </Card>
    );
}

export default AranetComponent;

import { useEffect, useRef, useState } from 'react';
import { Color } from '../util/Color';
import { InterpolatedValue } from '../util/InterpolatedValue';
import { AranetUtil } from './AranetUtil';
import { IAranetField } from './IAranetField';
import { IAranetProps } from './IAranetProps';
import { SENSOR_SERVICE_UUID } from './PickerComponent';

export const CHARACTERISTIC_LATEST_VALUES = 'f0cd3001-95da-4f4b-9ac8-aa55d312af0c';
export const CHARACTERISTIC_READ_INTERVAL = 'f0cd2002-95da-4f4b-9ac8-aa55d312af0c';
export const CHARACTERISTIC_LAST_MEASURED = 'f0cd2004-95da-4f4b-9ac8-aa55d312af0c';

export const CHARACTERISTIC_STORED_VALUES = 'f0cd2001-95da-4f4b-9ac8-aa55d312af0c';
export const CHARACTERISTIC_WRITE_COMMAND = 'f0cd1402-95da-4f4b-9ac8-aa55d312af0c';
export const CHARACTERISTIC_HISTORIC_DATA = 'f0cd2005-95da-4f4b-9ac8-aa55d312af0c';

const HEADER_SIZE = 10;
const FIELDS: { [K in string]: IAranetField } = {
    FIELD_TEMPERATURE: {
        label: "Temperature (°C)",
        field: 0x01,
        parse: (view: DataView, index: number) => view.getUint16(HEADER_SIZE + index * 2, true),
        scale: (parsed: number) => parsed / 20
    },
    FIELD____HUMIDITY: {
        label: "Humidity (%RH)",
        field: 0x02,
        parse: (view: DataView, index: number) => view.getUint8(HEADER_SIZE + index),
        scale: (parsed: number) => parsed
    },
    FIELD____PRESSURE: {
        label: "Pressure (PA)",
        field: 0x03,
        parse: (view: DataView, index: number) => view.getUint16(HEADER_SIZE + index * 2, true),
        scale: (parsed: number) => parsed
    },
    FIELD_________CO2: {
        label: "CO2 (ppm)",
        field: 0x04,
        parse: (view: DataView, index: number) => view.getUint16(HEADER_SIZE + index * 2, true),
        scale: (parsed: number) => parsed
    }
}
const INTERPOLATION_HUE = new InterpolatedValue(0.3, 0.0, 800, 1000, 1.00);
const INTERPOLATION_SAT = new InterpolatedValue(0.90, 1.00, 1000, 1200, 1.00);
const HISTORY_COUNT = 90;

function AranetComponent(props: IAranetProps) {

    const { device, handleDeviceRemove } = props;
    const [connectionState, setConnectionState] = useState<string>('connecting');
    const [gatt, setGatt] = useState<BluetoothRemoteGATTServer>();

    const [latestValuesCharacteristic, setLatestValuesCharacteristic] = useState<BluetoothRemoteGATTCharacteristic>();
    const [updateRepeatCharacteristic, setReadIntervalCharacteristic] = useState<BluetoothRemoteGATTCharacteristic>();
    const [updateOffsetCharacteristic, setLastMeasuredCharacteristic] = useState<BluetoothRemoteGATTCharacteristic>();

    const [writeCommandCharacteristic, setWriteCommandCharacteristic] = useState<BluetoothRemoteGATTCharacteristic>();
    const [historicDataCharacteristic, setHistoricDataCharacteristic] = useState<BluetoothRemoteGATTCharacteristic>();

    const [colors, setColors] = useState<string[]>(new Array(HISTORY_COUNT));
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

            console.debug('service', service);
            service.getCharacteristics().then(charateristics => {

                console.debug('charateristics', charateristics);

                const latestValuesCharacteristic = charateristics.filter(charateristic => charateristic.uuid === CHARACTERISTIC_LATEST_VALUES)[0];
                setLatestValuesCharacteristic(latestValuesCharacteristic);

                const readIntervalCharacteristic = charateristics.filter(charateristic => charateristic.uuid === CHARACTERISTIC_READ_INTERVAL)[0];
                setReadIntervalCharacteristic(readIntervalCharacteristic);

                const lastMeasuredCharacteristic = charateristics.filter(charateristic => charateristic.uuid === CHARACTERISTIC_LAST_MEASURED)[0];
                setLastMeasuredCharacteristic(lastMeasuredCharacteristic);

                const historicDataCharacteristic = charateristics.filter(charateristic => charateristic.uuid === CHARACTERISTIC_HISTORIC_DATA)[0];
                setHistoricDataCharacteristic(historicDataCharacteristic);

                const writeCommandCharacteristic = charateristics.filter(charateristic => charateristic.uuid === CHARACTERISTIC_WRITE_COMMAND)[0];
                setWriteCommandCharacteristic(writeCommandCharacteristic);

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

        console.debug('⚙ updating AranetComponent (characteristics)',
            updateRepeatCharacteristic,
            updateOffsetCharacteristic,
            latestValuesCharacteristic,
            historicDataCharacteristic,
            writeCommandCharacteristic
        );

        if (
            updateRepeatCharacteristic &&
            updateOffsetCharacteristic &&
            latestValuesCharacteristic &&
            historicDataCharacteristic &&
            writeCommandCharacteristic
        ) {

            updateRepeatCharacteristic.readValue().then(value => {

                const readInterval = value.getUint16(0, true);
                console.debug('readInterval', readInterval);

                updateOffsetCharacteristic.readValue().then(value => {

                    const updateOffset = value.getUint16(0, true);
                    const readCo2 = () => {
                        // latestValuesCharacteristic?.readValue().then(value => {
                        //     setConnectionState('connected');
                        //     setCo2(FIELDS.FIELD_________CO2.scale(value.getUint16(0, true)));
                        //     // temperature: value.getUint16(2, true) / 20,
                        //     // pressure: value.getUint16(4, true) / 10,
                        //     // humidity: value.getUint8(6),
                        //     // battery: value.getUint8(7),
                        // }).catch((e: any) => {
                        //     setConnectionState('failed reading value');
                        //     console.error(e);
                        // });
                        writeCommandCharacteristic?.writeValue(command).then(() => {
                            historicDataCharacteristic?.readValue().then(value2 => {
                                const _colors: string[] = [];
                                const header = AranetUtil.parseHeader(value2);
                                for (let i = 0; i < header.recordCount; i++) {
                                    const co2 = field.scale(field.parse(value2, i));
                                    const hue = INTERPOLATION_HUE.getOut(co2);
                                    const sat = INTERPOLATION_SAT.getOut(co2);
                                    const color = new Color(hue, sat, sat);
                                    _colors.push(color.getHex());
                                }
                                console.log('colors', colors);
                                setColors(_colors);
                            });
                        });
                    }

                    const field = FIELDS.FIELD_________CO2;
                    const command = AranetUtil.createCommand(field, 5040 - HISTORY_COUNT, 0xFFFF);


                    readCo2(); // immediate display
                    window.setTimeout(() => {
                        readCo2(); // second display (aimed to hit the device's refresh cycle)
                        intervalHandle.current = window.setInterval(() => {
                            readCo2(); // third to nth display (in sync with the device's refresh cycle)
                        }, readInterval * 1000);
                    }, (readInterval + 1 - updateOffset) * 1000);

                }).catch((e: any) => {
                    setConnectionState('failed retrieving last measurement time');
                    console.error(e);
                });

            }).catch((e: any) => {
                setConnectionState('failed retrieving interval');
                console.error(e);
            });

        }

    }, [
        updateRepeatCharacteristic,
        updateOffsetCharacteristic,
        latestValuesCharacteristic,
        historicDataCharacteristic,
        writeCommandCharacteristic
    ]);

    const handleDisconnectButtonClick = () => {
        gatt?.disconnect();
        window.clearInterval(intervalHandle.current); // no more reads on a disconnected device, errors otherwise
        handleDeviceRemove(device);
    }

    useEffect(() => {
        console.debug('⚙ updating AranetComponent (colors)', colors);
    }, [colors]);

    return (
        <div style={{ display: 'flex', flexDirection: 'row', flexGrow: '4' }}>
            {/* <Card sx={{ position: 'absolute', height: '100%', backgroundColor: '#cccccc', padding: '0px' }}>
                <Stack sx={{ height: '100%' }} direction="column" justifyContent={'center'} textAlign="center">
                    <Typography sx={{ fontSize: '10vw' }}>{co2}</Typography>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <Typography variant='caption' sx={{ display: 'flex', alignItems: 'center', textAlign: 'center' }}>{device.name} - {connectionState}&nbsp;<BluetoothDisabledIcon sx={{ cursor: 'pointer' }} onMouseUp={handleDisconnectButtonClick} /></Typography>
                    </div>
                </Stack>
            </Card> */}
            {colors.map(c => {
                return <div style={{ backgroundColor: c, height: 'inherit', flexGrow: '1', margin: '1px', transition: 'background-color 1000ms linear' }}></div>
            })}

        </div>
    );
}

export default AranetComponent;
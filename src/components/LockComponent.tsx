
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { Button } from '@mui/material';
import { useEffect, useState, useRef } from 'react';

function LockComponent() {

    const [locked, setLocked] = useState<any>();
    const lockRef = useRef<any>()

    const requestScreenLock = () => {
        if (locked) {
            clearScreenLock();
            if (document.fullscreenElement) {
                document.exitFullscreen();
            }
        } else {
            applyScreenLock();
            document.body.requestFullscreen();
        }
    };

    const clearScreenLock = () => {
        if (lockRef.current) {
            locked?.release();
            setLocked(null);
        }
    }

    const applyScreenLock = () => {
        // @ts-ignore
        const wakeLock = navigator.wakeLock;
        wakeLock.request('screen').then((locked: any) => {
            setLocked(locked);
        });
    }

    useEffect(() => {

        console.debug('✨ building LockComponent');
        window.onresize = function (event) {

            const maxHeight = window.screen.height;
            const maxWidth = window.screen.width;
            const curHeight = window.innerHeight;
            const curWidth = window.innerWidth;

            if (maxWidth === curWidth && maxHeight === curHeight) {
                applyScreenLock();
            } else {
                clearScreenLock();
            }

        }


    }, []);

    useEffect(() => {
        console.debug('⚙ updating LockComponent');
        lockRef.current = locked;
    }, [locked]);

    return (
        <Button size='small' variant="outlined" endIcon={locked ? <LockIcon /> : <LockOpenIcon />} onClick={requestScreenLock}>
            fullscreen
        </Button>
    );

}

export default LockComponent;
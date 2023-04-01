import { Collapse, createTheme, CssBaseline, ThemeProvider } from '@mui/material';
import Typography from '@mui/material/Typography';
import { useEffect, useRef, useState } from 'react';
import './App.css';
import AranetComponent from './components/AranetComponent';
import { IAranetProps } from './components/IAranetProps';
import LockComponent from './components/LockComponent';
import PickerComponent from './components/PickerComponent';

const appTheme = createTheme({
  palette: {
    mode: 'dark',
  },
  typography: {
    fontFamily: [
      'SimplyMono-Bold',
    ].join(','),
    button: {
      textTransform: 'none'
    }
  },
  components: {
    MuiStack: {
      defaultProps: {
        spacing: 2
      }
    },
    MuiCard: {
      defaultProps: {
        elevation: 3
      },
      styleOverrides: {
        root: {
          margin: '6px',
          padding: '12px'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          margin: '6px'
        }
      }
    }
  }
});

function App() {

  const [buttonVisible, setButtonVisible] = useState<boolean>(true);
  const [aranetProps, setAranetProps] = useState<IAranetProps[]>([]);
  const handleDeviceRemove = (device: BluetoothDevice) => {
    setAranetProps([
      ...aranetProps.filter(props => props.device.id !== device.id)
    ]);
  };

  const handleDevicePicked = (device: BluetoothDevice) => {
    const hasDevice = aranetProps.find(props => props.device.id === device.id);
    if (!hasDevice) {
      setAranetProps([
        ...aranetProps,
        {
          device,
          handleDeviceRemove
        }
      ]);
      setButtonVisible(false);
    } else {
      // TODO :: show some message
    }
  };

  const timeoutHandle = useRef<number>(-1);
  useEffect(() => {
    document.addEventListener('mousemove', () => {
      setButtonVisible(true);
      window.clearTimeout(timeoutHandle.current);
      timeoutHandle.current = window.setTimeout(() => {
        setButtonVisible(false);
      }, 5000);
    })
  }, []);

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Collapse in={buttonVisible} timeout="auto">
          <Typography variant="h5" component="h5" sx={{ paddingLeft: '10px' }}>
            <PickerComponent {...{ handleDevicePicked }} /><LockComponent />
          </Typography>
        </Collapse>
        {
          aranetProps.map(device => <AranetComponent key={device.device.id} {...device} />)
        }
      </div>

    </ThemeProvider>
  );

}

export default App;

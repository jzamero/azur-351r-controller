# Azur 351R Controller for Raspberry Pi

A complete web-based controller for the Cambridge Audio Azur 351R receiver, using RS232 serial communication protocol. This project consists of a Python Flask backend and a React.js frontend.

## Features

- Power control (on/standby)
- Volume control and muting
- Input source selection
- Audio processing mode selection (stereo, surround modes)
- Bass and treble adjustment
- MQTT integration for home automation
- Command history tracking
- Web-based remote control interface
- Configuration options for serial port and MQTT

## Hardware Requirements

- Raspberry Pi (any model with network capabilities)
- USB to Serial adapter (if your Pi doesn't have a built-in serial port)
- Cambridge Audio Azur 351R receiver
- RS232 cable to connect the receiver to the Raspberry Pi

## Installation

### 1. Clone this repository

```bash
git clone https://github.com/jzamero/azur-351r-controller.git
cd azur-351r-controller
```

### 2. Install backend dependencies

```bash
# Create and activate a virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install required packages
pip install -r requirements.txt
```

### 3. Install frontend dependencies

```bash
cd frontend
npm install
npm run build
cd ..
```

### 4. Configure Serial Port

By default, the application uses `/dev/ttyUSB0` for the serial connection. You can change this in the web interface after starting the application.

### 5. Setup as a Service (Optional)

Create a systemd service file to run the application automatically at startup:

```bash
sudo nano /etc/systemd/system/azur-controller.service
```

Add the following content (adjust paths as needed):

```
[Unit]
Description=Azur 351R Controller
After=network.target

[Service]
User=pi
WorkingDirectory=/home/pi/azur-351r-controller
ExecStart=/home/pi/azur-351r-controller/venv/bin/python app.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl enable azur-controller.service
sudo systemctl start azur-controller.service
```

## Running the Application

### Manual Start

```bash
# From the project root directory
python app.py
```

The application will be available at `http://your-raspberry-pi-ip:5000`

## MQTT Control

If MQTT is enabled in the settings, you can control the receiver by publishing commands to the configured MQTT topic (default: `azur/commands`).

See the [MQTT Command Examples](mqtt_examples.md) file for details on the command format.

## Serial Port Configuration

If you're having trouble with the serial connection:

1. Make sure your user has access to the serial device:
   ```bash
   sudo usermod -a -G dialout $USER
   # Log out and back in for changes to take effect
   ```

2. Check the connection with:
   ```bash
   dmesg | grep tty
   # This should show your USB-serial adapter
   ```

3. Test the serial port with:
   ```bash
   sudo apt-get install minicom  # If not installed
   minicom -D /dev/ttyUSB0 -b 9600
   ```

## Troubleshooting

### Serial Connection Issues

- Verify the USB to serial adapter is recognized: `lsusb`
- Check if the serial device exists: `ls -l /dev/ttyUSB*`
- Test the serial port with another program like minicom
- Ensure baud rate is set to 9600 as required by the Azur 351R

### Application Not Starting

- Check the logs: `sudo journalctl -u azur-controller.service -f`
- Verify Python dependencies are installed
- Make sure the serial port is correctly configured

### Web Interface Not Loading

- Check that the Flask backend is running: `ps aux | grep python`
- Verify you can access the Raspberry Pi on the network
- Check for any firewalls blocking port 5000

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Cambridge Audio for the Azur 351R RS232 protocol documentation
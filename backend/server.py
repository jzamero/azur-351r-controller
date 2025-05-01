import serial
import time
import json
import logging
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import threading
import paho.mqtt.client as mqtt
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.FileHandler("azur_controller.log"), logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder='../frontend/build')
CORS(app)

# Configuration
CONFIG_FILE = 'config.json'
DEFAULT_CONFIG = {
    'serial_port': '/dev/ttyUSB0',
    'baud_rate': 9600,
    'mqtt_enabled': False,
    'mqtt_broker': 'localhost',
    'mqtt_port': 1883,
    'mqtt_topic_sub': 'azur/commands',
    'mqtt_topic_pub': 'azur/status',
    'mqtt_username': '',
    'mqtt_password': ''
}

# Global variables
serial_conn = None
receiver_status = {
    'power': 'unknown',
    'input': 'unknown',
    'volume': 'unknown',
    'mute': 'unknown',
    'surround_mode': 'unknown',
    'last_command': None,
    'last_response': None
}
mqtt_client = None
command_queue = []
response_handlers = {}
config = {}

def load_config():
    """Load configuration from file or create with defaults"""
    global config
    try:
        if os.path.exists(CONFIG_FILE):
            with open(CONFIG_FILE, 'r') as f:
                config = json.load(f)
                # Add any missing keys from default config
                for key, value in DEFAULT_CONFIG.items():
                    if key not in config:
                        config[key] = value
        else:
            config = DEFAULT_CONFIG.copy()
            save_config()
    except Exception as e:
        logger.error(f"Error loading config: {e}")
        config = DEFAULT_CONFIG.copy()

def save_config():
    """Save current configuration to file"""
    try:
        with open(CONFIG_FILE, 'w') as f:
            json.dump(config, f, indent=4)
    except Exception as e:
        logger.error(f"Error saving config: {e}")

def connect_serial():
    """Connect to the serial port"""
    global serial_conn
    try:
        serial_conn = serial.Serial(
            port=config['serial_port'],
            baudrate=config['baud_rate'],
            bytesize=serial.EIGHTBITS,
            parity=serial.PARITY_NONE,
            stopbits=serial.STOPBITS_ONE,
            timeout=1
        )
        logger.info(f"Connected to {config['serial_port']}")
        return True
    except Exception as e:
        logger.error(f"Serial connection error: {e}")
        serial_conn = None
        return False

def send_command(group, command, data=None):
    """Send a command to the Azur 351R"""
    global receiver_status
    
    if serial_conn is None or not serial_conn.is_open:
        if not connect_serial():
            return {'error': 'Serial connection not available'}
    
    try:
        if data is not None:
            cmd = f"#{group},{command},{data}\r"
        else:
            cmd = f"#{group},{command}\r"
        
        logger.info(f"Sending command: {cmd.strip()}")
        
        serial_conn.write(cmd.encode())
        receiver_status['last_command'] = cmd.strip()
        
        # Wait for response
        time.sleep(0.1)
        response = read_response()
        
        receiver_status['last_response'] = response
        
        # Update receiver status based on response
        update_receiver_status(response)
        
        return {
            'command': cmd.strip(),
            'response': response,
            'status': receiver_status
        }
    except Exception as e:
        logger.error(f"Error sending command: {e}")
        return {'error': f'Failed to send command: {str(e)}'}

def read_response():
    """Read response from the serial connection"""
    if serial_conn is None or not serial_conn.is_open:
        return None
    
    try:
        # Wait for data to be available
        time.sleep(0.2)
        
        if serial_conn.in_waiting > 0:
            response = serial_conn.read(serial_conn.in_waiting).decode().strip()
            logger.info(f"Received response: {response}")
            return response
        else:
            logger.warning("No response received")
            return None
    except Exception as e:
        logger.error(f"Error reading response: {e}")
        return None

def update_receiver_status(response):
    """Update the receiver status based on response"""
    global receiver_status
    
    if response is None:
        return
    
    try:
        # Parse response format #group,command,data
        parts = response.split(',')
        if len(parts) < 2:
            return
        
        group = parts[0].replace('#', '')
        command = parts[1]
        data = parts[2] if len(parts) > 2 else None
        
        # Power state
        if group == '6' and command == '01':
            receiver_status['power'] = 'on' if data == '1' else 'standby'
        
        # Volume
        elif group == '6' and (command == '02' or command == '03'):
            receiver_status['volume'] = data
        
        # Mute state
        elif group == '6' and command == '11':
            receiver_status['mute'] = 'on' if data == '1' else 'off'
        
        # Input select
        elif group == '7' and command == '01':
            input_map = {
                '01': 'BD/DVD', 
                '02': 'CD/Video 1', 
                '03': 'Video 2', 
                '04': 'AUX', 
                '06': 'Tuner', 
                '09': 'TV ARC'
            }
            receiver_status['input'] = input_map.get(data, 'unknown')
        
        # Surround mode
        elif group == '9' and (command == '03' or command == '05'):
            receiver_status['surround_mode'] = data if data else 'unknown'
        
    except Exception as e:
        logger.error(f"Error updating receiver status: {e}")

def process_command_queue():
    """Process the command queue in a separate thread"""
    global command_queue
    
    while True:
        if command_queue:
            cmd = command_queue.pop(0)
            try:
                result = send_command(cmd['group'], cmd['command'], cmd['data'])
                
                # If there's a callback for this command, execute it
                cmd_id = f"{cmd['group']}_{cmd['command']}"
                if cmd_id in response_handlers:
                    handler = response_handlers.pop(cmd_id)
                    handler(result)
                
                # Publish to MQTT if enabled
                if config['mqtt_enabled'] and mqtt_client:
                    mqtt_client.publish(config['mqtt_topic_pub'], json.dumps(receiver_status))
            except Exception as e:
                logger.error(f"Error processing command: {e}")
        
        time.sleep(0.1)

def setup_mqtt():
    """Setup MQTT client if enabled in config"""
    global mqtt_client
    
    if not config['mqtt_enabled']:
        return
    
    try:
        client_id = f'azur-controller-{time.time()}'
        mqtt_client = mqtt.Client(client_id)
        
        # Set username and password if provided
        if config['mqtt_username'] and config['mqtt_password']:
            mqtt_client.username_pw_set(config['mqtt_username'], config['mqtt_password'])
        
        # Set up callbacks
        mqtt_client.on_connect = on_mqtt_connect
        mqtt_client.on_message = on_mqtt_message
        
        # Connect to broker
        mqtt_client.connect(config['mqtt_broker'], config['mqtt_port'], 60)
        
        # Start the loop in a separate thread
        mqtt_client.loop_start()
        
        logger.info(f"Connected to MQTT broker at {config['mqtt_broker']}:{config['mqtt_port']}")
    except Exception as e:
        logger.error(f"MQTT setup error: {e}")
        mqtt_client = None

def on_mqtt_connect(client, userdata, flags, rc):
    """Callback when connected to MQTT broker"""
    logger.info(f"MQTT connected with result code {rc}")
    client.subscribe(config['mqtt_topic_sub'])

def on_mqtt_message(client, userdata, msg):
    """Callback when receiving MQTT message"""
    try:
        payload = json.loads(msg.payload.decode())
        logger.info(f"MQTT message received: {payload}")
        
        if 'group' in payload and 'command' in payload:
            data = payload.get('data', None)
            command_queue.append({
                'group': payload['group'],
                'command': payload['command'],
                'data': data
            })
    except Exception as e:
        logger.error(f"Error processing MQTT message: {e}")

def query_receiver_status():
    """Query the receiver to update status"""
    # Query power state
    command_queue.append({'group': '1', 'command': '01', 'data': None})
    
    # Only if power is on, query other status
    if receiver_status['power'] == 'on':
        # Query volume
        command_queue.append({'group': '1', 'command': '02', 'data': None})
        # Query mute state
        command_queue.append({'group': '1', 'command': '11', 'data': None})
        # Query input source
        command_queue.append({'group': '2', 'command': '01', 'data': None})
        # Query surround mode
        command_queue.append({'group': '4', 'command': '05', 'data': None})

# API Routes
@app.route('/api/command', methods=['POST'])
def api_command():
    """API endpoint to send a command to the receiver"""
    try:
        data = request.json
        group = data.get('group')
        command = data.get('command')
        command_data = data.get('data')
        
        if not group or not command:
            return jsonify({'error': 'Missing required parameters'}), 400
        
        result = send_command(group, command, command_data)
        return jsonify(result)
    except Exception as e:
        logger.error(f"API error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/status', methods=['GET'])
def api_status():
    """API endpoint to get current receiver status"""
    return jsonify(receiver_status)

@app.route('/api/config', methods=['GET'])
def api_get_config():
    """API endpoint to get current configuration"""
    return jsonify(config)

@app.route('/api/config', methods=['POST'])
def api_set_config():
    """API endpoint to update configuration"""
    global config
    
    try:
        new_config = request.json
        for key in new_config:
            if key in config:
                config[key] = new_config[key]
        
        save_config()
        
        # Reconfigure if needed
        if new_config.get('mqtt_enabled') != config.get('mqtt_enabled', False):
            if config['mqtt_enabled']:
                setup_mqtt()
            elif mqtt_client:
                mqtt_client.loop_stop()
        
        return jsonify({'success': True, 'config': config})
    except Exception as e:
        logger.error(f"Config update error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/refresh', methods=['POST'])
def api_refresh():
    """API endpoint to refresh receiver status"""
    query_receiver_status()
    return jsonify({'success': True})

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    """Serve the frontend React app"""
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

def initialize():
    """Initialize the application"""
    # Load configuration
    load_config()
    
    # Try to connect to serial port
    connect_serial()
    
    # Setup MQTT if enabled
    if config['mqtt_enabled']:
        setup_mqtt()
    
    # Start command processing thread
    command_thread = threading.Thread(target=process_command_queue, daemon=True)
    command_thread.start()
    
    # Get initial receiver status
    query_receiver_status()

if __name__ == '__main__':
    initialize()
    app.run(host='0.0.0.0', port=5000, debug=True)

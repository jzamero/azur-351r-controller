import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import RemoteControl from './components/RemoteControl';
import StatusDisplay from './components/StatusDisplay';
import ConfigPanel from './components/ConfigPanel';
import CommandHistory from './components/CommandHistory';

function App() {
  const [status, setStatus] = useState({
    power: 'unknown',
    input: 'unknown',
    volume: 'unknown',
    mute: 'unknown',
    surround_mode: 'unknown',
    last_command: null,
    last_response: null
  });
  const [config, setConfig] = useState({
    serial_port: '/dev/ttyUSB0',
    baud_rate: 9600,
    mqtt_enabled: false,
    mqtt_broker: 'localhost',
    mqtt_port: 1883,
    mqtt_topic_sub: 'azur/commands',
    mqtt_topic_pub: 'azur/status',
    mqtt_username: '',
    mqtt_password: ''
  });
  const [showConfig, setShowConfig] = useState(false);
  const [history, setHistory] = useState([]);

  // Fetch initial status and config
  useEffect(() => {
    fetchStatus();
    fetchConfig();
    
    // Set up polling for status updates
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await axios.get('/api/status');
      setStatus(response.data);
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  const fetchConfig = async () => {
    try {
      const response = await axios.get('/api/config');
      setConfig(response.data);
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  const handleCommand = async (group, command, data = null) => {
    try {
      const payload = { group, command };
      if (data !== null) {
        payload.data = data;
      }
      
      const response = await axios.post('/api/command', payload);
      
      if (response.data.error) {
        toast.error(`Command error: ${response.data.error}`);
      } else {
        setStatus(response.data.status);
        
        // Add to history
        const newHistoryItem = {
          timestamp: new Date().toLocaleTimeString(),
          command: response.data.command,
          response: response.data.response
        };
        setHistory(prevHistory => [newHistoryItem, ...prevHistory.slice(0, 9)]);
      }
    } catch (error) {
      toast.error(`Request failed: ${error.message}`);
    }
  };

  const handleRefresh = async () => {
    try {
      await axios.post('/api/refresh');
      toast.info('Refreshing receiver status...');
      setTimeout(fetchStatus, 1000);
    } catch (error) {
      toast.error(`Refresh failed: ${error.message}`);
    }
  };

  const saveConfig = async (newConfig) => {
    try {
      const response = await axios.post('/api/config', newConfig);
      if (response.data.success) {
        setConfig(response.data.config);
        toast.success('Configuration saved successfully');
      } else {
        toast.error('Failed to save configuration');
      }
    } catch (error) {
      toast.error(`Save failed: ${error.message}`);
    }
  };

  return (
    <div className="app">
      <ToastContainer position="top-center" />
      
      <header className="app-header">
        <h1>Azur 351R Controller</h1>
        <div className="header-buttons">
          <button onClick={handleRefresh} className="btn btn-outline">
            Refresh Status
          </button>
          <button 
            onClick={() => setShowConfig(!showConfig)} 
            className="btn btn-outline"
          >
            {showConfig ? 'Hide Config' : 'Show Config'}
          </button>
        </div>
      </header>
      
      <div className="app-content">
        <div className="main-panel">
          <StatusDisplay status={status} />
          <RemoteControl onCommand={handleCommand} status={status} />
        </div>
        
        <div className="side-panel">
          {showConfig ? (
            <ConfigPanel config={config} onSave={saveConfig} />
          ) : (
            <CommandHistory history={history} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
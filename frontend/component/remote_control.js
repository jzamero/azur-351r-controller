import React from 'react';
import { FaPowerOff, FaVolumeUp, FaVolumeDown, FaVolumeMute } from 'react-icons/fa';

const RemoteControl = ({ onCommand, status }) => {
  const handlePower = () => {
    const newPowerState = status.power === 'on' ? '0' : '1';
    onCommand('1', '01', newPowerState);
  };

  const handleVolumeUp = () => {
    onCommand('1', '02');
  };

  const handleVolumeDown = () => {
    onCommand('1', '03');
  };

  const handleMute = () => {
    const newMuteState = status.mute === 'on' ? '00' : '01';
    onCommand('1', '11', newMuteState);
  };

  const handleInputSelect = (inputCode) => {
    onCommand('2', '01', inputCode);
  };

  const handleBassUp = () => {
    onCommand('1', '04');
  };

  const handleBassDown = () => {
    onCommand('1', '05');
  };

  const handleTrebleUp = () => {
    onCommand('1', '06');
  };

  const handleTrebleDown = () => {
    onCommand('1', '07');
  };

  const handleSurroundMode = () => {
    onCommand('4', '03');
  };

  const handleStereoMode = () => {
    onCommand('4', '01', '01'); // Stereo + Subwoofer
  };

  const handleDirectMode = () => {
    onCommand('4', '06');
  };

  const renderInputButton = (label, code) => {
    const isActive = 
      (code === '01' && status.input === 'BD/DVD') ||
      (code === '02' && status.input === 'CD/Video 1') ||
      (code === '03' && status.input === 'Video 2') ||
      (code === '04' && status.input === 'AUX') ||
      (code === '06' && status.input === 'Tuner') ||
      (code === '09' && status.input === 'TV ARC');
      
    return (
      <button 
        className={`input-button ${isActive ? 'active-input' : ''}`}
        onClick={() => handleInputSelect(code)}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Remote Control</h2>
      </div>
      
      <div className="remote-control">
        <div className="control-section">
          <h3>Power</h3>
          <div 
            className={`power-button ${status.power !== 'on' ? 'power-standby' : ''}`}
            onClick={handlePower}
          >
            <FaPowerOff />
          </div>
          
          <h3>Volume</h3>
          <div className="volume-controls">
            <button className="volume-button" onClick={handleVolumeDown}>
              <FaVolumeDown />
            </button>
            <button className="volume-button" onClick={handleMute}>
              <FaVolumeMute />
            </button>
            <button className="volume-button" onClick={handleVolumeUp}>
              <FaVolumeUp />
            </button>
          </div>
        </div>
        
        <div className="control-section">
          <h3>Inputs</h3>
          <div className="button-grid">
            {renderInputButton('BD/DVD', '01')}
            {renderInputButton('CD/Video 1', '02')}
            {renderInputButton('Video 2', '03')}
            {renderInputButton('AUX', '04')}
            {renderInputButton('Tuner', '06')}
            {renderInputButton('TV ARC', '09')}
          </div>
        </div>
        
        <div className="control-section">
          <h3>Audio Controls</h3>
          <div className="button-grid">
            <button className="action-button" onClick={handleBassUp}>Bass +</button>
            <button className="action-button" onClick={handleBassDown}>Bass -</button>
            <button className="action-button" onClick={handleTrebleUp}>Treble +</button>
            <button className="action-button" onClick={handleTrebleDown}>Treble -</button>
            <button className="action-button" onClick={handleSurroundMode}>Surround</button>
            <button className="action-button" onClick={handleStereoMode}>Stereo</button>
            <button className="action-button" onClick={handleDirectMode}>Direct</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemoteControl;
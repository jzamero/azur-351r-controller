import React, { useState, useEffect } from 'react';

const ConfigPanel = ({ config, onSave }) => {
  const [formData, setFormData] = useState(config);
  
  useEffect(() => {
    setFormData(config);
  }, [config]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: parseInt(value, 10)
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };
  
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Configuration</h2>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="serial_port">Serial Port</label>
          <input
            type="text"
            id="serial_port"
            name="serial_port"
            className="form-control"
            value={formData.serial_port}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="baud_rate">Baud Rate</label>
          <input
            type="number"
            id="baud_rate"
            name="baud_rate"
            className="form-control"
            value={formData.baud_rate}
            onChange={handleNumberChange}
            required
          />
        </div>
        
        <div className="form-check">
          <input
            type="checkbox"
            id="mqtt_enabled"
            name="mqtt_enabled"
            checked={formData.mqtt_enabled}
            onChange={handleChange}
          />
          <label htmlFor="mqtt_enabled">Enable MQTT</label>
        </div>
        
        {formData.mqtt_enabled && (
          <>
            <div className="form-group">
              <label htmlFor="mqtt_broker">MQTT Broker</label>
              <input
                type="text"
                id="mqtt_broker"
                name="mqtt_broker"
                className="form-control"
                value={formData.mqtt_broker}
                onChange={handleChange}
                required={formData.mqtt_enabled}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="mqtt_port">MQTT Port</label>
              <input
                type="number"
                id="mqtt_port"
                name="mqtt_port"
                className="form-control"
                value={formData.mqtt_port}
                onChange={handleNumberChange}
                required={formData.mqtt_enabled}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="mqtt_topic_sub">MQTT Subscribe Topic</label>
              <input
                type="text"
                id="mqtt_topic_sub"
                name="mqtt_topic_sub"
                className="form-control"
                value={formData.mqtt_topic_sub}
                onChange={handleChange}
                required={formData.mqtt_enabled}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="mqtt_topic_pub">MQTT Publish Topic</label>
              <input
                type="text"
                id="mqtt_topic_pub"
                name="mqtt_topic_pub"
                className="form-control"
                value={formData.mqtt_topic_pub}
                onChange={handleChange}
                required={formData.mqtt_enabled}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="mqtt_username">MQTT Username (Optional)</label>
              <input
                type="text"
                id="mqtt_username"
                name="mqtt_username"
                className="form-control"
                value={formData.mqtt_username}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="mqtt_password">MQTT Password (Optional)</label>
              <input
                type="password"
                id="mqtt_password"
                name="mqtt_password"
                className="form-control"
                value={formData.mqtt_password}
                onChange={handleChange}
              />
            </div>
          </>
        )}
        
        <button type="submit" className="btn btn-primary">Save Configuration</button>
      </form>
    </div>
  );
};

export default ConfigPanel;
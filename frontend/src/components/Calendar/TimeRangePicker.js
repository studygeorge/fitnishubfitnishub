import React from 'react';

const TimeRangePicker = ({ startTime, endTime, onChange }) => {
  // Предустановленные временные интервалы
  const presetIntervals = [
    { label: "Утро (8:00-10:00)", start: "08:00", end: "10:00" },
    { label: "До обеда (10:00-12:00)", start: "10:00", end: "12:00" },
    { label: "Обед (12:00-14:00)", start: "12:00", end: "14:00" },
    { label: "После обеда (14:00-16:00)", start: "14:00", end: "16:00" },
    { label: "Вечер (16:00-20:00)", start: "16:00", end: "20:00" }
  ];
  
  // Генерация опций времени
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 6; hour < 23; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinute = minute.toString().padStart(2, '0');
        options.push(`${formattedHour}:${formattedMinute}`);
      }
    }
    return options;
  };
  
  const timeOptions = generateTimeOptions();
  
  // Обработчик изменения времени
  const handleTimeChange = (type, value) => {
    onChange({
      [type]: value
    });
  };
  
  // Применить предустановленный интервал
  const applyPresetInterval = (preset) => {
    onChange({
      startTime: preset.start,
      endTime: preset.end
    });
  };
  
  return (
    <div className="time-range-picker">
      <div className="time-range-inputs">
        <div className="time-input-group">
          <label>Время начала</label>
          <select 
            value={startTime} 
            onChange={(e) => handleTimeChange('startTime', e.target.value)}
          >
            {timeOptions.map(option => (
              <option key={`start-${option}`} value={option}>{option}</option>
            ))}
          </select>
        </div>
        
        <div className="time-separator">—</div>
        
        <div className="time-input-group">
          <label>Время окончания</label>
          <select 
            value={endTime} 
            onChange={(e) => handleTimeChange('endTime', e.target.value)}
          >
            {timeOptions.map(option => (
              <option 
                key={`end-${option}`} 
                value={option}
                disabled={option <= startTime}
              >
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="time-presets">
        <div className="presets-title">Быстрый выбор времени:</div>
        <div className="preset-buttons">
          {presetIntervals.map((preset, index) => (
            <button
              key={index}
              type="button"
              className="preset-button"
              onClick={() => applyPresetInterval(preset)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimeRangePicker;
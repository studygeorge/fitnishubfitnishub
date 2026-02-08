import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import './LogoEditorModal.css'; // Создадим отдельный CSS файл для этого компонента

const LogoEditorModal = ({ image, onSave, onCancel }) => {
  const [src, setSrc] = useState(null);
  const [crop, setCrop] = useState({ 
    unit: '%', 
    width: 80, 
    height: 80, 
    x: 10, 
    y: 10,
    aspect: 1 
  });
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const [error, setError] = useState(null);

  // Загрузка изображения при монтировании компонента
  useEffect(() => {
    if (!image) {
      setError('Изображение не предоставлено');
      return;
    }

    try {
      if (image instanceof File) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setSrc(e.target.result);
        };
        reader.onerror = () => {
          setError('Ошибка при чтении файла');
        };
        reader.readAsDataURL(image);
      } else if (typeof image === 'string') {
        setSrc(image);
      } else {
        setError('Неподдерживаемый формат изображения');
      }
    } catch (err) {
      setError(`Ошибка загрузки: ${err.message}`);
    }
  }, [image]);

  // Обновление preview при изменении кропа
  const updatePreview = useCallback(() => {
    if (!completedCrop || !imgRef.current || !previewCanvasRef.current) {
      return;
    }

    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    const crop = completedCrop;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = crop.width;
    canvas.height = crop.height;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Рисуем изображение
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    // Создаем круглую маску
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.arc(
      crop.width / 2,
      crop.height / 2,
      Math.min(crop.width, crop.height) / 2,
      0,
      2 * Math.PI
    );
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }, [completedCrop]);

  useEffect(() => {
    updatePreview();
  }, [updatePreview]);

  // Сохранить обрезанное изображение
  const handleSave = () => {
    if (!completedCrop || !previewCanvasRef.current) {
      // Если обрезка не завершена, сохраняем оригинал
      onSave(image);
      return;
    }

    previewCanvasRef.current.toBlob(
      (blob) => {
        if (!blob) {
          console.error('Canvas is empty');
          onSave(image); // Сохраняем оригинал в случае ошибки
          return;
        }
        
        const fileName = image instanceof File ? image.name : 'logo.jpg';
        const croppedFile = new File([blob], fileName, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });
        
        onSave(croppedFile);
      },
      'image/jpeg',
      0.95
    );
  };

  // Показываем ошибку, если не удалось загрузить изображение
  if (error) {
    return (
      <div className="logo-editor-modal-overlay">
        <div className="logo-editor-modal">
          <div className="logo-editor-header">
            <h3>Ошибка загрузки логотипа</h3>
            <button className="close-btn" onClick={onCancel}>×</button>
          </div>
          <div className="logo-editor-content error">
            <p>{error}</p>
            <p>Пожалуйста, попробуйте другое изображение</p>
          </div>
          <div className="logo-editor-footer">
            <button className="cancel-btn" onClick={onCancel}>Закрыть</button>
          </div>
        </div>
      </div>
    );
  }

  // Показываем загрузку, если изображение еще не готово
  if (!src) {
    return (
      <div className="logo-editor-modal-overlay">
        <div className="logo-editor-modal">
          <div className="logo-editor-header">
            <h3>Редактирование логотипа</h3>
            <button className="close-btn" onClick={onCancel}>×</button>
          </div>
          <div className="logo-editor-content loading">
            <div className="loading-spinner"></div>
            <p>Загрузка изображения...</p>
          </div>
          <div className="logo-editor-footer">
            <button className="cancel-btn" onClick={onCancel}>Отмена</button>
          </div>
        </div>
      </div>
    );
  }

  // Основной интерфейс редактирования
  return (
    <div className="logo-editor-modal-overlay">
      <div className="logo-editor-modal">
        <div className="logo-editor-header">
          <h3>Редактирование логотипа</h3>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>
        
        <div className="logo-editor-content">
          <div className="crop-container">
            <ReactCrop
              src={src}
              crop={crop}
              circularCrop
              onImageLoaded={(img) => {
                imgRef.current = img;
                return false; // Предотвращает автоматическую установку crop
              }}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
            />
            <p className="crop-instructions">
              Перемещайте и изменяйте размер круглой области для выбора логотипа
            </p>
          </div>
          
          <div className="preview-container">
            <h4>Предпросмотр</h4>
            <div className="logo-preview">
              <canvas
                ref={previewCanvasRef}
                className="preview-canvas"
              />
            </div>
            <p className="preview-note">
              Так будет выглядеть ваш логотип
            </p>
          </div>
        </div>
        
        <div className="logo-editor-footer">
          <button className="save-original-btn" onClick={() => onSave(image)}>
            Сохранить без изменений
          </button>
          <button className="cancel-btn" onClick={onCancel}>
            Отмена
          </button>
          <button 
            className="save-btn" 
            onClick={handleSave}
            disabled={!completedCrop?.width || !completedCrop?.height}
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoEditorModal;
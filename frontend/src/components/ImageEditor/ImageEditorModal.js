import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import './ImageEditorModal.css';

const ImageEditorModal = ({ 
  image, 
  onSave, 
  onCancel, 
  aspectRatio = undefined,
  circularCrop = false,
  title
}) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [crop, setCrop] = useState({
    unit: '%',
    width: 80,
    height: aspectRatio ? 80 / aspectRatio : 80,
    x: 10,
    y: 10
  });
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const [error, setError] = useState(null);

  // Загрузка изображения и создание URL
  useEffect(() => {
    try {
      if (image instanceof File) {
        console.log('Loading image from File:', image.name);
        const reader = new FileReader();
        reader.onload = (e) => {
          setImageUrl(e.target.result);
        };
        reader.onerror = (err) => {
          console.error('FileReader error:', err);
          setError('Не удалось загрузить изображение');
        };
        reader.readAsDataURL(image);
      } else if (typeof image === 'string') {
        console.log('Loading image from URL string');
        setImageUrl(image);
      } else {
        console.error('Unsupported image format');
        setError('Неподдерживаемый формат изображения');
      }
    } catch (err) {
      console.error('Error loading image:', err);
      setError(`Ошибка загрузки: ${err.message}`);
    }
    
    // Очистка URL при размонтировании
    return () => {
      if (imageUrl && imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [image]);

  // Функция для рисования предпросмотра обрезки
  const updatePreview = useCallback(() => {
    if (!completedCrop || !previewCanvasRef.current || !imgRef.current) {
      return;
    }

    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    const crop = completedCrop;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const ctx = canvas.getContext('2d');

    // Устанавливаем размеры canvas
    canvas.width = crop.width;
    canvas.height = crop.height;

    // Чистим canvas перед рисованием
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Рисуем изображение на canvas
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
    
    // Если нужен круглый кроп, создаем маску
    if (circularCrop) {
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
    }
  }, [completedCrop, circularCrop]);

  // Обновляем предпросмотр при изменении кропа
  useEffect(() => {
    updatePreview();
  }, [updatePreview]);

  // Функция для сохранения обработанного изображения
  const handleSave = () => {
    if (!completedCrop || !previewCanvasRef.current || !imgRef.current) {
      console.error("Не удалось получить данные для сохранения");
      // Если не удалось обрезать, сохраняем оригинал
      onSave(image);
      return;
    }

    try {
      const canvas = previewCanvasRef.current;
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.error('Canvas is empty or error generating blob');
            onSave(image); // Сохраняем оригинал если не удалось создать blob
            return;
          }
          
          // Создаем файл из blob
          const fileName = image instanceof File ? image.name : 'cropped-image.jpg';
          const croppedFile = new File([blob], fileName, { 
            type: 'image/jpeg',
            lastModified: Date.now() 
          });
          
          onSave(croppedFile);
        },
        'image/jpeg',
        0.95
      );
    } catch (err) {
      console.error('Error saving image:', err);
      // В случае ошибки сохраняем оригинал
      onSave(image);
    }
  };

  // Обработчик загрузки изображения для ReactCrop
  const onImageLoaded = (img) => {
    imgRef.current = img;
    return false; // Не нужно устанавливать crop при загрузке
  };

  // Если произошла ошибка
  if (error) {
    return (
      <div className="image-editor-modal-overlay">
        <div className="image-editor-modal">
          <div className="image-editor-header">
            <h3>Ошибка</h3>
            <button className="close-btn" onClick={onCancel}>×</button>
          </div>
          <div className="image-editor-content error">
            <p className="error-message">{error}</p>
            <p>Попробуйте выбрать другой файл или обратитесь к администратору.</p>
          </div>
          <div className="image-editor-footer">
            <button className="cancel-btn" onClick={onCancel}>Закрыть</button>
          </div>
        </div>
      </div>
    );
  }

  // Если изображение еще загружается
  if (!imageUrl) {
    return (
      <div className="image-editor-modal-overlay">
        <div className="image-editor-modal">
          <div className="image-editor-header">
            <h3>Загрузка</h3>
            <button className="close-btn" onClick={onCancel}>×</button>
          </div>
          <div className="image-editor-content loading">
            <div className="loading-spinner"></div>
            <p>Загрузка изображения...</p>
          </div>
          <div className="image-editor-footer">
            <button className="cancel-btn" onClick={onCancel}>Отмена</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="image-editor-modal-overlay">
      <div className="image-editor-modal">
        <div className="image-editor-header">
          <h3>{title || 'Редактирование изображения'}</h3>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>
        
        <div className="image-editor-content">
          <div className="crop-container">
            <ReactCrop
              src={imageUrl}
              onImageLoaded={onImageLoaded}
              crop={crop}
              onChange={(newCrop) => setCrop(newCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              circularCrop={circularCrop}
              aspect={aspectRatio}
            />
            <div className="crop-instructions">
              Перетащите или измените размер области выделения для обрезки изображения
            </div>
          </div>
          
          <div className="preview-container">
            <h4>Предпросмотр</h4>
            <div className={`preview ${circularCrop ? 'circular-preview' : ''}`}>
              <canvas
                ref={previewCanvasRef}
                style={{
                  width: completedCrop?.width ?? 0,
                  height: completedCrop?.height ?? 0,
                  maxWidth: '100%',
                  maxHeight: '250px',
                  objectFit: 'contain'
                }}
              />
            </div>
          </div>
        </div>
        
        <div className="image-editor-footer">
          <button 
            className="save-original-btn" 
            onClick={() => onSave(image)}
          >
            Сохранить без изменений
          </button>
          <button className="cancel-btn" onClick={onCancel}>Отмена</button>
          <button 
            className="save-btn" 
            onClick={handleSave}
            disabled={!completedCrop?.width || !completedCrop?.height}
          >
            Сохранить обрезанное
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageEditorModal;
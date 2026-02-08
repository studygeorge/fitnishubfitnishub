import React from 'react';
import ImageEditorModal from './ImageEditorModal';

const GalleryEditorModal = ({ image, onSave, onCancel }) => {
  return (
    <ImageEditorModal
      image={image}
      onSave={onSave}
      onCancel={onCancel}
      aspectRatio={4/3} // Стандартное соотношение 4:3 для галереи
      title="Редактирование фото для галереи"
    />
  );
};

export default GalleryEditorModal;
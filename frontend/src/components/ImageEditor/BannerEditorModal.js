import React from 'react';
import ImageEditorModal from './ImageEditorModal';

const BannerEditorModal = ({ image, onSave, onCancel }) => {
  return (
    <ImageEditorModal
      image={image}
      onSave={onSave}
      onCancel={onCancel}
      aspectRatio={4/1} // Соотношение 4:1 для шапки
      title="Редактирование шапки клуба"
    />
  );
};

export default BannerEditorModal;
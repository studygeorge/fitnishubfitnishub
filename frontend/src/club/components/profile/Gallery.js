import React, { useState } from 'react';

const Gallery = ({ club, onFileUpload, onDeleteImage, uploading }) => {
  const [activeSection, setActiveSection] = useState('logo');

  const sections = [
    { id: 'logo', label: 'Логотип' },
    { id: 'banner', label: 'Баннер' },
    { id: 'gallery', label: 'Галерея' }
  ];

  return (
    <div className="fitness-profile-gallery">
      <h2>Медиа файлы</h2>
      <p>Управление изображениями вашего клуба</p>

      <div className="fitness-gallery-navigation">
        {sections.map(section => (
          <button
            key={section.id}
            className={`fitness-gallery-nav-btn ${activeSection === section.id ? 'active' : ''}`}
            onClick={() => setActiveSection(section.id)}
            type="button"
          >
            {section.label}
          </button>
        ))}
      </div>

      <div className="fitness-gallery-content">
        {activeSection === 'logo' && (
          <LogoSection
            club={club}
            onFileUpload={onFileUpload}
            onDeleteImage={onDeleteImage}
            uploading={uploading}
          />
        )}

        {activeSection === 'banner' && (
          <BannerSection
            club={club}
            onFileUpload={onFileUpload}
            onDeleteImage={onDeleteImage}
            uploading={uploading}
          />
        )}

        {activeSection === 'gallery' && (
          <GallerySection
            club={club}
            onFileUpload={onFileUpload}
            onDeleteImage={onDeleteImage}
            uploading={uploading}
          />
        )}
      </div>
    </div>
  );
};

const LogoSection = ({ club, onFileUpload, onDeleteImage, uploading }) => (
  <div className="fitness-gallery-section">
    <h3>Логотип клуба</h3>
    <p>Квадратное изображение, рекомендуемый размер: 400x400px</p>
    
    <div className="fitness-media-upload">
      {club?.logo_url ? (
        <div className="fitness-media-preview">
          <img src={club.logo_url} alt="Логотип" />
          <div className="fitness-media-overlay">
            <button
              type="button"
              className="fitness-btn fitness-btn-danger"
              onClick={() => onDeleteImage('logo')}
              disabled={uploading}
            >
              Удалить
            </button>
          </div>
        </div>
      ) : (
        <div className="fitness-media-placeholder">
          <span className="fitness-placeholder-text">Нет логотипа</span>
        </div>
      )}
      
      <input
        type="file"
        id="logo-upload"
        accept="image/*"
        onChange={onFileUpload('logo')}
        style={{ display: 'none' }}
        disabled={uploading}
      />
      <label 
        htmlFor="logo-upload" 
        className={`fitness-btn fitness-btn-secondary ${uploading ? 'loading' : ''}`}
      >
        {uploading ? 'Загрузка...' : 'Изменить логотип'}
      </label>
    </div>

    <div className="fitness-media-guidelines">
      <h4>Рекомендации для логотипа:</h4>
      <ul>
        <li>Используйте квадратный формат (1:1)</li>
        <li>Минимальный размер: 200x200px</li>
        <li>Максимальный размер файла: 5MB</li>
        <li>Поддерживаемые форматы: JPEG, PNG, WebP</li>
        <li>Логотип должен быть четким и контрастным</li>
      </ul>
    </div>
  </div>
);

const BannerSection = ({ club, onFileUpload, onDeleteImage, uploading }) => (
  <div className="fitness-gallery-section">
    <h3>Баннер клуба</h3>
    <p>Горизонтальное изображение, рекомендуемый размер: 1200x400px</p>
    
    <div className="fitness-media-upload">
      {club?.banner_url ? (
        <div className="fitness-media-preview fitness-banner-preview">
          <img src={club.banner_url} alt="Баннер" />
          <div className="fitness-media-overlay">
            <button
              type="button"
              className="fitness-btn fitness-btn-danger"
              onClick={() => onDeleteImage('banner')}
              disabled={uploading}
            >
              Удалить
            </button>
          </div>
        </div>
      ) : (
        <div className="fitness-media-placeholder fitness-banner-placeholder">
          <span className="fitness-placeholder-text">Нет баннера</span>
        </div>
      )}
      
      <input
        type="file"
        id="banner-upload"
        accept="image/*"
        onChange={onFileUpload('banner')}
        style={{ display: 'none' }}
        disabled={uploading}
      />
      <label 
        htmlFor="banner-upload" 
        className={`fitness-btn fitness-btn-secondary ${uploading ? 'loading' : ''}`}
      >
        {uploading ? 'Загрузка...' : 'Изменить баннер'}
      </label>
    </div>

    <div className="fitness-media-guidelines">
      <h4>Рекомендации для баннера:</h4>
      <ul>
      <li>Используйте горизонтальный формат (3:1)</li>
        <li>Минимальный размер: 900x300px</li>
        <li>Максимальный размер файла: 5MB</li>
        <li>Поддерживаемые форматы: JPEG, PNG, WebP</li>
        <li>Избегайте мелкого текста на изображении</li>
      </ul>
    </div>
  </div>
);

const GallerySection = ({ club, onFileUpload, onDeleteImage, uploading }) => (
  <div className="fitness-gallery-section">
    <h3>Галерея фотографий</h3>
    <p>Покажите интерьер, оборудование и атмосферу вашего клуба</p>
    
    <div className="fitness-gallery-upload">
      <input
        type="file"
        id="gallery-upload"
        accept="image/*"
        onChange={onFileUpload('gallery')}
        style={{ display: 'none' }}
        disabled={uploading}
      />
      <label 
        htmlFor="gallery-upload" 
        className={`fitness-upload-area ${uploading ? 'loading' : ''}`}
      >
        <span className="fitness-upload-text">
          {uploading ? 'Загрузка...' : 'Добавить фото в галерею'}
        </span>
      </label>
    </div>

    {club?.images && club.images.length > 0 ? (
      <div className="fitness-gallery-grid">
        {club.images.map((imageUrl, index) => (
          <div key={index} className="fitness-gallery-item">
            <img src={imageUrl} alt={`Фото ${index + 1}`} />
            <div className="fitness-gallery-overlay">
              <button
                type="button"
                className="fitness-btn fitness-btn-danger fitness-btn-sm"
                onClick={() => onDeleteImage('gallery', index)}
                disabled={uploading}
              >
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="fitness-empty-gallery">
        <h4>Галерея пуста</h4>
        <p>Добавьте фотографии клуба для привлечения клиентов</p>
      </div>
    )}

    <div className="fitness-media-guidelines">
      <h4>Рекомендации для галереи:</h4>
      <ul>
        <li>Минимальный размер: 800x600px</li>
        <li>Максимальный размер файла: 5MB на фото</li>
        <li>Поддерживаемые форматы: JPEG, PNG, WebP</li>
        <li>Рекомендуем добавить 5-10 качественных фотографий</li>
        <li>Показывайте разные зоны клуба</li>
      </ul>
    </div>
  </div>
);

export default Gallery;
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import EditUserModal from '../components/admin/EditUserModal';
import EditClubModal from '../components/admin/EditClubModal';
import './AdminDashboardPage.css';

const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState('clubs');
  const [clubs, setClubs] = useState([]);
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, clubId: null, clubName: '' });
  const [editUserModal, setEditUserModal] = useState({ show: false, user: null });
  const [editClubModal, setEditClubModal] = useState({ show: false, club: null });
  const [owners, setOwners] = useState([]);
  const [userForm, setUserForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    balance: '',
    new_password: ''
  });
  const [clubForm, setClubForm] = useState({
    name: '',
    address: '',
    category: '',
    description: '',
    contact_phone: '',
    contact_email: '',
    website: '',
    owner_id: ''
  });
  
  const navigate = useNavigate();
  
  useEffect(() => {
    // Проверяем авторизацию администратора
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    const adminToken = localStorage.getItem('adminToken');
    
    if (!isAdmin || !adminToken) {
      navigate('/admin/login');
      return;
    }
    
    // Загружаем данные в зависимости от активной вкладки
    const loadData = async () => {
      setLoading(true);
      setError('');
      
      try {
        if (activeTab === 'clubs') {
          const clubsData = await api.admin.getAllClubs();
          setClubs(clubsData);
        } else if (activeTab === 'users') {
          const usersData = await api.admin.getAllUsers();
          setUsers(usersData);
        } else if (activeTab === 'requests') {
          const requestsData = await api.admin.getClubRequests();
          setRequests(requestsData);
        }
      } catch (err) {
        setError('Ошибка при загрузке данных. Пожалуйста, попробуйте позже.');
        console.error('Ошибка загрузки данных:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [activeTab, navigate]);
  
  const handleLogout = () => {
    api.admin.logout();
    navigate('/admin/login');
  };
  
  // Функция для показа сообщения об успехе
  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };
  
  // Функция для одобрения заявки на регистрацию клуба
  const handleApproveRequest = async (requestId) => {
    try {
      setLoading(true);
      await api.admin.approveClubRequest(requestId);
      
      const updatedRequests = await api.admin.getClubRequests();
      setRequests(updatedRequests);
      
      showSuccessMessage('Заявка успешно одобрена');
    } catch (err) {
      setError('Ошибка при одобрении заявки. Пожалуйста, попробуйте снова.');
      console.error('Ошибка при одобрении заявки:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Функция для отклонения заявки на регистрацию клуба
  const handleRejectRequest = async (requestId) => {
    const reason = prompt('Укажите причину отклонения заявки:');
    
    if (reason === null) {
      return;
    }
    
    try {
      setLoading(true);
      await api.admin.rejectClubRequest(requestId, reason);
      
      const updatedRequests = await api.admin.getClubRequests();
      setRequests(updatedRequests);
      
      showSuccessMessage('Заявка отклонена');
    } catch (err) {
      setError('Ошибка при отклонении заявки. Пожалуйста, попробуйте снова.');
      console.error('Ошибка при отклонении заявки:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Функция для просмотра информации о клубе
  const handleViewClub = (clubId) => {
    window.open(`/clubs/${clubId}`, '_blank');
  };
  
  // Функция для показа модального окна подтверждения удаления
  const showDeleteConfirm = (clubId, clubName) => {
    setDeleteConfirm({
      show: true,
      clubId: clubId,
      clubName: clubName
    });
  };
  
  // Функция для скрытия модального окна подтверждения удаления
  const hideDeleteConfirm = () => {
    setDeleteConfirm({
      show: false,
      clubId: null,
      clubName: ''
    });
  };
  
  // Функция для удаления клуба
  const handleDeleteClub = async () => {
    if (!deleteConfirm.clubId) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Вызываем API для удаления клуба
      await api.admin.deleteClub(deleteConfirm.clubId);
      
      // Обновляем список клубов после удаления
      const updatedClubs = await api.admin.getAllClubs();
      setClubs(updatedClubs);
      
      // Скрываем модальное окно
      hideDeleteConfirm();
      
      // Показываем сообщение об успехе
      showSuccessMessage(`Клуб "${deleteConfirm.clubName}" успешно удален`);
      
    } catch (err) {
      setError(`Ошибка при удалении клуба: ${err.message}`);
      console.error('Ошибка при удалении клуба:', err);
      hideDeleteConfirm();
    } finally {
      setLoading(false);
    }
  };
  
  // Функция для открытия модального окна редактирования пользователя
  const handleEditUser = async (userId) => {
    try {
      setLoading(true);
      const userData = await api.admin.getUser(userId);
      
      setEditUserModal({ show: true, user: userData });
      setUserForm({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        balance: userData.balance || '0',
        new_password: ''
      });
    } catch (err) {
      setError(`Ошибка при загрузке данных пользователя: ${err.message}`);
      console.error('Ошибка загрузки пользователя:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Функция для закрытия модального окна
  const closeEditUserModal = () => {
    setEditUserModal({ show: false, user: null });
    setUserForm({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      balance: '',
      new_password: ''
    });
  };
  
  // Функция для сохранения изменений пользователя
  const handleSaveUser = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      // Обновляем основные данные
      const updateData = {
        first_name: userForm.first_name,
        last_name: userForm.last_name,
        email: userForm.email,
        phone: userForm.phone,
        balance: parseFloat(userForm.balance) || 0
      };
      
      await api.admin.updateUser(editUserModal.user.id, updateData);
      
      // Если указан новый пароль - меняем его
      if (userForm.new_password && userForm.new_password.length >= 6) {
        await api.admin.changeUserPassword(editUserModal.user.id, userForm.new_password);
      }
      
      // Обновляем список пользователей
      const updatedUsers = await api.admin.getAllUsers();
      setUsers(updatedUsers);
      
      closeEditUserModal();
      showSuccessMessage('Данные пользователя успешно обновлены');
      
    } catch (err) {
      setError(`Ошибка при обновлении данных: ${err.message}`);
      console.error('Ошибка обновления пользователя:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // ===== HANDLERS FOR CLUB EDITING =====
  
  const handleAddClub = async () => {
    try {
      // Загружаем список владельцев, если еще не загружен
      if (owners.length === 0) {
        setLoading(true);
        const ownersData = await api.admin.getOwners();
        setOwners(ownersData);
        setLoading(false);
      }
      
      // Открываем модалку в режиме добавления (club = null, isAddMode = true)
      setEditClubModal({ show: true, club: null });
      setClubForm({
        name: '',
        address: '',
        category: '',
        description: '',
        contact_phone: '',
        contact_email: '',
        website: '',
        owner_id: ''
      });
    } catch (err) {
      setError(`Ошибка при загрузке данных: ${err.message}`);
      console.error('Ошибка загрузки владельцев:', err);
      setLoading(false);
    }
  };
  
  const handleEditClub = async (clubId) => {
    try {
      setLoading(true);
      
      // Загружаем данные клуба
      const clubData = await api.admin.getClub(clubId);
      
      // Загружаем список владельцев, если еще не загружен
      if (owners.length === 0) {
        const ownersData = await api.admin.getOwners();
        setOwners(ownersData);
      }
      
      setEditClubModal({ show: true, club: clubData });
      setClubForm({
        name: clubData.name || '',
        address: clubData.address || '',
        category: clubData.category || '',
        description: clubData.description || '',
        contact_phone: clubData.contact_phone || '',
        contact_email: clubData.contact_email || '',
        website: clubData.website || '',
        owner_id: clubData.owner_id || ''
      });
    } catch (err) {
      setError(`Ошибка при загрузке данных клуба: ${err.message}`);
      console.error('Ошибка загрузки клуба:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const closeEditClubModal = () => {
    setEditClubModal({ show: false, club: null });
    setClubForm({
      name: '',
      address: '',
      category: '',
      description: '',
      contact_phone: '',
      contact_email: '',
      website: '',
      owner_id: ''
    });
  };
  
  const handleSaveClub = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      const clubData = {
        name: clubForm.name,
        address: clubForm.address,
        category: clubForm.category,
        description: clubForm.description,
        contact_phone: clubForm.contact_phone,
        contact_email: clubForm.contact_email,
        website: clubForm.website,
        owner_id: clubForm.owner_id
      };
      
      // Если есть club - редактирование, если нет - создание
      if (editClubModal.club) {
        // Режим редактирования
        await api.admin.updateClub(editClubModal.club.id, clubData);
        showSuccessMessage('Данные клуба успешно обновлены');
      } else {
        // Режим добавления
        await api.admin.registerClub(clubData);
        showSuccessMessage('Клуб успешно создан');
      }
      
      // Обновляем список клубов
      const updatedClubs = await api.admin.getAllClubs();
      setClubs(updatedClubs);
      
      closeEditClubModal();
      
    } catch (err) {
      setError(`Ошибка при сохранении данных клуба: ${err.message}`);
      console.error('Ошибка сохранения клуба:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="admin-dashboard">
      <div className="admin-sidebar">
        <div className="admin-logo">
          <h2>FitnessHub</h2>
          <p>Панель управления</p>
        </div>
        
        <ul className="admin-menu">
          <li className={activeTab === 'clubs' ? 'active' : ''} onClick={() => setActiveTab('clubs')}>
            <i className="icon-clubs"></i>Клубы
          </li>
          <li className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>
            <i className="icon-users"></i>Пользователи
          </li>
          <li className={activeTab === 'requests' ? 'active' : ''} onClick={() => setActiveTab('requests')}>
            <i className="icon-requests"></i>Заявки
          </li>
          <li className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}>
            <i className="icon-settings"></i>Настройки
          </li>
        </ul>
        
        <div className="admin-logout">
          <button onClick={handleLogout}>Выйти</button>
        </div>
      </div>
      
      <div className="admin-content">
        <div className="admin-header">
          <h1>
            {activeTab === 'clubs' && 'Управление клубами'}
            {activeTab === 'users' && 'Управление пользователями'}
            {activeTab === 'requests' && 'Заявки на регистрацию'}
            {activeTab === 'settings' && 'Настройки системы'}
          </h1>
          
          <div className="admin-header-actions">
            {activeTab === 'clubs' && (
              <button 
                onClick={handleAddClub} 
                className="action-button"
                disabled={loading}
              >
                + Добавить новый клуб
              </button>
            )}
          </div>
        </div>
        
        {error && <div className="admin-error-message">{error}</div>}
        {successMessage && <div className="admin-success-message">{successMessage}</div>}
        
        {loading ? (
          <div className="admin-loading">
            <div className="admin-spinner"></div>
            <p>Загрузка данных...</p>
          </div>
        ) : (
          <div className="admin-tab-content">
            {activeTab === 'clubs' && (
              <div className="admin-clubs-list">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Название</th>
                      <th>Адрес</th>
                      <th>Категория</th>
                      <th>Владелец</th>
                      <th>Статус</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clubs.length > 0 ? (
                      clubs.map(club => (
                        <tr key={club.id}>
                          <td>{club.id}</td>
                          <td>{club.name}</td>
                          <td>{club.address}</td>
                          <td>{club.category}</td>
                          <td>{club.owner_name || 'Не указан'}</td>
                          <td>
                            <span className={`status-badge ${club.status || 'active'}`}>
                              {club.status === 'active' && 'Активен'}
                              {club.status === 'pending' && 'Ожидание'}
                              {club.status === 'suspended' && 'Приостановлен'}
                              {club.status === 'inactive' && 'Неактивен'}
                              {!club.status && 'Активен'}
                            </span>
                          </td>
                          <td>
                            <div className="table-actions">
                              <button 
                                className="action-edit"
                                onClick={() => handleEditClub(club.id)}
                              >
                                Изменить
                              </button>
                              <button className="action-view" onClick={() => handleViewClub(club.id)}>
                                Просмотр
                              </button>
                              <button 
                                className="action-delete"
                                onClick={() => showDeleteConfirm(club.id, club.name)}
                                disabled={loading}
                              >
                                Удалить
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="no-data">Нет данных о клубах</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            
            {activeTab === 'users' && (
              <div className="admin-users-list">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Имя</th>
                      <th>Email</th>
                      <th>Роль</th>
                      <th>Дата регистрации</th>
                      <th>Баланс</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length > 0 ? (
                      users.map(user => (
                        <tr key={user.id}>
                          <td>{user.id}</td>
                          <td>{user.first_name} {user.last_name}</td>
                          <td>{user.email}</td>
                          <td>
                            {user.is_admin && 'Администратор'}
                            {user.is_club_owner && !user.is_admin && 'Владелец клуба'}
                            {!user.is_admin && !user.is_club_owner && 'Клиент'}
                          </td>
                          <td>{new Date(user.created_at).toLocaleDateString('ru-RU')}</td>
                          <td>{user.balance} ₽</td>
                          <td>
                            <div className="table-actions">
                              <button 
                                className="action-edit"
                                onClick={() => handleEditUser(user.id)}
                              >
                                Изменить
                              </button>
                              <button className="action-view">Просмотр</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="no-data">Нет данных о пользователях</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            
            {activeTab === 'requests' && (
              <div className="admin-requests-list">
                {requests.length > 0 ? (
                  requests.map(request => (
                    <div className="request-card" key={request.id}>
                      <div className="request-header">
                        <h3>{request.club_name}</h3>
                        <span className={`request-status ${request.status}`}>
                          {request.status === 'pending' && 'На рассмотрении'}
                          {request.status === 'approved' && 'Одобрена'}
                          {request.status === 'rejected' && 'Отклонена'}
                        </span>
                      </div>
                      <div className="request-details">
                        <p><strong>От:</strong> {request.contact_name}</p>
                        <p><strong>Email:</strong> {request.contact_email}</p>
                        <p><strong>Телефон:</strong> {request.contact_phone || 'Не указан'}</p>
                        <p><strong>Адрес клуба:</strong> {request.address}</p>
                        <p><strong>Категория:</strong> {request.category}</p>
                        <p><strong>Дата заявки:</strong> {new Date(request.created_at).toLocaleDateString('ru-RU')}</p>
                      </div>
                      <div className="request-message">
                        <p>{request.message || 'Сообщение отсутствует'}</p>
                      </div>
                      {request.status === 'pending' && (
                        <div className="request-actions">
                          <button 
                            className="approve-btn" 
                            onClick={() => handleApproveRequest(request.id)}
                            disabled={loading}
                          >
                            Одобрить
                          </button>
                          <button 
                            className="reject-btn" 
                            onClick={() => handleRejectRequest(request.id)}
                            disabled={loading}
                          >
                            Отклонить
                          </button>
                          <Link 
                            to={`/admin/clubs/register?request=${request.id}`} 
                            className="create-btn"
                          >
                            Создать клуб
                          </Link>
                        </div>
                      )}
                      {request.status === 'rejected' && (
                        <div className="request-rejection-reason">
                          <p><strong>Причина отказа:</strong> {request.rejection_reason || 'Не указана'}</p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="no-requests">
                    <p>Нет новых заявок на регистрацию клубов</p>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'settings' && (
              <div className="admin-settings">
                <div className="settings-card">
                  <h2>Настройки платформы</h2>
                  <p>Управление системными настройками FitnessHub</p>
                  
                  <div className="settings-section">
                    <h3>Общие настройки</h3>
                    <p>Этот раздел находится в разработке</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Модальное окно подтверждения удаления */}
      {deleteConfirm.show && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3>Подтверждение удаления</h3>
              <button 
                className="admin-modal-close"
                onClick={hideDeleteConfirm}
              >
                ×
              </button>
            </div>
            <div className="admin-modal-content">
              <p>Вы уверены, что хотите удалить клуб <strong>"{deleteConfirm.clubName}"</strong>?</p>
              <p className="admin-warning-text">
                ⚠️ Это действие нельзя отменить. Будут удалены:
              </p>
              <ul className="admin-warning-list">
                <li>Все данные о клубе</li>
                <li>Расписание занятий</li>
                <li>История бронирований</li>
                <li>Финансовая статистика</li>
              </ul>
            </div>
            <div className="admin-modal-actions">
              <button 
                className="admin-btn-cancel"
                onClick={hideDeleteConfirm}
                disabled={loading}
              >
                Отмена
              </button>
              <button 
                className="admin-btn-delete"
                onClick={handleDeleteClub}
                disabled={loading}
              >
                {loading ? 'Удаление...' : 'Удалить клуб'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Модальное окно редактирования пользователя */}
      {editUserModal.show && (
        <EditUserModal
          user={editUserModal.user}
          userForm={userForm}
          setUserForm={setUserForm}
          onSave={handleSaveUser}
          onClose={closeEditUserModal}
          loading={loading}
        />
      )}
      
      {/* Модальное окно редактирования/добавления клуба */}
      {editClubModal.show && (
        <EditClubModal
          club={editClubModal.club}
          clubForm={clubForm}
          setClubForm={setClubForm}
          onSave={handleSaveClub}
          onClose={closeEditClubModal}
          loading={loading}
          owners={owners}
          isAddMode={!editClubModal.club}
        />
      )}
    </div>
  );
};

export default AdminDashboardPage;

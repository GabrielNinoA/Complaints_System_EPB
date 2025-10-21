import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import CommentsModal from '../components/CommentsModal';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  if (totalPages <= 1) {
    return null;
  }

  return React.createElement('div', { className: 'pagination-container' },
    React.createElement('button', {
      onClick: () => onPageChange(currentPage - 1),
      disabled: currentPage === 1,
      className: 'pagination-button'
    }, 'Anterior'),

    ...pageNumbers.map(number =>
      React.createElement('button', {
        key: number,
        onClick: () => onPageChange(number),
        className: `pagination-button ${currentPage === number ? 'active' : ''}`
      }, number)
    ),

    React.createElement('button', {
      onClick: () => onPageChange(currentPage + 1),
      disabled: currentPage === totalPages,
      className: 'pagination-button'
    }, 'Siguiente')
  );
};

const ComplaintsList = () => {
  const { entityId } = useParams();
  const navigate = useNavigate();
  const { user, isLogged, checkAuthStatus } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [entityName, setEntityName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalComplaints, setTotalComplaints] = useState(0);
  const complaintsPerPage = 10;
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedQueja, setSelectedQueja] = useState(null);

  // Verificar autenticación al montar el componente
  useEffect(() => {
    const verifyAuth = async () => {
      await checkAuthStatus();
      if (!isLogged) {
        navigate('/');
      }
    };
    verifyAuth();
  }, [isLogged, navigate, checkAuthStatus]);

  const getStateLabel = (state) => {
    const stateLabels = {
      'open': 'Abierta',
      'in process': 'En proceso',
      'closed': 'Cerrada'
    };
    return stateLabels[state] || 'Abierta';
  };

  const toggleMenu = (id) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const handleDelete = async (id) => {
    if (!isLogged) {
      alert('Debe iniciar sesión para realizar esta operación');
      return;
    }

    if (!window.confirm('¿Está seguro de eliminar esta queja y todos sus comentarios?')) {
      setOpenMenuId(null);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/quejas/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: user
          })
        }
      );

      const data = await response.json();
      
      if (data.success) {
        alert('Queja eliminada exitosamente');
        fetchComplaints();
      } else {
        alert(data.message || 'Error al eliminar la queja');
      }
    } catch (error) {
      console.error('Error eliminando queja:', error);
      alert('Error de conexión');
    } finally {
      setOpenMenuId(null);
    }
  };

  const handleUpdate = async (id) => {
    if (!isLogged) {
      alert('Debe iniciar sesión para realizar esta operación');
      return;
    }

    // Mostrar opciones de estado
    const estados = [
      { value: 'open', label: 'Abierta' },
      { value: 'in process', label: 'En proceso' },
      { value: 'closed', label: 'Cerrada' }
    ];

    const estadoSeleccionado = window.prompt(
      'Seleccione el nuevo estado:\n\n' +
      estados.map((estado, index) => `${index + 1}. ${estado.label} (${estado.value})`).join('\n') +
      '\n\nIngrese el número (1-3):'
    );

    if (!estadoSeleccionado) {
      setOpenMenuId(null);
      return;
    }

    const indice = parseInt(estadoSeleccionado) - 1;
    if (indice < 0 || indice >= estados.length) {
      alert('Selección inválida');
      setOpenMenuId(null);
      return;
    }

    const nuevoEstado = estados[indice].value;

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/quejas/${id}/estado`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            state: nuevoEstado,
            username: user
          })
        }
      );

      const data = await response.json();
      
      if (data.success) {
        alert(`Estado actualizado exitosamente a: ${estados[indice].label}`);
        fetchComplaints();
      } else {
        alert(data.message || 'Error al actualizar el estado');
      }
    } catch (error) {
      console.error('Error actualizando estado:', error);
      alert('Error de conexión');
    } finally {
      setOpenMenuId(null);
    }
  };

  const handleVerComentarios = (queja) => {
    setSelectedQueja(queja);
    setShowCommentsModal(true);
    setOpenMenuId(null);
  };

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      
      const entityResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/entidades`);
      const entityData = await entityResponse.json();
      
      if (entityData.success) {
        const entity = entityData.data.find(e => e.id === parseInt(entityId));
        setEntityName(entity ? entity.nombre : 'Entidad desconocida');
      }

      const complaintsResponse = await fetch(
        `${process.env.REACT_APP_API_URL}/api/quejas/entidad/${entityId}?limit=${complaintsPerPage}&offset=${(currentPage - 1) * complaintsPerPage}`
      );
      const complaintsData = await complaintsResponse.json();
      
      if (complaintsData.success) {
        setComplaints(complaintsData.data);
        const { total, totalPages, currentPage } = complaintsData.pagination;
        setTotalComplaints(total);
        setTotalPages(totalPages);
        setCurrentPage(currentPage);
      } else {
        setError('No se pudieron cargar las quejas');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (entityId) {
      fetchComplaints();
    }
  }, [entityId, currentPage]);
  
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  if (loading) {
    return React.createElement('div', { className: 'page-container' },
      React.createElement('div', { className: 'loading-message' },
        'Cargando quejas...'
      )
    );
  }

  if (error) {
    return React.createElement('div', { className: 'page-container' },
      React.createElement('div', { className: 'error-message' },
        error
      )
    );
  }

  return React.createElement('div', { className: 'page-container' },
    React.createElement('h1', { className: 'page-title' },
      `Quejas de ${entityName}`
    ),
    
    React.createElement('div', { className: 'complaints-count' },
      `Total de quejas: ${totalComplaints}`
    ),
    
    React.createElement('div', { className: 'complaints-list' },
      complaints.length === 0 
        ? React.createElement('div', { className: 'no-complaints' },
            'No hay quejas registradas para esta entidad.'
          )
        : complaints.map((complaint, index) =>
            React.createElement('div', {
              key: complaint.id,
              className: 'complaint-item'
            },
              React.createElement('div', { className: 'complaint-header' },
                React.createElement('div', { className: 'complaint-title' },
                  `Queja #${String((currentPage - 1) * complaintsPerPage + index + 1).padStart(2, '0')}`,
                  React.createElement('span', { 
                    className: `complaint-state state-${complaint.state || 'open'}` 
                  }, getStateLabel(complaint.state || 'open'))
                ),
                React.createElement('div', { className: 'menu-wrapper' },
                  React.createElement('button', {
                    className: 'complaint-menu-button',
                    onClick: () => toggleMenu(complaint.id)
                  }, '⋮'),
                  openMenuId === complaint.id &&
                  React.createElement('div', { className: 'complaint-menu' },
                    React.createElement('button', {
                      onClick: () => handleVerComentarios(complaint),
                      className: 'menu-option'
                    }, `💬 Ver comentarios (${complaint.total_comentarios || 0})`),
                    React.createElement('button', {
                      onClick: () => handleUpdate(complaint.id),
                      className: 'menu-option'
                    }, 'Actualizar estado'),
                    React.createElement('button', {
                      onClick: () => handleDelete(complaint.id),
                      className: 'menu-option menu-option-danger'
                    }, 'Borrar queja')
                  )   
                )   
              ),
              React.createElement('div', { className: 'complaint-description' },
                complaint.descripcion
              ),
              complaint.total_comentarios > 0 &&
              React.createElement('div', { className: 'complaint-footer' },
                React.createElement('span', { className: 'comentarios-badge' },
                  `💬 ${complaint.total_comentarios} ${complaint.total_comentarios === 1 ? 'comentario' : 'comentarios'}`
                )
              )
            )
          )
    ),
    
    React.createElement(Pagination, {
      currentPage: currentPage,
      totalPages: totalPages,
      onPageChange: handlePageChange
    }),

    showCommentsModal && selectedQueja && React.createElement(CommentsModal, {
      quejaId: selectedQueja.id,
      quejaTitle: `Queja: ${selectedQueja.entidad_nombre}`,
      onClose: () => {
        setShowCommentsModal(false);
        setSelectedQueja(null);
        fetchComplaints();
      }
    })
  );
};

export default ComplaintsList;
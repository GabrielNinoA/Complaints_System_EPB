import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import config from '../config/config';

const ComplaintsList = () => {
  const { entityId } = useParams();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [entityName, setEntityName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        setLoading(true);
        
        // Fetch entity name
        const entityResponse = await fetch(`${config.API_URL}/api/entidades`);
        const entityData = await entityResponse.json();
        
        if (entityData.success) {
          const entity = entityData.data.find(e => e.id === parseInt(entityId));
          setEntityName(entity ? entity.nombre : 'Entidad desconocida');
        }

        // Fetch complaints for this entity
        const complaintsResponse = await fetch(`${config.API_URL}/api/quejas/entidad/${entityId}`);
        const complaintsData = await complaintsResponse.json();
        
        if (complaintsData.success) {
          setComplaints(complaintsData.data);
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

    if (entityId) {
      fetchComplaints();
    }
  }, [entityId]);

  const handleComplaintClick = (complaintId) => {
    navigate(`/queja/${complaintId}`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const truncateText = (text, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
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
    
    React.createElement('div', { className: 'complaints-summary' },
      React.createElement('div', { className: 'complaints-count' },
        `Total de quejas: ${complaints.length}`
      ),
      React.createElement('button', {
        className: 'btn-back',
        onClick: () => navigate('/consultar-quejas')
      }, '← Volver a consultar')
    ),
    
    React.createElement('div', { className: 'complaints-list' },
      complaints.length === 0 
        ? React.createElement('div', { className: 'no-complaints' },
            'No hay quejas registradas para esta entidad.'
          )
        : complaints.map((complaint, index) =>
            React.createElement('div', {
              key: complaint.id,
              className: 'complaint-item clickable',
              onClick: () => handleComplaintClick(complaint.id)
            },
              React.createElement('div', { className: 'complaint-header' },
                React.createElement('div', { className: 'complaint-title' },
                  `Queja #${String(index + 1).padStart(2, '0')}`
                ),
                React.createElement('div', { className: 'complaint-meta' },
                  React.createElement('span', { className: 'complaint-date' },
                    formatDate(complaint.created_at)
                  ),
                  complaint.total_comentarios !== undefined && complaint.total_comentarios > 0 && 
                    React.createElement('span', { className: 'comments-badge' },
                      `${complaint.total_comentarios} comentario${complaint.total_comentarios > 1 ? 's' : ''}`
                    )
                )
              ),
              React.createElement('div', { className: 'complaint-description' },
                truncateText(complaint.descripcion)
              ),
              React.createElement('div', { className: 'complaint-actions' },
                React.createElement('span', { className: 'view-details' },
                  'Ver detalles →'
                )
              )
            )
          )
    )
  );
};

export default ComplaintsList;
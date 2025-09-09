import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const ComplaintsList = () => {
  const { entityId } = useParams();
  const [complaints, setComplaints] = useState([]);
  const [entityName, setEntityName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        setLoading(true);
        
        // Fetch entity name
        const entityResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/entidades`);
        const entityData = await entityResponse.json();
        
        if (entityData.success) {
          const entity = entityData.data.find(e => e.id === parseInt(entityId));
          setEntityName(entity ? entity.nombre : 'Entidad desconocida');
        }

        // Fetch complaints for this entity
        const complaintsResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/quejas/entidad/${entityId}`);
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
      `Total de quejas: ${complaints.length}`
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
              React.createElement('div', { className: 'complaint-title' },
                `Queja #${String(index + 1).padStart(2, '0')}`
              ),
              React.createElement('div', { className: 'complaint-description' },
                complaint.descripcion
              )
            )
          )
    )
  );
};

export default ComplaintsList;

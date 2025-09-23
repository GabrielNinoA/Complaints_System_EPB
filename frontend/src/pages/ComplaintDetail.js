import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ComentariosSection from '../components/ComentariosSection';
import config from '../config/config';

const ComplaintDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [queja, setQueja] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQueja = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${config.API_URL}/api/quejas/${id}`);
        const data = await response.json();
        
        if (data.success) {
          setQueja(data.data);
        } else {
          setError('No se pudo cargar la queja');
        }
      } catch (err) {
        console.error('Error fetching queja:', err);
        setError('Error de conexión');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchQueja();
    }
  }, [id]);

  const handleComentarioAdded = () => {
    // Actualizar contador de comentarios si es necesario
    // Por ahora, simplemente mostrar un mensaje de éxito
    console.log('Comentario agregado exitosamente');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleGoBack = () => {
    navigate(-1); // Volver a la página anterior
  };

  if (loading) {
    return React.createElement('div', { className: 'page-container' },
      React.createElement('div', { className: 'loading-message' },
        'Cargando detalles de la queja...'
      )
    );
  }

  if (error || !queja) {
    return React.createElement('div', { className: 'page-container' },
      React.createElement('div', { className: 'error-message' },
        error || 'Queja no encontrada'
      ),
      React.createElement('div', { className: 'button-group' },
        React.createElement('button', {
          className: 'form-button',
          onClick: handleGoBack
        }, 'Volver')
      )
    );
  }

  return React.createElement('div', { className: 'page-container complaint-detail-page' },
    // Header con información básica
    React.createElement('div', { className: 'complaint-detail-header' },
      React.createElement('button', {
        className: 'btn-back',
        onClick: handleGoBack
      }, '← Volver'),
      
      React.createElement('h1', { className: 'page-title' },
        `Queja #${id}`
      )
    ),

    // Información de la queja
    React.createElement('div', { className: 'complaint-info-card' },
      React.createElement('div', { className: 'complaint-info-header' },
        React.createElement('h2', { className: 'entity-name' },
          queja.entidad_nombre
        ),
        React.createElement('div', { className: 'complaint-meta' },
          React.createElement('span', { className: 'complaint-date' },
            `Fecha: ${formatDate(queja.created_at)}`
          ),
          queja.total_comentarios !== undefined && React.createElement('span', { className: 'comments-count' },
            `${queja.total_comentarios} comentario${queja.total_comentarios !== 1 ? 's' : ''}`
          )
        )
      ),
      
      React.createElement('div', { className: 'complaint-description' },
        React.createElement('h3', null, 'Descripción de la queja:'),
        React.createElement('p', { className: 'description-text' },
          queja.descripcion
        )
      )
    ),

    // Sección de comentarios
    React.createElement(ComentariosSection, {
      quejaId: parseInt(id),
      onComentarioAdded: handleComentarioAdded
    })
  );
};

export default ComplaintDetail;
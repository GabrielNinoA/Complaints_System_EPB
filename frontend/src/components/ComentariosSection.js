import React, { useState, useEffect } from 'react';
import config from '../config/config';

const ComentariosSection = ({ quejaId, onComentarioAdded }) => {
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Validación del comentario
  const validateComentario = (texto) => {
    const trimmedText = texto.trim();
    if (trimmedText.length < 3) {
      return 'El comentario debe tener al menos 3 caracteres.';
    }
    if (trimmedText.length > 2000) {
      return 'El comentario no puede exceder los 2000 caracteres.';
    }
    return null;
  };

  // Cargar comentarios al montar el componente
  useEffect(() => {
    if (quejaId) {
      fetchComentarios();
    }
  }, [quejaId]);

  const fetchComentarios = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${config.API_URL}/api/comentarios/queja/${quejaId}`);
      const data = await response.json();
      
      if (data.success) {
        setComentarios(data.data || []);
      } else {
        setMessage('Error cargando comentarios');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error fetching comentarios:', error);
      setMessage('Error de conexión al cargar comentarios');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComentario = async () => {
    // Validar comentario
    const validationError = validateComentario(nuevoComentario);
    if (validationError) {
      setMessage(validationError);
      setMessageType('error');
      return;
    }

    try {
      setSubmitting(true);
      setMessage('');
      setMessageType('');

      const response = await fetch(`${config.API_URL}/api/comentarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          queja_id: quejaId,
          texto: nuevoComentario.trim()
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage('Comentario agregado exitosamente');
        setMessageType('success');
        setNuevoComentario('');
        setShowForm(false);
        
        // Recargar comentarios
        await fetchComentarios();
        
        // Callback opcional para el componente padre
        if (onComentarioAdded) {
          onComentarioAdded();
        }
      } else {
        setMessage(data.message || 'Error al agregar comentario');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('Error de conexión al agregar comentario');
      setMessageType('error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleForm = () => {
    setShowForm(!showForm);
    setMessage('');
    setMessageType('');
    if (!showForm) {
      setNuevoComentario('');
    }
  };

  return React.createElement('div', { className: 'comentarios-section' },
    // Header de la sección
    React.createElement('div', { className: 'comentarios-header' },
      React.createElement('h3', { className: 'comentarios-title' },
        `Comentarios (${comentarios.length})`
      ),
      React.createElement('button', {
        className: 'btn-toggle-form',
        onClick: toggleForm
      }, showForm ? 'Cancelar' : 'Agregar Comentario')
    ),

    // Formulario para nuevo comentario
    showForm && React.createElement('div', { className: 'comentario-form' },
      React.createElement('div', { className: 'form-group' },
        React.createElement('label', { className: 'form-label' },
          'Nuevo comentario:'
        ),
        React.createElement('textarea', {
          className: 'form-textarea comentario-textarea',
          placeholder: 'Escriba su comentario aquí...',
          value: nuevoComentario,
          maxLength: 2000,
          onChange: (e) => setNuevoComentario(e.target.value),
          rows: 4
        }),
        React.createElement('div', { className: 'character-counter' },
          React.createElement('span', { 
            className: nuevoComentario.trim().length < 3 ? 'counter-error' : 
                      nuevoComentario.length > 1800 ? 'counter-warning' : 'counter-normal'
          }, 
            `${nuevoComentario.length}/2000 caracteres`
          ),
          nuevoComentario.trim().length < 3 && React.createElement('span', { className: 'validation-hint' },
            ` (mínimo 3 caracteres)`
          )
        )
      ),
      
      message && React.createElement('div', { 
        className: `message ${messageType}`
      }, message),
      
      React.createElement('div', { className: 'button-group' },
        React.createElement('button', {
          className: 'form-button',
          onClick: handleSubmitComentario,
          disabled: validateComentario(nuevoComentario) !== null || submitting
        }, submitting ? 'Guardando...' : 'Guardar Comentario')
      )
    ),

    // Lista de comentarios
    React.createElement('div', { className: 'comentarios-list' },
      loading && React.createElement('div', { className: 'loading-message' },
        'Cargando comentarios...'
      ),
      
      !loading && comentarios.length === 0 && React.createElement('div', { className: 'no-comentarios' },
        'No hay comentarios para esta queja aún. ¡Sé el primero en comentar!'
      ),
      
      !loading && comentarios.length > 0 && comentarios.map((comentario, index) =>
        React.createElement('div', {
          key: comentario.id,
          className: 'comentario-item'
        },
          React.createElement('div', { className: 'comentario-header' },
            React.createElement('span', { className: 'comentario-numero' },
              `Comentario #${index + 1}`
            ),
            React.createElement('span', { className: 'comentario-fecha' },
              formatDate(comentario.fecha_comentario)
            )
          ),
          React.createElement('div', { className: 'comentario-texto' },
            comentario.texto
          )
        )
      )
    )
  );
};

export default ComentariosSection;
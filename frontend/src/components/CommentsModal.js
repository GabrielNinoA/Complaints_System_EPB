import React, { useState, useEffect } from 'react';

const CommentsModal = ({ quejaId, quejaTitle, onClose }) => {
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    const cargarComentarios = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/quejas/${quejaId}/comentarios`
        );
        const data = await response.json();
        
        if (data.success) {
          setComentarios(data.data);
        }
      } catch (error) {
        console.error('Error cargando comentarios:', error);
        setMessage('Error al cargar comentarios');
        setMessageType('error');
      } finally {
        setLoading(false);
      }
    };

    cargarComentarios();
  }, [quejaId]);

  const handleAgregarComentario = async () => {
    if (!nuevoComentario.trim() || nuevoComentario.trim().length < 5) {
      setMessage('El comentario debe tener al menos 5 caracteres');
      setMessageType('error');
      return;
    }

    if (nuevoComentario.trim().length > 1000) {
      setMessage('El comentario no puede exceder 1000 caracteres');
      setMessageType('error');
      return;
    }

    try {
      setLoading(true);
      setMessage('');
      
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/quejas/${quejaId}/comentarios`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            queja_id: quejaId,
            texto: nuevoComentario.trim()
          })
        }
      );

      const data = await response.json();
      
      if (data.success) {
        setMessage('Comentario agregado exitosamente');
        setMessageType('success');
        setNuevoComentario('');
        await cargarComentarios();
        
        setTimeout(() => {
          setMessage('');
        }, 2000);
      } else {
        setMessage(data.message || 'Error al agregar comentario');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error agregando comentario:', error);
      setMessage('Error de conexión');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarComentario = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este comentario?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/comentarios/${id}`,
        {
          method: 'DELETE'
        }
      );

      const data = await response.json();
      
      if (data.success) {
        setMessage('Comentario eliminado');
        setMessageType('success');
        await cargarComentarios();
        
        setTimeout(() => {
          setMessage('');
        }, 2000);
      } else {
        setMessage('Error al eliminar comentario');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error eliminando comentario:', error);
      setMessage('Error de conexión');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditarComentario = (comentario) => {
    setEditingId(comentario.id);
    setEditText(comentario.texto);
  };

  const handleGuardarEdicion = async (id) => {
    if (!editText.trim() || editText.trim().length < 5) {
      setMessage('El comentario debe tener al menos 5 caracteres');
      setMessageType('error');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/comentarios/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            texto: editText.trim()
          })
        }
      );

      const data = await response.json();
      
      if (data.success) {
        setMessage('Comentario actualizado');
        setMessageType('success');
        setEditingId(null);
        setEditText('');
        await cargarComentarios();
        
        setTimeout(() => {
          setMessage('');
        }, 2000);
      } else {
        setMessage('Error al actualizar comentario');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error actualizando comentario:', error);
      setMessage('Error de conexión');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const formatFecha = (fecha) => {
    const date = new Date(fecha);
    return date.toLocaleString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return React.createElement('div', {
    className: 'modal-overlay',
    onClick: onClose
  },
    React.createElement('div', {
      className: 'modal-content',
      onClick: (e) => e.stopPropagation()
    },
      React.createElement('div', { className: 'modal-header' },
        React.createElement('h2', { className: 'modal-title' },
          quejaTitle
        ),
        React.createElement('button', {
          className: 'modal-close',
          onClick: onClose
        }, '✕')
      ),

      React.createElement('div', { className: 'modal-body' },
        message && React.createElement('div', {
          className: `message ${messageType}`
        }, message),

        React.createElement('div', { className: 'comentarios-section' },
          React.createElement('h3', null, `Comentarios (${comentarios.length})`),
          
          loading && !comentarios.length
            ? React.createElement('p', { className: 'loading-text' }, 'Cargando comentarios...')
            : comentarios.length === 0
            ? React.createElement('p', { className: 'no-comments' }, 'No hay comentarios aún')
            : React.createElement('div', { className: 'comentarios-list' },
                comentarios.map((comentario) =>
                  React.createElement('div', {
                    key: comentario.id,
                    className: 'comentario-item'
                  },
                    editingId === comentario.id
                      ? React.createElement('div', { className: 'edit-container' },
                          React.createElement('textarea', {
                            className: 'edit-textarea',
                            value: editText,
                            onChange: (e) => setEditText(e.target.value),
                            maxLength: 1000
                          }),
                          React.createElement('div', { className: 'edit-actions' },
                            React.createElement('button', {
                              className: 'btn-save',
                              onClick: () => handleGuardarEdicion(comentario.id),
                              disabled: loading
                            }, 'Guardar'),
                            React.createElement('button', {
                              className: 'btn-cancel',
                              onClick: () => {
                                setEditingId(null);
                                setEditText('');
                              }
                            }, 'Cancelar')
                          )
                        )
                      : React.createElement('div', null,
                          React.createElement('p', { className: 'comentario-texto' },
                            comentario.texto
                          ),
                          React.createElement('div', { className: 'comentario-footer' },
                            React.createElement('span', { className: 'comentario-fecha' },
                              formatFecha(comentario.fecha)
                            ),
                            React.createElement('div', { className: 'comentario-actions' },
                              React.createElement('button', {
                                className: 'btn-edit',
                                onClick: () => handleEditarComentario(comentario),
                                disabled: loading
                              }, '✏️ Editar'),
                              React.createElement('button', {
                                className: 'btn-delete',
                                onClick: () => handleEliminarComentario(comentario.id),
                                disabled: loading
                              }, '🗑️ Eliminar')
                            )
                          )
                        )
                  )
                )
              )
        ),

        React.createElement('div', { className: 'nuevo-comentario-section' },
          React.createElement('h3', null, 'Agregar comentario'),
          React.createElement('textarea', {
            className: 'form-textarea',
            placeholder: 'Escribe tu comentario aquí...',
            value: nuevoComentario,
            maxLength: 1000,
            onChange: (e) => setNuevoComentario(e.target.value)
          }),
          React.createElement('div', { className: 'character-counter' },
            React.createElement('span', {
              className: nuevoComentario.trim().length < 5 ? 'counter-error' :
                        nuevoComentario.length > 900 ? 'counter-warning' : 'counter-normal'
            },
              `${nuevoComentario.length}/1000 caracteres`
            ),
            nuevoComentario.trim().length < 5 && React.createElement('span', {
              className: 'validation-hint'
            }, ' (mínimo 5 caracteres)')
          ),
          React.createElement('button', {
            className: 'form-button',
            onClick: handleAgregarComentario,
            disabled: loading || nuevoComentario.trim().length < 5
          }, loading ? 'Guardando...' : 'Agregar Comentario')
        )
      )
    )
  );
};

export default CommentsModal;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Dropdown from '../components/Dropdown';

const ConsultComplaints = () => {
  const navigate = useNavigate();
  const [entities, setEntities] = useState([]);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  useEffect(() => {
    // Fetch entities from the API
    fetch(`${process.env.REACT_APP_API_URL}/api/entidades`)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          setEntities(data.data);
        }
      })
      .catch(error => {
        console.error('Error fetching entities:', error);
        // Use fallback data matching the wireframe
        setEntities([
          { id: 1, nombre: 'CORPOBOYACA' },
          { id: 2, nombre: 'Lotería de Boyacá' },
          { id: 3, nombre: 'EBSA' },
          { id: 4, nombre: 'ITBOY' },
          { id: 5, nombre: 'INDEPORTES' }
        ]);
      });
  }, []);

  const handleConsult = () => {
    if (!selectedEntity) {
      setMessage('Por favor, selecciona una entidad.');
      setMessageType('error');
      return;
    }

    // Navigate to the complaints list for the selected entity
    navigate(`/quejas/${selectedEntity.id}`);
  };

  return React.createElement('div', { className: 'page-container' },
    React.createElement('h1', { className: 'page-title' },
      'Consultar quejas por entidad'
    ),
    
    React.createElement('div', { className: 'form-group' },
      React.createElement(Dropdown, {
        options: entities,
        selectedOption: selectedEntity,
        onSelect: setSelectedEntity,
        placeholder: selectedEntity ? selectedEntity.nombre : 'Entidades',
        displayKey: 'nombre'
      })
    ),
    
    message && React.createElement('div', { 
      className: `message ${messageType}`
    }, message),
    
    React.createElement('div', { className: 'button-group' },
      React.createElement('button', {
        className: 'form-button',
        onClick: handleConsult,
        disabled: !selectedEntity
      }, 'Consultar')
    )
  );
};

export default ConsultComplaints;

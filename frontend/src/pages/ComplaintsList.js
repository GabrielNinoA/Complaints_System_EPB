import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

// Componente para los botones de paginación
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  if (totalPages <= 1) {
    return null; // No mostrar paginación si solo hay una página
  }

  return React.createElement('div', { className: 'pagination-container' },
    // Botón "Anterior"
    React.createElement('button', {
      onClick: () => onPageChange(currentPage - 1),
      disabled: currentPage === 1,
      className: 'pagination-button'
    }, 'Anterior'),

    // Botones de número de página
    ...pageNumbers.map(number =>
      React.createElement('button', {
        key: number,
        onClick: () => onPageChange(number),
        className: `pagination-button ${currentPage === number ? 'active' : ''}`
      }, number)
    ),

    // Botón "Siguiente"
    React.createElement('button', {
      onClick: () => onPageChange(currentPage + 1),
      disabled: currentPage === totalPages,
      className: 'pagination-button'
    }, 'Siguiente')
  );
};


const ComplaintsList = () => {
  const { entityId } = useParams();
  const [complaints, setComplaints] = useState([]);
  const [entityName, setEntityName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- NUEVOS ESTADOS PARA PAGINACIÓN ---
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalComplaints, setTotalComplaints] = useState(0);
  const complaintsPerPage = 10; // El backend limita a 10

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        setLoading(true);
        
        // Fetch entity name (se mantiene igual)
        const entityResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/entidades`);
        const entityData = await entityResponse.json();
        
        if (entityData.success) {
          const entity = entityData.data.find(e => e.id === parseInt(entityId));
          setEntityName(entity ? entity.nombre : 'Entidad desconocida');
        }

        // --- FETCH DE QUEJAS MODIFICADO ---
        // Ahora se pasa el número de página a la API
        const complaintsResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/quejas/entidad/${entityId}?page=${currentPage}`);
        const complaintsData = await complaintsResponse.json();
        
        if (complaintsData.success) {
          setComplaints(complaintsData.data);
          // Suponiendo que la API devuelve el total de quejas para calcular las páginas
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

    if (entityId) {
      fetchComplaints();
    }
    // --- SE AGREGA currentPage A LAS DEPENDENCIAS ---
    // El efecto se ejecutará cuando cambie la entidad o la página
  }, [entityId, currentPage]);
  
  // Función para cambiar de página
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
      // Se muestra el total de quejas obtenidas de la API
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
              React.createElement('div', { className: 'complaint-title' },
                // Se calcula el número de queja basado en la página actual
                `Queja #${String((currentPage - 1) * complaintsPerPage + index + 1).padStart(2, '0')}`
              ),
              React.createElement('div', { className: 'complaint-description' },
                complaint.descripcion
              )
            )
          )
    ),
    
    // --- SE AGREGA EL COMPONENTE DE PAGINACIÓN ---
    React.createElement(Pagination, {
      currentPage: currentPage,
      totalPages: totalPages,
      onPageChange: handlePageChange
    })
  );
};

export default ComplaintsList;

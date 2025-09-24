import React, { useState } from 'react';
import MathCaptcha from '../components/MathCaptcha';

const Reports = () => {
  const [captchaValid, setCaptchaValid] = useState(false);
  const [captchaReset, setCaptchaReset] = useState(0);
  const [showReports, setShowReports] = useState(false);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [estadisticas, setEstadisticas] = useState(null);

  const handleShowReports = async () => {
    if (!captchaValid) {
      setMessage('Por favor, resuelve el captcha antes de continuar.');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');
    setMessageType('');

    try {
      // Construir URL de API - manejar caso donde no hay variable de entorno
      const apiUrl = process.env.REACT_APP_API_URL || '';
      const url = `${apiUrl}/api/reportes`;
      
      console.log('Fetching reports from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('API Response:', data);

      // Validar estructura de respuesta
      if (!data.success) {
        throw new Error(data.message || 'Error en la respuesta del servidor');
      }

      // Validar que existan los datos
      if (!data.data) {
        throw new Error('No se recibieron datos del servidor');
      }

      // Extraer datos de manera segura
      const { resumen, por_entidad } = data.data;
      
      // Validar que por_entidad sea un array
      if (!Array.isArray(por_entidad)) {
        console.warn('por_entidad no es un array:', por_entidad);
        setReports([]);
      } else {
        setReports(por_entidad);
      }

      // Guardar estadísticas si existen
      if (resumen) {
        setEstadisticas(resumen);
      }

      setShowReports(true);
      setMessage('Reportes cargados correctamente');
      setMessageType('success');

    } catch (error) {
      console.error('Error fetching reports:', error);
      setMessage(`Error al cargar los reportes: ${error.message}`);
      setMessageType('error');
      setReports([]);
      setEstadisticas(null);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('es-CO').format(num || 0);
  };

  if (showReports) {
    return React.createElement('div', { className: 'page-container' },
      React.createElement('h1', { className: 'page-title' },
        'Reportes de Quejas'
      ),
      
      // Mostrar estadísticas generales si están disponibles
      estadisticas && React.createElement('div', { className: 'stats-summary', style: { 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem', 
        marginBottom: '2rem',
        padding: '1rem',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px'
      }},
        React.createElement('div', { style: { textAlign: 'center' }},
          React.createElement('h3', { style: { margin: '0 0 0.5rem 0', color: '#2563eb' }}, 
            formatNumber(estadisticas.total_quejas)
          ),
          React.createElement('p', { style: { margin: 0, fontSize: '0.9em', color: '#666' }}, 
            'Total de Quejas'
          )
        ),
        React.createElement('div', { style: { textAlign: 'center' }},
          React.createElement('h3', { style: { margin: '0 0 0.5rem 0', color: '#059669' }}, 
            formatNumber(estadisticas.total_entidades)
          ),
          React.createElement('p', { style: { margin: 0, fontSize: '0.9em', color: '#666' }}, 
            'Entidades Activas'
          )
        ),
        React.createElement('div', { style: { textAlign: 'center' }},
          React.createElement('h3', { style: { margin: '0 0 0.5rem 0', color: '#dc2626' }}, 
            formatNumber(estadisticas.quejas_hoy)
          ),
          React.createElement('p', { style: { margin: 0, fontSize: '0.9em', color: '#666' }}, 
            'Quejas Hoy'
          )
        ),
        React.createElement('div', { style: { textAlign: 'center' }},
          React.createElement('h3', { style: { margin: '0 0 0.5rem 0', color: '#7c3aed' }}, 
            formatNumber(estadisticas.quejas_mes_actual)
          ),
          React.createElement('p', { style: { margin: 0, fontSize: '0.9em', color: '#666' }}, 
            'Este Mes'
          )
        )
      ),
      
      React.createElement('div', { className: 'reports-container' },
        React.createElement('h2', { style: { marginBottom: '1rem' }}, 
          `Distribución por Entidad (${reports.length} entidades)`
        ),
        
        React.createElement('div', { className: 'reports-table' },
          React.createElement('table', { className: 'table' },
            React.createElement('thead', null,
              React.createElement('tr', null,
                React.createElement('th', null, 'Entidad'),
                React.createElement('th', null, 'Total de Quejas'),
                React.createElement('th', null, 'Porcentaje')
              )
            ),
            React.createElement('tbody', null,
              Array.isArray(reports) && reports.length > 0
                ? reports.map((report, index) => {
                    const totalQuejas = estadisticas ? estadisticas.total_quejas : reports.reduce((sum, r) => sum + (parseInt(r.count) || 0), 0);
                    const porcentaje = totalQuejas > 0 ? ((parseInt(report.count) || 0) / totalQuejas * 100).toFixed(1) : '0.0';
                    
                    return React.createElement('tr', {
                      key: report.id || index,
                      style: { 
                        backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white'
                      }
                    },
                      React.createElement('td', { 
                        style: { fontWeight: '500' }
                      }, report.entidad || 'N/A'),
                      React.createElement('td', { 
                        style: { textAlign: 'center', fontWeight: 'bold', color: '#2563eb' }
                      }, formatNumber(report.count)),
                      React.createElement('td', { 
                        style: { textAlign: 'center', fontSize: '0.9em', color: '#666' }
                      }, `${porcentaje}%`)
                    );
                  })
                : React.createElement('tr', null,
                    React.createElement('td', { 
                      colSpan: 3, 
                      style: { textAlign: 'center', padding: '2rem', color: '#666' }
                    }, 'No hay datos disponibles')
                  )
            )
          )
        )
      ),

      message && React.createElement('div', { 
        className: `message ${messageType}`,
        style: { 
          margin: '1rem 0',
          padding: '0.75rem',
          borderRadius: '4px',
          backgroundColor: messageType === 'success' ? '#d1fae5' : '#fee2e2',
          color: messageType === 'success' ? '#065f46' : '#991b1b',
          border: `1px solid ${messageType === 'success' ? '#a7f3d0' : '#fecaca'}`
        }
      }, message),

      React.createElement('div', { className: 'button-group' },
        React.createElement('button', {
          className: 'form-button',
          onClick: handleShowReports,
          disabled: loading,
          style: { marginRight: '1rem' }
        }, loading ? 'Actualizando...' : 'Actualizar'),
        
        React.createElement('button', {
          className: 'form-button',
          onClick: () => {
            setShowReports(false);
            setReports([]);
            setEstadisticas(null);
            setMessage('');
            setCaptchaReset(prev => prev + 1);
          }
        }, 'Volver')
      )
    );
  }

  return React.createElement('div', { className: 'page-container' },
    React.createElement('h1', { className: 'page-title' },
      'Reportes'
    ),
    
    React.createElement('p', { className: 'page-description' },
      'Para acceder a los reportes, por favor resuelve el captcha:'
    ),
    
    React.createElement(MathCaptcha, {
      onValidate: setCaptchaValid,
      isValid: captchaValid,
      resetTrigger: captchaReset,
      darkTheme: true
    }),
    
    message && React.createElement('div', { 
      className: `message ${messageType}`,
      style: { 
        margin: '1rem 0',
        padding: '0.75rem',
        borderRadius: '4px',
        backgroundColor: messageType === 'error' ? '#fee2e2' : '#d1fae5',
        color: messageType === 'error' ? '#991b1b' : '#065f46',
        border: `1px solid ${messageType === 'error' ? '#fecaca' : '#a7f3d0'}`
      }
    }, message),
    
    React.createElement('div', { className: 'button-group' },
      React.createElement('button', {
        className: 'form-button',
        onClick: handleShowReports,
        disabled: !captchaValid || loading
      }, loading ? 'Cargando...' : 'Ver Reportes')
    )
  );
};

export default Reports;
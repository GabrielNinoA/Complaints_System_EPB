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

  const handleShowReports = () => {
    if (!captchaValid) {
      setMessage('Por favor, resuelve el captcha antes de continuar.');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');
    setMessageType('');

    // Fetch reports from API
    fetch(`${process.env.REACT_APP_API_URL}/api/reportes`)
      .then(response => response.json())
      .then(data => {
        setLoading(false);
        if (data.success && data.data && Array.isArray(data.data.por_entidad)) {
          setReports(data.data.por_entidad);
          setShowReports(true);
        } else {
          console.error('Invalid data format:', data);
          setReports([]);
          setMessage('Error al cargar los reportes - formato de datos inválido');
          setMessageType('error');
        }
      })
      .catch(error => {
        console.error('Error fetching reports:', error);
        setLoading(false);
        setMessage('Error de conexión');
        setMessageType('error');
      });
  };

  if (showReports) {
    return React.createElement('div', { className: 'page-container' },
      React.createElement('h1', { className: 'page-title' },
        'Reportes de Quejas'
      ),
      
      React.createElement('div', { className: 'reports-container' },
        React.createElement('div', { className: 'reports-table' },
          React.createElement('table', { className: 'table' },
            React.createElement('thead', null,
              React.createElement('tr', null,
                React.createElement('th', null, 'Entidad'),
                React.createElement('th', null, 'Total de Quejas')
              )
            ),
            React.createElement('tbody', null,
              Array.isArray(reports) && reports.length > 0
                ? reports.map((report) =>
                    React.createElement('tr', {
                      key: report.id
                    },
                      React.createElement('td', null, report.entidad),
                      React.createElement('td', null, report.count)
                    )
                  )
                : React.createElement('tr', null,
                    React.createElement('td', { colSpan: 2, style: { textAlign: 'center' } },
                      'No hay datos disponibles'
                    )
                  )
            )
          )
        )
      ),

      React.createElement('div', { className: 'button-group' },
        React.createElement('button', {
          className: 'form-button',
          onClick: () => {
            setShowReports(false);
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
      className: `message ${messageType}`
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

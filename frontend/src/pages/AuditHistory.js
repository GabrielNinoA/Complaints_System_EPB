import React, { useState, useEffect, useCallback } from 'react';
import config from '../config/config';
import './AuditHistory.css';

const AuditHistory = () => {
  const [historial, setHistorial] = useState([]);
  const [stats, setStats] = useState(null);
  const [consumerStats, setConsumerStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    tipoAccion: '',
    entidadAfectada: '',
    limit: 20
  });

  const fetchConsumerStats = useCallback(async () => {
    try {
      const res = await fetch(`${config.API_URL}/api/historial/consumer/stats`);
      const data = await res.json();
      if (data.success) {
        setConsumerStats(data.data);
      }
    } catch (err) {
      console.error('Error actualizando stats:', err);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (filters.tipoAccion) params.append('tipoAccion', filters.tipoAccion);
      if (filters.entidadAfectada) params.append('entidadAfectada', filters.entidadAfectada);
      params.append('limit', filters.limit);

      const [historialRes, statsRes, consumerRes] = await Promise.all([
        fetch(`${config.API_URL}/api/historial?${params}`),
        fetch(`${config.API_URL}/api/historial/stats`),
        fetch(`${config.API_URL}/api/historial/consumer/stats`)
      ]);

      const [historialData, statsData, consumerData] = await Promise.all([
        historialRes.json(),
        statsRes.json(),
        consumerRes.json()
      ]);

      if (historialData.success) setHistorial(historialData.data);
      if (statsData.success) setStats(statsData.data);
      if (consumerData.success) setConsumerStats(consumerData.data);
      
      setError('');
    } catch (err) {
      setError('Error cargando datos del historial');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchConsumerStats();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchData, fetchConsumerStats]);

  const formatDate = (dateString) => {
    const date = new Date(dateString + 'Z'); 
    
    const colombiaDate = new Date(date.getTime() - (5 * 60 * 60 * 1000));
    
    return colombiaDate.toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const getActionBadge = (action) => {
    const badges = {
      'CREATE': '🆕 Crear',
      'UPDATE': '✏️ Actualizar',
      'DELETE': '🗑️ Eliminar',
      'READ': '👁️ Consultar'
    };
    return badges[action] || action;
  };

  const getEntityIcon = (entity) => {
    const icons = {
      'quejas': '📝',
      'entidades': '🏢',
      'comentarios': '💬'
    };
    return icons[entity] || '📄';
  };

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h1>📊 Historial de Auditoría</h1>
        <p className="subtitle">Sistema de registro con Apache Kafka</p>
      </div>

      {/* Consumer Status */}
      {consumerStats && (
        <div className="stats-grid" style={{ marginBottom: '20px' }}>
          <div className={`stat-card ${consumerStats.consumer.isRunning ? 'stat-success' : 'stat-danger'}`}>
            <div className="stat-icon">
              {consumerStats.consumer.isRunning ? '🟢' : '🔴'}
            </div>
            <div className="stat-content">
              <div className="stat-label">Consumer Kafka</div>
              <div className="stat-value">
                {consumerStats.consumer.isRunning ? 'Activo' : 'Inactivo'}
              </div>
            </div>
          </div>

          <div className="stat-card stat-info">
            <div className="stat-icon">📥</div>
            <div className="stat-content">
              <div className="stat-label">Registros Procesados</div>
              <div className="stat-value">
                {consumerStats.consumer.recordsProcessed.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="stat-card stat-info">
            <div className="stat-icon">💾</div>
            <div className="stat-content">
              <div className="stat-label">Total en BD</div>
              <div className="stat-value">
                {consumerStats.database.totalRecords.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="stat-card stat-success">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <div className="stat-label">Tasa de Éxito</div>
              <div className="stat-value">
                {consumerStats.consumer.successRate}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas Generales */}
      {stats && (
        <div className="stats-summary" style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <h3>📊 Estadísticas Generales</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' }}>
            <div>
              <strong>Total Registros:</strong> {stats.totalRegistros.toLocaleString()}
            </div>
            {stats.porTipoAccion.map(item => (
              <div key={item.tipo_accion}>
                <strong>{getActionBadge(item.tipo_accion)}:</strong> {item.count}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="filters" style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <select 
          value={filters.tipoAccion}
          onChange={(e) => setFilters({...filters, tipoAccion: e.target.value})}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        >
          <option value="">Todos los tipos</option>
          <option value="CREATE">🆕 Crear</option>
          <option value="UPDATE">✏️ Actualizar</option>
          <option value="DELETE">🗑️ Eliminar</option>
          <option value="READ">👁️ Consultar</option>
        </select>

        <select 
          value={filters.entidadAfectada}
          onChange={(e) => setFilters({...filters, entidadAfectada: e.target.value})}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        >
          <option value="">Todas las entidades</option>
          <option value="quejas">📝 Quejas</option>
          <option value="entidades">🏢 Entidades</option>
          <option value="comentarios">💬 Comentarios</option>
        </select>

        <select 
          value={filters.limit}
          onChange={(e) => setFilters({...filters, limit: parseInt(e.target.value)})}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        >
          <option value="10">10 registros</option>
          <option value="20">20 registros</option>
          <option value="50">50 registros</option>
          <option value="100">100 registros</option>
        </select>

        <button 
          onClick={fetchData}
          style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', backgroundColor: '#007bff', color: 'white', cursor: 'pointer' }}
        >
          🔄 Actualizar
        </button>
      </div>

      {error && (
        <div className="alert alert-error" style={{ padding: '15px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner"></div>
          <p>Cargando historial...</p>
        </div>
      ) : (
        <div className="reports-table-container">
          <table className="reports-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha/Hora</th>
                <th>Acción</th>
                <th>Entidad</th>
                <th>Registro #</th>
                <th>Usuario</th>
                <th>Detalles</th>
              </tr>
            </thead>
            <tbody>
              {historial.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                    No hay registros en el historial
                  </td>
                </tr>
              ) : (
                historial.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{formatDate(item.created_at)}</td>
                    <td>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '0.85em',
                        backgroundColor: item.tipo_accion === 'CREATE' ? '#d4edda' : 
                                       item.tipo_accion === 'UPDATE' ? '#fff3cd' : 
                                       item.tipo_accion === 'READ' ? '#d1ecf1' : '#f8d7da',
                        color: item.tipo_accion === 'CREATE' ? '#155724' : 
                               item.tipo_accion === 'UPDATE' ? '#856404' : 
                               item.tipo_accion === 'READ' ? '#0c5460' : '#721c24'
                      }}>
                        {getActionBadge(item.tipo_accion)}
                      </span>
                    </td>
                    <td>
                      {getEntityIcon(item.entidad_afectada)} {item.entidad_afectada}
                    </td>
                    <td>#{item.registro_id}</td>
                    <td>{item.usuario || 'Sistema'}</td>
                    <td>
                      <details>
                        <summary style={{ cursor: 'pointer', color: '#007bff' }}>
                          Ver datos
                        </summary>
                        <div style={{ marginTop: '10px', fontSize: '0.85em' }}>
                          {item.datos_anteriores && (
                            <div>
                              <strong>Antes:</strong>
                              <pre style={{ backgroundColor: '#f8f9fa', padding: '8px', borderRadius: '4px', fontSize: '0.9em' }}>
                                {typeof item.datos_anteriores === 'string' 
                                  ? JSON.stringify(JSON.parse(item.datos_anteriores), null, 2)
                                  : JSON.stringify(item.datos_anteriores, null, 2)}
                              </pre>
                            </div>
                          )}
                          {item.datos_nuevos && (
                            <div>
                              <strong>Después:</strong>
                              <pre style={{ backgroundColor: '#f8f9fa', padding: '8px', borderRadius: '4px', fontSize: '0.9em' }}>
                                {typeof item.datos_nuevos === 'string'
                                  ? JSON.stringify(JSON.parse(item.datos_nuevos), null, 2)
                                  : JSON.stringify(item.datos_nuevos, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </details>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AuditHistory;

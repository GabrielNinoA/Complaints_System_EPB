import React, { useState, useEffect, useCallback } from 'react';
import config from '../config/config';
import './AuditHistory.css';

const AuditHistory = () => {
  const [historial, setHistorial] = useState([]);
  const [stats, setStats] = useState(null);
  const [kafkaStats, setKafkaStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    tipoAccion: '',
    entidadAfectada: '',
    limit: 1000
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (filters.tipoAccion) params.append('tipoAccion', filters.tipoAccion);
      if (filters.entidadAfectada) params.append('entidadAfectada', filters.entidadAfectada);
      params.append('limit', filters.limit);

      const [historialRes, statsRes, kafkaStatsRes] = await Promise.all([
        fetch(`${config.API_URL}/api/historial?${params}`),
        fetch(`${config.API_URL}/api/historial/stats`),
        fetch(`${config.API_URL}/api/historial/kafka-stats`)
      ]);

      const [historialData, statsData, kafkaStatsData] = await Promise.all([
        historialRes.json(),
        statsRes.json(),
        kafkaStatsRes.json()
      ]);

      if (historialData.success) setHistorial(historialData.data);
      if (statsData.success) setStats(statsData.data);
      if (kafkaStatsData.success) setKafkaStats(kafkaStatsData.data);
      
      console.log('📊 Registros recibidos:', historialData.data?.length);
      console.log('📊 Total en stats:', statsData.data?.totalRegistros);
      console.log('📦 Kafka stats RAW:', kafkaStatsData);
      console.log('📦 Kafka stats data:', kafkaStatsData.data);
      console.log('📦 Pendientes value:', kafkaStatsData.data?.pendientes, 'Type:', typeof kafkaStatsData.data?.pendientes);
      
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
      fetchData();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [fetchData]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    
    return date.toLocaleString('es-CO', {
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

      {/* Estadísticas Generales */}
      {stats && (
        <div className="stats-summary">
          <h3>📊 Estadísticas Generales</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📦</div>
              <div className="stat-content">
                <div className="stat-label">Total Registros</div>
                <div className="stat-value">{stats.totalRegistros.toLocaleString()}</div>
              </div>
            </div>
            {stats.porTipoAccion.map(item => (
              <div key={item.tipo_accion} className="stat-card">
                <div className="stat-icon">{getActionBadge(item.tipo_accion).split(' ')[0]}</div>
                <div className="stat-content">
                  <div className="stat-label">{getActionBadge(item.tipo_accion)}</div>
                  <div className="stat-value">{item.count}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estadísticas de Kafka - Mensajes Pendientes */}
      {kafkaStats && (
        <div className="kafka-stats-section">
          <h3>📦 Estado de Mensajes Kafka</h3>
          <p className="kafka-subtitle">
            Monitoreo en tiempo real de mensajes del consumer service
          </p>
          
          {!kafkaStats.tableExists && (
            <div className="kafka-alert warning">
              <strong>⚠️ Tabla no encontrada:</strong> La tabla `kafka_mensajes_pendientes` no existe en la base de datos. 
              Por favor, ejecuta el script `History_consumer_service_EPB/kafka-messages-table.sql` para crearla.
            </div>
          )}
          
          <div className="kafka-stats-grid">
            <div className="kafka-stat-card total">
              <div className="kafka-stat-icon">📊</div>
              <div className="kafka-stat-content">
                <div className="kafka-stat-label">Total Mensajes</div>
                <div className="kafka-stat-value">{kafkaStats.total.toLocaleString()}</div>
              </div>
            </div>
            <div className="kafka-stat-card pending">
              <div className="kafka-stat-icon">⏳</div>
              <div className="kafka-stat-content">
                <div className="kafka-stat-label">Pendientes</div>
                <div className="kafka-stat-value">{kafkaStats.pendientes.toLocaleString()}</div>
                {kafkaStats.pendientes > 0 && (
                  <div className="kafka-stat-alert">
                    ⚠️ Consumer puede estar apagado
                  </div>
                )}
              </div>
            </div>
            <div className="kafka-stat-card processed">
              <div className="kafka-stat-icon">✅</div>
              <div className="kafka-stat-content">
                <div className="kafka-stat-label">Procesados</div>
                <div className="kafka-stat-value">{kafkaStats.procesados.toLocaleString()}</div>
              </div>
            </div>
            <div className="kafka-stat-card error">
              <div className="kafka-stat-icon">❌</div>
              <div className="kafka-stat-content">
                <div className="kafka-stat-label">Errores</div>
                <div className="kafka-stat-value">{kafkaStats.errores.toLocaleString()}</div>
                {kafkaStats.errores > 0 && (
                  <div className="kafka-stat-alert">
                    ⚠️ Revisar errores
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Información adicional */}
          {kafkaStats.tableExists && (
            <>
              <div className="kafka-info">
                {kafkaStats.tiempo_promedio_procesamiento && (
                  <div className="kafka-info-item">
                    <span className="info-label">⏱️ Tiempo promedio de procesamiento:</span>
                    <span className="info-value">{kafkaStats.tiempo_promedio_procesamiento}s</span>
                  </div>
                )}
                {kafkaStats.primer_mensaje && (
                  <div className="kafka-info-item">
                    <span className="info-label">🕐 Primer mensaje:</span>
                    <span className="info-value">{formatDate(kafkaStats.primer_mensaje)}</span>
                  </div>
                )}
                {kafkaStats.ultimo_mensaje && (
                  <div className="kafka-info-item">
                    <span className="info-label">🕐 Último mensaje:</span>
                    <span className="info-value">{formatDate(kafkaStats.ultimo_mensaje)}</span>
                  </div>
                )}
              </div>

              {/* Alertas de estado del consumer */}
              {kafkaStats.pendientes > 10 && (
                <div className="kafka-alert warning">
                  <strong>⚠️ Atención:</strong> Hay {kafkaStats.pendientes} mensajes pendientes. 
                  El History Consumer Service puede estar detenido. Los mensajes se procesarán cuando se reinicie el servicio.
                </div>
              )}
              {kafkaStats.errores > 5 && (
                <div className="kafka-alert error">
                  <strong>❌ Error:</strong> Se detectaron {kafkaStats.errores} mensajes con errores. 
                  Revise los logs del History Consumer Service para más detalles.
                </div>
              )}
              {kafkaStats.pendientes === 0 && kafkaStats.total > 0 && (
                <div className="kafka-alert success">
                  <strong>✅ Todo OK:</strong> Todos los mensajes han sido procesados correctamente.
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Filtros */}
      <div className="filters">
        <select 
          value={filters.tipoAccion}
          onChange={(e) => setFilters({...filters, tipoAccion: e.target.value})}
          className="filter-select"
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
          className="filter-select"
        >
          <option value="">Todas las entidades</option>
          <option value="quejas">📝 Quejas</option>
          <option value="entidades">🏢 Entidades</option>
          <option value="comentarios">💬 Comentarios</option>
        </select>

        <select 
          value={filters.limit}
          onChange={(e) => setFilters({...filters, limit: parseInt(e.target.value)})}
          className="filter-select"
        >
          <option value="20">20 registros</option>
          <option value="50">50 registros</option>
          <option value="100">100 registros</option>
          <option value="200">200 registros</option>
          <option value="500">500 registros</option>
          <option value="1000">1000 registros</option>
        </select>

        <button 
          onClick={fetchData}
          className="filter-button"
        >
          🔄 Actualizar
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading-container">
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
                  <td colSpan="7" className="no-data">
                    No hay registros en el historial
                  </td>
                </tr>
              ) : (
                historial.map((item) => {
                  try {
                    return (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td>{formatDate(item.created_at)}</td>
                        <td>
                          <span className={`badge badge-${item.tipo_accion.toLowerCase()}`}>
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
                            <summary className="details-summary">
                              Ver datos
                            </summary>
                            <div className="details-content">
                              {item.datos_anteriores && (
                                <div className="data-block">
                                  <strong>Antes:</strong>
                                  <pre>
                                    {typeof item.datos_anteriores === 'string' 
                                      ? JSON.stringify(JSON.parse(item.datos_anteriores), null, 2)
                                      : JSON.stringify(item.datos_anteriores, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {item.datos_nuevos && (
                                <div className="data-block">
                                  <strong>Después:</strong>
                                  <pre>
                                    {typeof item.datos_nuevos === 'string'
                                      ? JSON.stringify(JSON.parse(item.datos_nuevos), null, 2)
                                      : JSON.stringify(item.datos_nuevos, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {item.ip_address && (
                                <div className="meta-info">
                                  <strong>IP:</strong> {item.ip_address}
                                </div>
                              )}
                            </div>
                          </details>
                        </td>
                      </tr>
                    );
                  } catch (err) {
                    console.error('Error renderizando registro:', item.id, err);
                    return null;
                  }
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AuditHistory;

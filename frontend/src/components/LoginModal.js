import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const LoginModal = ({ onClose }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validaciones básicas
        if (!username.trim() || !password.trim()) {
            setError('Por favor complete todos los campos');
            return;
        }

        if (username.trim().length < 3) {
            setError('El nombre de usuario debe tener al menos 3 caracteres');
            return;
        }

        if (password.length < 4) {
            setError('La contraseña debe tener al menos 4 caracteres');
            return;
        }

        setLoading(true);

        try {
            const result = await login(username.trim(), password);
            
            if (result.success) {
                onClose();
            } else {
                setError(result.message || 'Credenciales inválidas');
            }
        } catch (err) {
            setError('Error al iniciar sesión. Intente nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleOverlayClick = (e) => {
        if (e.target.className === 'login-modal-overlay') {
            onClose();
        }
    };

    return (
        <div className="login-modal-overlay" onClick={handleOverlayClick}>
            <div className="login-modal">
                <button className="login-modal-close" onClick={onClose}>
                    ×
                </button>
                
                <h2 className="login-modal-title">Iniciar Sesión</h2>
                <p className="login-modal-subtitle">Administrador</p>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="login-form-group">
                        <label htmlFor="username">NOMBRE DE USUARIO</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Ingrese su usuario"
                            disabled={loading}
                            autoFocus
                        />
                    </div>

                    <div className="login-form-group">
                        <label htmlFor="password">CONTRASEÑA</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Ingrese su contraseña"
                            disabled={loading}
                        />
                    </div>

                    {error && (
                        <div className="login-error">
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        className="login-submit-btn"
                        disabled={loading}
                    >
                        {loading ? 'Ingresando...' : 'INGRESAR'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginModal;
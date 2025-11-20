import React, { useState, useEffect } from 'react';
import './addClientModal.css'; // Usamos el mismo CSS para el estilo del modal

const API_CHANGE_PASSWORD_URL = 'https://www.mecaofi.com/LibroVisitas/back/public/api/comerciales'; 

export default function ChangePasswordModal({ show, onClose, comercialId, comercialName }) {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (show) {
            setNewPassword('');
            setConfirmPassword('');
            setError(null);
            setSuccess(null);
            setSubmitting(false);
        }
    }, [show, comercialId]);

    if (!show) {
        return null;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (newPassword.length < 6) {
            setError("La nueva contraseña debe tener al menos 6 caracteres.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        setSubmitting(true);
        const token = localStorage.getItem('token');
        
        try {
            const response = await fetch(`${API_CHANGE_PASSWORD_URL}/${comercialId}/password`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ newPassword }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || `Error ${response.status}: No se pudo cambiar la contraseña.`);
            }

            setSuccess(`¡Contraseña de ${comercialName} cambiada con éxito!`);
            setSubmitting(false);
            
            // Cerrar el modal después de un breve tiempo
            setTimeout(() => {
                onClose();
            }, 1500);

        } catch (e) {
            console.error("Error al cambiar la contraseña:", e);
            setError(e.message || "Error desconocido al intentar cambiar la contraseña.");
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                <div className="modal-header">
                    <h2>Cambiar Contraseña</h2>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>

                <h4>Comercial: **{comercialName}**</h4>
                
                {success && <p className="success-message-modal" style={{ color: 'green', fontWeight: 'bold' }}>{success}</p>}
                {error && <p className="error-message-modal">{error}</p>}
                
                {!success && (
                    <form onSubmit={handleSubmit}>
                        <div className="form-group required">
                            <label htmlFor="newPassword">Nueva Contraseña (mín. 6 chars):</label>
                            <input
                                type="password"
                                id="newPassword"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength="6"
                                disabled={submitting}
                            />
                        </div>
                        <div className="form-group required">
                            <label htmlFor="confirmPassword">Confirmar Contraseña:</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                disabled={submitting}
                            />
                        </div>

                        <button type="submit" className="submit-button" disabled={submitting}>
                            {submitting ? 'Cambiando...' : 'Guardar Nueva Contraseña'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
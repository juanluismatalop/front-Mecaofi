import React, { useState, useEffect } from 'react';
import './addClientModal.css';

const ADMIN_ID = 10;
const REGISTER_API_URL = 'http://localhost:3000/api/comercial/register';

export default function AddComercialModal ({ show, onClose, onComercialAdded }){
    const loggedInComercialId = parseInt(localStorage.getItem('comercialId'), 10);
    const isAdmin = loggedInComercialId === ADMIN_ID;

    const initialFormData = {
        Comercial: '', 
        Pass: '', 
        Correo: '', 
    };

    const [formData, setFormData] = useState(initialFormData);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // --- Efecto para resetear el estado y evitar renderizar si no es Admin ---
    useEffect(() => {
        if (show) {
            // Si el modal se muestra, resetear todo
            setFormData(initialFormData);
            setError(null);
            setSuccessMessage(null);
        }
        
        // Cierra el modal automáticamente después de 2 segundos si hay éxito
        if (successMessage) {
            const timer = setTimeout(() => {
                // Notifica al padre (si existe) y luego cierra el modal
                if (onComercialAdded) {
                    onComercialAdded();
                }
                onClose();
            }, 2000); 

            return () => clearTimeout(timer); // Limpiar el timer si el componente se desmonta
        }

    }, [show, successMessage, onClose, onComercialAdded]);

    if (!show || !isAdmin) {
        return null; // No renderiza si no debe mostrarse o si no es administrador
    }

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError(null);
        setSuccessMessage(null); // Limpiar mensajes al empezar a escribir de nuevo
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setSuccessMessage(null);
        
        // Validación de campos simples
        if (!formData.Comercial.trim() || !formData.Pass.trim() || !formData.Correo.trim()) {
            setError("Todos los campos son obligatorios.");
            setSubmitting(false);
            return;
        }

        const token = localStorage.getItem('token'); 
        
        try {
            const response = await fetch(REGISTER_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Incluir el token de autenticación
                    'Authorization': `Bearer ${token}`, 
                },
                body: JSON.stringify(formData), 
            });

            // Leer el cuerpo de la respuesta ANTES de verificar response.ok
            // Esto es crucial para poder leer mensajes de error del servidor (4xx, 5xx)
            const responseData = await response.json(); 

            if (!response.ok) {
                // Si response.ok es false, lanza un error con el mensaje del servidor
                throw new Error(responseData.message || `Error ${response.status}: El servidor rechazó la solicitud.`);
            }

            // Éxito:
            setSuccessMessage(responseData.message || "Comercial registrado exitosamente. Cerrando...");
            // El useEffect se encargará de llamar a onComercialAdded() y onClose() después de 2 segundos.
            
        } catch (e) {
            console.error("Error al crear comercial:", e);
            // Mostrar el error capturado (ya sea de la red o lanzado arriba)
            setError(e.message); 
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Registrar Nuevo Comercial</h2>
                    <button className="boton2" onClick={onClose} disabled={submitting}>&times;</button>
                </div>
                
                <form onSubmit={handleSubmit}>
                    
                    {/* Campos de formulario */}
                    <div className="form-group">
                        <label htmlFor="Comercial">Nombre de Usuario*</label>
                        <input 
                            type="text" 
                            id="Comercial" 
                            name="Comercial" 
                            value={formData.Comercial} 
                            onChange={handleChange} 
                            required 
                            disabled={submitting}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="Correo">Correo Electrónico*</label>
                        <input 
                            type="email" 
                            id="Correo" 
                            name="Correo" 
                            value={formData.Correo} 
                            onChange={handleChange} 
                            required 
                            disabled={submitting}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="Pass">Contraseña*</label>
                        <input 
                            type="password" 
                            id="Pass" 
                            name="Pass" 
                            value={formData.Pass} 
                            onChange={handleChange} 
                            required 
                            disabled={submitting}
                        />
                    </div>
                    
                    {/* Mensajes de feedback */}
                    {error && <p className="error-message-modal">{error}</p>}
                    {successMessage && <p className="success-message-modal">{successMessage}</p>}
                    
                    {/* Acciones */}
                    <div className="modal-actions">
                        <button type="submit" className='boton2' disabled={submitting} style={{ backgroundColor: '#28a745' }}>
                            {submitting ? 'Registrando...' : 'Registrar Comercial'}
                        </button>
                        <button type="button" className="boton2" onClick={onClose} disabled={submitting}>
                            Cerrar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
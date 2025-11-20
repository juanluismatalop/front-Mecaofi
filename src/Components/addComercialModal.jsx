import React, { useState, useEffect, useMemo } from 'react';
import './addClientModal.css';

const ADMIN_ID = 10;
const REGISTER_API_URL = 'https://www.mecaofi.com/LibroVisitas/back/public/api/comerciales/register';

export default function AddComercialModal ({ show, onClose, onComercialAdded }){
    const loggedInComercialId = parseInt(localStorage.getItem('comercialId'), 10);
    const isAdmin = loggedInComercialId === ADMIN_ID;

    const initialFormData = useMemo(() => ({
        Comercial: '', 
        Pass: '', 
        Correo: '', 
    }), []); 

    const [formData, setFormData] = useState(initialFormData);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [newComercial, setNewComercial] = useState(null); // Estado para el nuevo comercial

    // Efecto 1: Resetear el formulario cuando el modal se abre
    useEffect(() => {
        if (show) {
            setFormData(initialFormData);
            setError(null);
            setSuccessMessage(null);
            setNewComercial(null);
        }
    }, [show, initialFormData]);

    // Efecto 2: Manejar el cierre automático y notificar al padre al tener éxito
    useEffect(() => {
        if (successMessage && newComercial) {
            const timer = setTimeout(() => {
                // Pasa el objeto del nuevo comercial al padre para actualización local
                if (onComercialAdded) {
                    onComercialAdded(newComercial);
                }
                onClose();
            }, 2000); 

            return () => clearTimeout(timer);
        }
    }, [successMessage, onClose, onComercialAdded, newComercial]);

    if (!show || !isAdmin) {
        return null;
    }

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        // Limpiamos mensajes al escribir para permitir la edición
        if (error) setError(null);
        if (successMessage) setSuccessMessage(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setSuccessMessage(null);
        
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
                    'Authorization': `Bearer ${token}`, 
                },
                body: JSON.stringify(formData), 
            });

            const responseData = await response.json(); 

            if (!response.ok) {
                throw new Error(responseData.message || `Error ${response.status}: El servidor rechazó la solicitud.`);
            }

            // Éxito:
            setNewComercial(responseData); // Guarda el objeto devuelto por la API
            setSuccessMessage(responseData.message || "Comercial registrado exitosamente. Cerrando...");
            
        } catch (e) {
            console.error("Error al crear comercial:", e);
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
                    
                    {error && <p className="error-message-modal">{error}</p>}
                    {successMessage && <p className="success-message-modal">{successMessage}</p>}
                    
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
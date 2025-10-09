import React, { useState, useEffect } from 'react';
// Reutilizamos el mismo CSS, o puedes crear uno específico si lo necesitas
import './addClientModal.css'; 

const ADMIN_ID = 10;
const REGISTER_API_URL = 'http://localhost:3000/api/auth/register'; 
// Asumiendo que la ruta de registro es /api/auth/register, ajusta si es necesario

export default function AddComercialModal ({ show, onClose, onComercialAdded }){
    // Verifica si el usuario actual es el administrador (ID 10)
    const loggedInComercialId = parseInt(localStorage.getItem('comercialId'), 10);
    const isAdmin = loggedInComercialId === ADMIN_ID;

    // Estado inicial del formulario para un nuevo comercial
    const initialFormData = {
        Comercial: '', // Nombre de usuario
        Pass: '',      // Contraseña (Usando 'Pass' como en tu backend)
        Correo: '',    // Correo electrónico
    };

    const [formData, setFormData] = useState(initialFormData);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // Reinicia el formulario y los mensajes al abrir el modal
    useEffect(() => {
        if (show) {
            setFormData(initialFormData);
            setError(null);
            setSuccessMessage(null);
        }
    }, [show]);

    // No renderiza el modal si 'show' es falso o si no es administrador
    if (!show || !isAdmin) {
        return null;
    }

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        // Limpia los mensajes al empezar a escribir
        setError(null);
        setSuccessMessage(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setSuccessMessage(null);

        // Validaciones básicas en el frontend
        if (!formData.Comercial || !formData.Pass || !formData.Correo) {
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
                    // Incluir el token de autenticación del administrador para el control de acceso
                    'Authorization': `Bearer ${token}`, 
                },
                body: JSON.stringify(formData), 
            });

            const responseData = await response.json();

            if (!response.ok) {
                // El backend maneja errores 409 (Duplicado) y 400 (Falta campo)
                throw new Error(responseData.message || `Error ${response.status}: No se pudo registrar al comercial.`);
            }

            // Éxito
            setSuccessMessage(responseData.message || "Comercial registrado exitosamente.");
            
            // Opcionalmente, llama a la función de callback si existe
            if (onComercialAdded) {
                onComercialAdded();
            }
            
            // Podrías cerrar el modal inmediatamente o dejarlo abierto para ver el mensaje de éxito
            // onClose(); 
            setFormData(initialFormData); // Limpia el formulario tras el éxito
            
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
                        />
                    </div>
                    
                    {error && <p className="error-message-modal">{error}</p>}
                    {successMessage && <p className="success-message-modal">{successMessage}</p>}
                    
                    <div className="modal-actions">
                        <button type="submit" className='boton2' disabled={submitting}>
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
};
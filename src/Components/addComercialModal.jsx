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

    useEffect(() => {
        if (show) {
            setFormData(initialFormData);
            setError(null);
            setSuccessMessage(null);
        }
    }, [show]);

    if (!show || !isAdmin) {
        return null;
    }

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError(null);
        setSuccessMessage(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setSuccessMessage(null);

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
                    'Authorization': `Bearer ${token}`, 
                },
                body: JSON.stringify(formData), 
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.message || `Error ${response.status}: No se pudo registrar al comercial.`);
            }

            setSuccessMessage(responseData.message || "Comercial registrado exitosamente.");
            
            if (onComercialAdded) {
                onComercialAdded();
            }
             
            setFormData(initialFormData); 
            
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
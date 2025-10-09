import React, { useState, useEffect } from 'react'; 
import './addClientModal.css'

const ADMIN_ID = 10;
const COMERCIALES_API_URL = 'http://localhost:3000/api/comerciales'; 

export default function AddClientModal ({ show, onClose, onClientAdded }){
        const loggedInComercialId = parseInt(localStorage.getItem('comercialId'), 10);
        const isAdmin = loggedInComercialId === ADMIN_ID;

        const [comercialesList, setComercialesList] = useState([]);

        const initialFormData = {
        Nombre: '',
                PersonaContacto: '',
                Telefono: '', 
                Telefono2: '', 
                Correo: '', 
                Correo2: '', 
                Direccion: '',
                Ciudad: '',
                Provincia: '',
                IdComercial: isAdmin ? '' : loggedInComercialId, 
        };

        const [formData, setFormData] = useState(initialFormData);
    
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!show || !isAdmin) return;

        const fetchComerciales = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                const response = await fetch(COMERCIALES_API_URL, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                if (!response.ok) {
                    throw new Error("No se pudo cargar la lista de comerciales.");
                }

                const data = await response.json();
                setComercialesList(data);
                
            } catch (e) {
                console.error("Error al obtener comerciales:", e);
                setError("Error al cargar la lista de comerciales.");
            }
        };

        fetchComerciales();
    }, [show, isAdmin]);


    useEffect(() => {
        if (show) {
            setFormData(initialFormData);
            setError(null);
        }
    }, [show]);


    if (!show) {
        return null;
    }

    const handleChange = (e) => {
        let value = e.target.value;
        
        if (e.target.name === 'IdComercial' || e.target.name === 'Telefono' || e.target.name === 'Telefono2') {
            value = value ? parseInt(value, 10) : ''; 
        }
        
        setFormData({
            ...formData,
            [e.target.name]: value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        
        if (isAdmin && !formData.IdComercial) {
             setError("Como Administrador, debe asignar el cliente a un comercial.");
             setSubmitting(false);
             return;
        }

        const token = localStorage.getItem('token'); 
        
        const dataToSend = { ...formData };
        if (dataToSend.Telefono2 === '') dataToSend.Telefono2 = null;
        if (dataToSend.Correo2 === '') dataToSend.Correo2 = null;

        try {
            const response = await fetch('http://localhost:3000/api/clientes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, 
                },
                body: JSON.stringify(dataToSend), 
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error ${response.status}: No se pudo añadir el cliente.`);
            }

            onClientAdded(); 
            onClose(); 

        } catch (e) {
            console.error("Error al crear cliente:", e);
            setError(e.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Añadir Nuevo Cliente</h2>
                    <button className="boton2" onClick={onClose}>&times;</button>
                </div>
                
                <form onSubmit={handleSubmit}>
                    {isAdmin && (
                        <div className="form-group">
                            <label htmlFor="IdComercial">Asignar Comercial*</label>
                            <select 
                                id="IdComercial" 
                                name="IdComercial" 
                                value={formData.IdComercial || ''} 
                                onChange={handleChange} 
                                required
                                disabled={submitting} 
                            >
                                <option value="" disabled>Seleccione un Comercial</option>
                                {comercialesList.map(comercial => (
                                    <option key={comercial.Id} value={comercial.Id}>
                                        {comercial.Comercial} ({comercial.Id})
                                    </option>
                                ))}
                            </select>
                            {comercialesList.length === 0 && !error && <p>Cargando comerciales...</p>}
                        </div>
                    )}
                                        
                    <div className="form-group">
                        <label htmlFor="Nombre">Nombre Comercial*</label>
                        <input type="text" id="Nombre" name="Nombre" value={formData.Nombre} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="PersonaContacto">Persona de Contacto</label>
                        <input type="text" id="PersonaContacto" name="PersonaContacto" value={formData.PersonaContacto} onChange={handleChange} />
                    </div>
                    
                    <div className="form-group-row">
                        <div className="form-group">
                            <label htmlFor="Telefono">Teléfono Principal*</label>
                            <input type="number" id="Telefono" name="Telefono" value={formData.Telefono} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="Telefono2">Teléfono Secundario</label>
                            <input type="number" id="Telefono2" name="Telefono2" value={formData.Telefono2} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="form-group-row">
                        <div className="form-group">
                            <label htmlFor="Correo">Correo Principal*</label>
                            <input type="email" id="Correo" name="Correo" value={formData.Correo} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="Correo2">Correo Secundario</label>
                            <input type="email" id="Correo2" name="Correo2" value={formData.Correo2} onChange={handleChange} />
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="Direccion">Dirección</label>
                        <input type="text" id="Direccion" name="Direccion" value={formData.Direccion} onChange={handleChange} />
                    </div>
                    
                    <div className="form-group-row">
                        <div className="form-group">
                            <label htmlFor="Ciudad">Ciudad</label>
                            <input type="text" id="Ciudad" name="Ciudad" value={formData.Ciudad} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="Provincia">Provincia</label>
                            <input type="text" id="Provincia" name="Provincia" value={formData.Provincia} onChange={handleChange} />
                        </div>
                    </div>
                    
                    {error && <p className="error-message-modal">{error}</p>}
                    
                    <div className="modal-actions">
                        <button type="submit" className='boton2' disabled={submitting}>
                            {submitting ? 'Añadiendo...' : 'Guardar Cliente'}
                        </button>
                        <button type="button" className="boton2" onClick={onClose} disabled={submitting}>
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
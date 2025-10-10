import React, { useState, useEffect } from 'react'; 
import './addClientModal.css';

const ADMIN_ID = 10; 
const CLIENTES_API_URL = 'http://localhost:3000/api/clientes';
const COMERCIALES_API_URL = 'http://localhost:3000/api/comercial'; 

export default function AddClientModal ({ show, onClose, onClientAdded }){
        
    const loggedInComercialId = parseInt(localStorage.getItem('comercialId'), 10);
    const isAdmin = loggedInComercialId === ADMIN_ID;

    const [comercialesList, setComercialesList] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    
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


    // LÓGICA DE CARGA DE COMERCIALES
    useEffect(() => {
        if (!show || !isAdmin) {
            setComercialesList([]);
            setError(null);
            return;
        }

        const fetchComerciales = async () => {
            const token = localStorage.getItem('token');
            setError(null);

            if (!token) {
                 setError("No hay token de autenticación. Inicie sesión de nuevo.");
                 return;
            }

            try {
                // 🚨 CORRECCIÓN CLAVE: Se añade el header de Authorization con el token.
                const response = await fetch(COMERCIALES_API_URL, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error("Error API de Comerciales:", response.status, errorText); 
                    throw new Error(`Fallo al obtener la lista de comerciales (Código ${response.status}). Ver consola.`);
                }

                const data = await response.json();
                setComercialesList(data);
                
                if (data.length === 1 && isAdmin) {
                    setFormData(prev => ({ ...prev, IdComercial: '' }));
                } else if (data.length > 0 && !isAdmin) {
                    setFormData(prev => ({ ...prev, IdComercial: loggedInComercialId }));
                }
                
            } catch (e) {
                console.error("Error al obtener comerciales:", e);
                setError(e.message || "Error al cargar la lista de comerciales.");
            }
        };

        fetchComerciales();
    }, [show, isAdmin, loggedInComercialId]);

    // Lógica para limpiar el formulario al cerrar/abrir
    useEffect(() => {
        if (show) {
            setFormData(initialFormData); 
            setError(null);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show]); 


    // MANEJO DE FORMULARIO
    const handleChange = (e) => {
        const { name, value } = e.target;
        const finalValue = name === 'IdComercial' ? (value === '' ? '' : parseInt(value, 10)) : value;
        
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        const token = localStorage.getItem('token');

        if (!formData.IdComercial || formData.IdComercial === '') {
            setError("Debe asignar un comercial.");
            setSubmitting(false);
            return;
        }
        
        const clientData = {
            Nombre: formData.Nombre,
            PersonaContacto: formData.PersonaContacto,
            Telefono: formData.Telefono, 
            Telefono2: formData.Telefono2, 
            Correo: formData.Correo, 
            Correo2: formData.Correo2, 
            Direccion: formData.Direccion,
            Ciudad: formData.Ciudad,
            Provincia: formData.Provincia,
            IdComercial: formData.IdComercial,
        };

        try {
            const response = await fetch(CLIENTES_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(clientData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Fallo al crear el cliente. Verifique los datos.");
            }

            const newClient = await response.json();

            if (onClientAdded) {
                onClientAdded(newClient); 
            }

            onClose(); 
            setFormData(initialFormData); 
            
        } catch (err) {
            console.error("Error al crear cliente:", err);
            setError(err.message || "Error de red al intentar registrar.");
        } finally {
            setSubmitting(false);
        }
    };
    
    if (!show) {
        return null;
    }

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Añadir Nuevo Cliente</h2>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>
                
                {error && <p className="error-message-modal">{error}</p>}
                
                <form onSubmit={handleSubmit}>
                    
                    <div className="form-group-row">
                        <div className="form-group required">
                            <label htmlFor="Nombre">Nombre del Cliente (Empresa)</label>
                            <input 
                                type="text" 
                                id="Nombre" 
                                name="Nombre" 
                                value={formData.Nombre} 
                                onChange={handleChange} 
                                required
                            />
                        </div>
                        
                        {/* SELECTOR DE COMERCIALES (Solo visible para Admin) */}
                        {isAdmin && (
                            <div className="form-group required">
                                <label htmlFor="IdComercial">Asignar Comercial</label>
                                <select 
                                    id="IdComercial" 
                                    name="IdComercial" 
                                    value={formData.IdComercial} 
                                    onChange={handleChange} 
                                    required
                                    disabled={comercialesList.length === 0}
                                >
                                    <option value="">-- Seleccione Comercial --</option>
                                    {comercialesList.map(comercial => (
                                        <option 
                                            key={comercial.Id} 
                                            value={comercial.Id}
                                        >
                                            {comercial.Nombre}
                                        </option>
                                    ))}
                                </select>
                                {comercialesList.length === 0 && !error && <small>Cargando lista de comerciales...</small>}
                            </div>
                        )}
                        
                    </div>

                    <div className="form-group required">
                        <label htmlFor="PersonaContacto">Persona de Contacto</label>
                        <input type="text" id="PersonaContacto" name="PersonaContacto" value={formData.PersonaContacto} onChange={handleChange} required />
                    </div>

                    <div className="form-group-row">
                        <div className="form-group required">
                            <label htmlFor="Telefono">Teléfono Principal</label>
                            <input type="tel" id="Telefono" name="Telefono" value={formData.Telefono} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="Telefono2">Teléfono Secundario</label>
                            <input type="tel" id="Telefono2" name="Telefono2" value={formData.Telefono2} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="form-group-row">
                        <div className="form-group required">
                            <label htmlFor="Correo">Correo Principal</label>
                            <input type="email" id="Correo" name="Correo" value={formData.Correo} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="Correo2">Correo Secundario</label>
                            <input type="email" id="Correo2" name="Correo2" value={formData.Correo2} onChange={handleChange} />
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="Direccion">Dirección Completa</label>
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
                    
                    <button type="submit" className="submit-button" disabled={submitting}>
                        {submitting ? 'Guardando Cliente...' : 'Registrar Cliente'}
                    </button>
                    
                </form>
            </div>
        </div>
    );
}
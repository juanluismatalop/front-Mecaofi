import React, { useState, useEffect } from 'react';
import './addClientModal.css';

const ADMIN_ID = 10;
const CLIENTES_API_URL = 'https://www.mecaofi.com/LibroVisitas/back/public/api/clientes';
const COMERCIALES_API_URL = 'https://www.mecaofi.com/LibroVisitas/back/public/api/comerciales';

const isValidEmail = (email) => {
    if (!email) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
    return emailRegex.test(email);
};

export default function AddClientModal({ show, onClose, onClientAdded }) {

    const rawComercialId = localStorage.getItem('comercialId');
    const loggedInComercialId = parseInt(rawComercialId, 10) || 0;
    const isAdmin = loggedInComercialId === ADMIN_ID;

    const [comercialesList, setComercialesList] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // 🟢 CAMBIO AQUI: Ahora initialFormData depende de isAdmin y loggedInComercialId, por lo que es mejor definir una función
    const createInitialFormData = (isAdmin, loggedInComercialId) => ({
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
    });
    
    // Inicializa el estado con la función
    const [formData, setFormData] = useState(() => createInitialFormData(isAdmin, loggedInComercialId));
    
    // Función para resetear el formulario que usaremos en varios sitios
    const resetForm = () => {
        const newInitialData = createInitialFormData(isAdmin, loggedInComercialId);
        setFormData(newInitialData);
    };

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
                const response = await fetch(COMERCIALES_API_URL, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error("Error API de Comerciales:", response.status, errorText);
                    throw new Error(`Fallo al obtener la lista de comerciales (Código ${response.status}). Por favor, vuelve a iniciar sesión.`);
                }

                const data = await response.json();
                setComercialesList(data);

                if (isAdmin && data.length === 1) {
                    setFormData(prev => ({ ...prev, IdComercial: data[0].Id }));
                }

            } catch (e) {
                console.error("Error al obtener comerciales:", e);
                setError(e.message || "Error al cargar la lista de comerciales.");
            }
        };

        fetchComerciales();
    }, [show, isAdmin, loggedInComercialId]);

    useEffect(() => {
        if (show) {
            // 🟢 CAMBIO AQUI: Usar la función de reset
            resetForm();
            setError(null);
        }
    }, [show]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        let finalValue = value;

        if (name === 'Telefono' || name === 'Telefono2') {
            const numericValue = value.replace(/[^0-9]/g, '');
            finalValue = numericValue.slice(0, 9);
        }

        if (name === 'IdComercial') {
            finalValue = value === '' ? '' : parseInt(value, 10);
        }

        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        const token = localStorage.getItem('token');

        // ... (Validaciones del frontend - Sin cambios) ...
        if (!formData.IdComercial || formData.IdComercial === '') {
            setError("Debe asignar un comercial.");
            setSubmitting(false);
            return;
        }

        if (formData.Telefono.length !== 9) {
            setError("El Teléfono Principal debe tener exactamente 9 dígitos.");
            setSubmitting(false);
            return;
        }
        if (formData.Telefono2 && formData.Telefono2.length > 0 && formData.Telefono2.length !== 9) {
            setError("El Teléfono Secundario debe tener 9 dígitos o estar vacío.");
            setSubmitting(false);
            return;
        }

        if (formData.Correo && !isValidEmail(formData.Correo)) {
            setError("El Correo Principal no tiene un formato válido.");
            setSubmitting(false);
            return;
        }
        if (formData.Correo2 && formData.Correo2.length > 0 && !isValidEmail(formData.Correo2)) {
            setError("El Correo Secundario no tiene un formato válido.");
            setSubmitting(false);
            return;
        }
        // ... (Fin de validaciones) ...

        const clientData = {
            Nombre: formData.Nombre.trim(),
            PersonaContacto: formData.PersonaContacto.trim(),
            Telefono: formData.Telefono,
            Telefono2: formData.Telefono2 || null,
            Correo: formData.Correo.trim() ? formData.Correo.trim() : null,
            Correo2: formData.Correo2.trim() ? formData.Correo2.trim() : null,
            Direccion: formData.Direccion.trim() || null,
            Ciudad: formData.Ciudad.trim() || null,
            Provincia: formData.Provincia.trim() || null,
            IdComercial: formData.IdComercial,
        };

        console.log("📤 Enviando datos al servidor:", clientData);

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
                let errorMessage = "Fallo al crear el cliente. Verifique los datos.";

                try {
                    const errorData = await response.json();
                    console.error("🔴 Error del servidor:", errorData);

                    if (response.status === 422 && errorData.errors) {
                        const backendErrors = Object.values(errorData.errors).flat().join(', ');
                        errorMessage = `Errores de validación: ${backendErrors}`;
                    } else if (errorData.message) {
                        errorMessage = errorData.message;
                    }
                } catch (parseError) {
                    const errorText = await response.text();
                    console.error("Error al parsear respuesta:", errorText);
                    errorMessage = `Error ${response.status}: ${response.statusText}`;
                }

                throw new Error(errorMessage);
            }

            const newClient = await response.json();
            console.log("✅ Cliente creado exitosamente:", newClient);

            if (onClientAdded) {
                onClientAdded(newClient);
            }

            // 🟢 CAMBIO AQUI:
            // 1. Resetear el formulario a su estado inicial para el siguiente cliente.
            resetForm();
            // 2. Comentamos o eliminamos la línea `onClose()` para que el modal permanezca abierto.
            // onClose(); // <-- Eliminado o comentado para que el modal NO se cierre

        } catch (err) {
            console.error("❌ Error al crear cliente:", err);
            setError(err.message || "Error de red al intentar registrar.");
        } finally {
            setSubmitting(false);
        }
    };

    // ... (El resto de la función y el JSX permanecen iguales) ...
    const debugData = () => {
        const clientData = {
            Nombre: formData.Nombre.trim(),
            PersonaContacto: formData.PersonaContacto.trim(),
            Telefono: formData.Telefono,
            Telefono2: formData.Telefono2 || null,
            Correo: formData.Correo.trim() ? formData.Correo.trim() : null,
            Correo2: formData.Correo2.trim() ? formData.Correo2.trim() : null,
            Direccion: formData.Direccion.trim() || null,
            Ciudad: formData.Ciudad.trim() || null,
            Provincia: formData.Provincia.trim() || null,
            IdComercial: formData.IdComercial,
        };
        console.log("🔍 Datos a enviar (debug):", clientData);

        // Mostrar información útil en el alert
        const emailInfo = clientData.Correo === null ?
            "✅ Correo: null (Backend generará automáticamente)" :
            `📧 Correo: ${clientData.Correo} (Usuario proporcionado)`;

        alert(`Datos a enviar:\n${emailInfo}\n\nRevisa la consola para más detalles.`);
    };

    if (!show) {
        return null;
    }

    return (
        <div className="modal-backdrop">
            <div className="modal-content" onClick={e => e.stopPropagation()}>

                <div className="modal-header">
                    <h2>Añadir Nuevo Cliente</h2>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body-scrollable">

                    {error && (
                        <div className="error-message-modal">
                            <strong>Error:</strong> {error}
                            <br />
                            <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
                                Verifique que todos los campos requeridos estén completos y en el formato correcto.
                            </small>
                        </div>
                    )}

                    {process.env.NODE_ENV === 'development' && (
                        <button
                            type="button"
                            onClick={debugData}
                            style={{
                                backgroundColor: '#ff9800',
                                color: 'white',
                                padding: '5px 10px',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                marginBottom: '10px',
                                cursor: 'pointer'
                            }}
                        >
                            🔍 Ver Datos a Enviar
                        </button>
                    )}

                    <form onSubmit={handleSubmit}>

                        <div className="form-group-row">
                            <div className="form-group required">
                                <label htmlFor="Nombre">Nombre del Cliente (Empresa) *</label>
                                <input
                                    type="text"
                                    id="Nombre"
                                    name="Nombre"
                                    value={formData.Nombre}
                                    onChange={handleChange}
                                    required
                                    placeholder="Ingrese el nombre de la empresa"
                                />
                            </div>

                            {isAdmin && (
                                <div className="form-group required">
                                    <label htmlFor="IdComercial">Asignar Comercial *</label>
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
                            <label htmlFor="PersonaContacto">Persona de Contacto *</label>
                            <input
                                type="text"
                                id="PersonaContacto"
                                name="PersonaContacto"
                                value={formData.PersonaContacto}
                                onChange={handleChange}
                                required
                                placeholder="Nombre de la persona de contacto"
                            />
                        </div>

                        <div className="form-group-row">
                            <div className={`form-group required ${formData.Telefono.length > 0 && formData.Telefono.length !== 9 ? 'has-error' : ''}`}>
                                <label htmlFor="Telefono">Teléfono Principal *</label>
                                <input
                                    type="tel"
                                    id="Telefono"
                                    name="Telefono"
                                    value={formData.Telefono}
                                    onChange={handleChange}
                                    required
                                    maxLength={9}
                                    pattern="\d{9}"
                                    inputMode="numeric"
                                    placeholder="123456789"
                                />
                                {formData.Telefono.length > 0 && formData.Telefono.length !== 9 && (
                                    <small className="input-error-tip">Debe tener exactamente 9 dígitos.</small>
                                )}
                            </div>
                            <div className={`form-group ${formData.Telefono2.length > 0 && formData.Telefono2.length !== 9 ? 'has-error' : ''}`}>
                                <label htmlFor="Telefono2">Teléfono Secundario</label>
                                <input
                                    type="tel"
                                    id="Telefono2"
                                    name="Telefono2"
                                    value={formData.Telefono2}
                                    onChange={handleChange}
                                    maxLength={9}
                                    pattern="\d{9}"
                                    inputMode="numeric"
                                    placeholder="Opcional"
                                />
                                {formData.Telefono2.length > 0 && formData.Telefono2.length !== 9 && (
                                    <small className="input-error-tip">Debe tener 9 dígitos o estar vacío.</small>
                                )}
                            </div>
                        </div>

                        <div className="form-group-row">
                            <div className="form-group">
                                <label htmlFor="Correo">Correo Principal</label>
                                <input
                                    type="email"
                                    id="Correo"
                                    name="Correo"
                                    value={formData.Correo}
                                    onChange={handleChange}
                                    placeholder="Dejar vacío para generar automáticamente"
                                />
                                <small className="input-help-tip">
                                    💡 Si deja este campo vacío, el sistema generará un correo único automáticamente (@pruebamecaofi.com)
                                </small>
                            </div>
                            <div className="form-group">
                                <label htmlFor="Correo2">Correo Secundario</label>
                                <input
                                    type="email"
                                    id="Correo2"
                                    name="Correo2"
                                    value={formData.Correo2}
                                    onChange={handleChange}
                                    placeholder="Opcional"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="Direccion">Dirección Completa</label>
                            <input
                                type="text"
                                id="Direccion"
                                name="Direccion"
                                value={formData.Direccion}
                                onChange={handleChange}
                                placeholder="Dirección completa"
                            />
                        </div>

                        <div className="form-group-row">
                            <div className="form-group">
                                <label htmlFor="Ciudad">Ciudad</label>
                                <input
                                    type="text"
                                    id="Ciudad"
                                    name="Ciudad"
                                    value={formData.Ciudad}
                                    onChange={handleChange}
                                    placeholder="Ciudad"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="Provincia">Provincia</label>
                                <input
                                    type="text"
                                    id="Provincia"
                                    name="Provincia"
                                    value={formData.Provincia}
                                    onChange={handleChange}
                                    placeholder="Provincia"
                                />
                            </div>
                        </div>

                        <div className="form-required-note">
                            <small>* Campos obligatorios</small>
                        </div>

                        <button type="submit" className="submit-button" disabled={submitting}>
                            {submitting ? 'Guardando Cliente...' : 'Registrar Cliente'}
                        </button>

                    </form>
                </div>
            </div>
        </div>
    );
}
import { useEffect, useState } from 'react';
import './viewClientModal.css';

// URLs de la API ajustadas a tus rutas
const CLIENTES_API_BASE_URL = 'http://localhost:3000/api/clientes'; 
const VISITAS_API_BASE_URL_CLIENTE = 'http://localhost:3000/api/visitas/cliente'; // Para obtener visitas de un cliente
const VISITAS_API_BASE_URL = 'http://localhost:3000/api/visitas'; // Para PUT/DELETE de una visita específica

const formatDate = (dateString, forInput = false) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (forInput) {
        return date.toISOString().slice(0, 10);
    }
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

export default function ViewClientModal({ show, onClose, cliente, onClientUpdate, onClientDelete }) {

    const [visitas, setVisitas] = useState([]);
    const [loadingVisitas, setLoadingVisitas] = useState(false);
    const [errorVisitas, setErrorVisitas] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedClient, setEditedClient] = useState({});
    const [editingVisitaId, setEditingVisitaId] = useState(null);
    const [editedVisita, setEditedVisita] = useState({});
    const [saveError, setSaveError] = useState(null);
    const [visitaSaveError, setVisitaSaveError] = useState(null);

    useEffect(() => {
        setSaveError(null);
        setVisitaSaveError(null);
        if (!cliente || !cliente.Id) { 
            setVisitas([]);
            return;
        }

        const fetchVisitas = async () => {
            setLoadingVisitas(true);
            setErrorVisitas(null);
            const token = localStorage.getItem('token'); 

            try {
                const response = await fetch(`${VISITAS_API_BASE_URL_CLIENTE}/${cliente.Id}`, { 
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                if (!response.ok) {
                    throw new Error("No se pudieron cargar las visitas del cliente.");
                }

                const data = await response.json();
                setVisitas(data);
                
            } catch (e) {
                console.error("Error al obtener visitas:", e);
                setErrorVisitas(e.message || "Error al cargar las visitas.");
            } finally {
                setLoadingVisitas(false);
            }
        };

        fetchVisitas();
    }, [show, cliente]);

    useEffect(() => {
        if (cliente) {
            setEditedClient({ ...cliente });
        }
    }, [cliente]);

    if (!show || !cliente) {
        return null;
    }

    const handleEditClient = () => {
        if (editingVisitaId) return; 
        setIsEditing(true);
        setSaveError(null);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditedClient({ ...cliente }); 
        setEditingVisitaId(null); 
        setEditedVisita({});
        setSaveError(null);
        setVisitaSaveError(null);
    };

    const handleSaveClient = async () => {
        setSaveError(null);
        const token = localStorage.getItem('token');

        const clientDataToSave = {
            Nombre: editedClient.Nombre,
            Ciudad: editedClient.Ciudad,
            Provincia: editedClient.Provincia,
            Telefono: editedClient.Telefono,
            Correo: editedClient.Correo,
            PersonaContacto: editedClient.PersonaContacto,
            Telefono2: editedClient.Telefono2,
            Correo2: editedClient.Correo2,
            Direccion: editedClient.Direccion 
        };

        try {
            const response = await fetch(`${CLIENTES_API_BASE_URL}/${editedClient.Id}`, {
                method: 'PUT', 
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(clientDataToSave)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Fallo al guardar los datos del cliente.");
            }

            setIsEditing(false);
            if (onClientUpdate) {
                onClientUpdate({...editedClient, 
                    IdComercial: cliente.IdComercial,
                    NombreComercial: cliente.NombreComercial
                }); 
            }
        } catch (e) {
            console.error("Error al guardar cliente:", e);
            setSaveError(e.message || "Error de red al intentar guardar.");
        }
    };

    const handleDeleteClient = async () => {
        if (!window.confirm(`¿Estás seguro de que quieres eliminar al cliente ${cliente.Nombre}? Esta acción es irreversible.`)) {
            return;
        }
        setSaveError(null);
        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`${CLIENTES_API_BASE_URL}/${cliente.Id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Fallo al eliminar el cliente.");
            }

            onClose(); 
            if (onClientDelete) {
                onClientDelete(cliente.Id);
            }
        } catch (e) {
            console.error("Error al eliminar cliente:", e);
            setSaveError(e.message || "Error de red al intentar eliminar.");
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditedClient(prev => ({ ...prev, [name]: value }));
    };

    const handleEditVisita = (visita) => {
        if (isEditing) return;
        setEditingVisitaId(visita.Id);
        setVisitaSaveError(null);
        
        setEditedVisita({
            ...visita,
            Fecha: visita.Fecha ? formatDate(visita.Fecha, true) : '',
            ProximaFecha: visita.ProximaFecha ? formatDate(visita.ProximaFecha, true) : '',
        });
    };

    const handleVisitaChange = (e) => {
        const { name, value } = e.target;
        setEditedVisita(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveVisita = async () => {
        setVisitaSaveError(null);
        const token = localStorage.getItem('token');
        const visitaId = editedVisita.Id;

        const visitaToSave = {
            IdCliente: editedVisita.IdCliente, 
            Fecha: editedVisita.Fecha, 
            ProximaFecha: editedVisita.ProximaFecha || null,
            Observaciones: editedVisita.Observaciones,
        };

        try {
            const response = await fetch(`${VISITAS_API_BASE_URL}/${visitaId}`, {
                method: 'PUT', 
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(visitaToSave)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Fallo al guardar la visita.");
            }

            setVisitas(prev => prev.map(v => v.Id === visitaId ? { 
                ...editedVisita,
                Anexo: v.Anexo, 
                Fecha: editedVisita.Fecha, 
                ProximaFecha: editedVisita.ProximaFecha || null 
            } : v));

            setEditingVisitaId(null);
            setEditedVisita({});
        } catch (e) {
            console.error("Error al guardar visita:", e);
            setVisitaSaveError(e.message || "Error de red al intentar guardar la visita.");
        }
    };

    const handleCancelVisitaEdit = () => {
        setEditingVisitaId(null);
        setEditedVisita({});
        setVisitaSaveError(null);
    };
    
    const comercialId = cliente.IdComercial; 
    const canDelete = comercialId === 10;
    const isVisitaEditing = editingVisitaId !== null;

    const renderDetail = (key, label) => (
        <div className="detail-item">
            <strong>{label}:</strong>
            {isEditing ? (
                <input
                    type={key.includes('Correo') ? 'email' : (key.includes('Telefono') ? 'tel' : 'text')}
                    name={key}
                    value={editedClient[key] || ''}
                    onChange={handleChange}
                    className="editable-input"
                />
            ) : (
                <span>{cliente[key] || 'N/A'}</span>
            )}
        </div>
    );

    return (
        <div className="modal-backdrop-view">
            <div className="modal-content-view">
                <div className="modal-header-view">
                    <h2>Detalle del Cliente: {cliente.Nombre}</h2>
                    <div className="modal-actions-top">
                        {isEditing ? (
                            <>
                                {canDelete && (
                                    <button
                                        type="button"
                                        className="boton-alerta"
                                        onClick={handleDeleteClient}
                                    >
                                        Eliminar Cliente
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className="boton-secundario"
                                    onClick={handleCancelEdit}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    className="boton-principal"
                                    onClick={handleSaveClient}
                                >
                                    Guardar
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    className="boton-secundario"
                                    onClick={handleEditClient}
                                    disabled={isVisitaEditing}
                                >
                                    Editar Cliente
                                </button>
                                <button
                                    type="button"
                                    className="boton-principal"
                                    onClick={() => alert("Añadir Visita pendiente")}
                                    disabled={isEditing || isVisitaEditing}
                                >
                                    Añadir Visita
                                </button>
                                <button className="boton-cerrar" onClick={onClose} aria-label="Cerrar">&times;</button>
                            </>
                        )}
                    </div>
                </div>
                
                {saveError && <p className="error-message-modal">{saveError}</p>}
                
                <div className="client-details-grid">
                    
                    <div className="detail-item">
                        <strong>Comercial Asignado:</strong>
                        <span>
                            {cliente.NombreComercial || 'N/A'} 
                            {cliente.IdComercial ? ` (ID: ${cliente.IdComercial})` : ''}
                        </span>
                    </div>

                    <div className="detail-item full-row">
                        <strong>Persona de Contacto:</strong>
                        {isEditing ? (
                            <input
                                type="text"
                                name="PersonaContacto"
                                value={editedClient.PersonaContacto || ''}
                                onChange={handleChange}
                                className="editable-input full-width-input"
                            />
                        ) : (
                            <span>{cliente.PersonaContacto || 'N/A'}</span>
                        )}
                    </div>
                    
                    {renderDetail('Telefono', 'Teléfono Principal')}
                    {renderDetail('Correo', 'Correo Principal')}
                    {renderDetail('Telefono2', 'Teléfono Secundario')}
                    {renderDetail('Correo2', 'Correo Secundario')}
                    
                    <div className="detail-item full-row">
                        <strong>Dirección Completa:</strong>
                        {isEditing ? (
                            <span className="address-inputs-group">
                                <input
                                    type="text"
                                    name="Direccion"
                                    value={editedClient.Direccion || ''}
                                    onChange={handleChange}
                                    placeholder="Dirección"
                                    className="editable-input inline-input"
                                />
                                <input
                                    type="text"
                                    name="Ciudad"
                                    value={editedClient.Ciudad || ''}
                                    onChange={handleChange}
                                    placeholder="Ciudad"
                                    className="editable-input inline-input"
                                />
                                <input
                                    type="text"
                                    name="Provincia"
                                    value={editedClient.Provincia || ''}
                                    onChange={handleChange}
                                    placeholder="Provincia"
                                    className="editable-input inline-input"
                                />
                            </span>
                        ) : (
                            <span>{cliente.Direccion}, {cliente.Ciudad}, {cliente.Provincia}</span>
                        )}
                    </div>
                </div>

                <hr className="divider" />

                <h3>Historial de Visitas ({visitas.length})</h3>

                {loadingVisitas && <p className="loading-message-modal">Cargando visitas...</p>}
                {errorVisitas && <p className="error-message-modal">{errorVisitas}</p>}
                {visitaSaveError && <p className="error-message-modal">{visitaSaveError}</p>}

                <div className="table-container-view">
                    <table className="visitas-table">
                        <thead>
                            <tr>
                                <th>Fecha Visita</th>
                                <th>Próxima Visita</th>
                                <th className="observaciones-col">Observaciones</th>
                                <th>Anexo</th>
                                <th>Acciones</th> 
                            </tr>
                        </thead>
                        <tbody>
                            {visitas.length === 0 && !loadingVisitas && !errorVisitas ? (
                                <tr>
                                    <td colSpan="5" className="no-data">No hay visitas registradas para este cliente.</td>
                                </tr>
                            ) : (
                                visitas.map(visita => (
                                    <tr key={visita.Id}>
                                        <td>
                                            {editingVisitaId === visita.Id ? (
                                                <input
                                                    type="date"
                                                    name="Fecha"
                                                    value={editedVisita.Fecha}
                                                    onChange={handleVisitaChange}
                                                    className="editable-input-table"
                                                />
                                            ) : (
                                                formatDate(visita.Fecha)
                                            )}
                                        </td>
                                        <td>
                                            {editingVisitaId === visita.Id ? (
                                                <input
                                                    type="date"
                                                    name="ProximaFecha"
                                                    value={editedVisita.ProximaFecha}
                                                    onChange={handleVisitaChange}
                                                    className="editable-input-table"
                                                />
                                            ) : (
                                                formatDate(visita.ProximaFecha)
                                            )}
                                        </td>
                                        <td className="observaciones-col">
                                            {editingVisitaId === visita.Id ? (
                                                <textarea
                                                    name="Observaciones"
                                                    value={editedVisita.Observaciones}
                                                    onChange={handleVisitaChange}
                                                    className="editable-textarea-table"
                                                />
                                            ) : (
                                                `${visita.Observaciones.substring(0, 100)}${visita.Observaciones.length > 100 ? '...' : ''}`
                                            )}
                                        </td>
                                        <td>
                                            {editingVisitaId === visita.Id ? (
                                                <select
                                                    name="Anexo"
                                                    value={editedVisita.Anexo ? 'Sí' : 'No'} 
                                                    onChange={(e) => setEditedVisita(prev => ({ ...prev, Anexo: e.target.value === 'Sí' }))}
                                                    className="editable-select-table"
                                                >
                                                    <option value="Sí">Sí</option>
                                                    <option value="No">No</option>
                                                </select>
                                            ) : (
                                                visita.Anexo ? 'Sí' : 'No'
                                            )}
                                        </td>
                                        <td>
                                            {editingVisitaId === visita.Id ? (
                                                <div className="table-actions">
                                                    <button onClick={handleSaveVisita} className="boton-accion-guardar">
                                                        Guardar
                                                    </button>
                                                    <button onClick={handleCancelVisitaEdit} className="boton-accion-cancelar">
                                                        Cancelar
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleEditVisita(visita)}
                                                    className="boton-accion-editar"
                                                    disabled={isVisitaEditing || isEditing} 
                                                >
                                                    Editar
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="modal-actions-view">
                    <button type="button" className="boton-principal" onClick={onClose}>
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
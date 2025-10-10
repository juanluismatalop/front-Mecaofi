import { useEffect, useState } from 'react';
import './viewClientModal.css';

const CLIENTES_API_BASE_URL = 'http://localhost:3000/api/clientes'; 
const VISITAS_API_BASE_URL_CLIENTE = 'http://localhost:3000/api/visitas/cliente'; 
const VISITAS_API_BASE_URL = 'http://localhost:3000/api/visitas'; 

const formatDate = (dateString, forInput = false) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) return 'N/A';

    if (forInput) {
        return date.toISOString().slice(0, 10);
    }
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

// ** FUNCIÓN CORREGIDA: Usa 'comercialId' como clave **
const getLoggedInUserId = () => {
    // 🚨 CAMBIO CRÍTICO: Usamos 'comercialId' para coincidir con HomePage.jsx
    const userIdString = localStorage.getItem('comercialId'); 
    const userId = userIdString ? parseInt(userIdString, 10) : null;

    // CONSOLE.LOG PARA DEPURACIÓN
    console.log(`[ViewClientModal] ID Comercial Logueado (localStorage 'comercialId'): ${userIdString} -> Número: ${userId}`);
    
    return userId;
};

export default function ViewClientModal({ show, onClose, cliente, onClientUpdate, onClientDelete }) {

    const [visitas, setVisitas] = useState([]);
    const [loadingVisitas, setLoadingVisitas] = useState(false);
    const [errorVisitas, setErrorVisitas] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedClient, setEditedClient] = useState({});
    const [saveError, setSaveError] = useState(null);
    
    const [editingVisitaId, setEditingVisitaId] = useState(null); 
    const [editedVisita, setEditedVisita] = useState({});
    const [visitaSaveError, setVisitaSaveError] = useState(null);
    const [fileAttachment, setFileAttachment] = useState({}); 

    useEffect(() => {
        setSaveError(null);
        setVisitaSaveError(null);
        setFileAttachment({}); 
        
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
                setVisitas(data.sort((a, b) => new Date(b.Fecha) - new Date(a.Fecha))); 
                
            } catch (error) { 
                console.error("Error al obtener visitas:", error);
                setErrorVisitas(error.message || "Error al cargar las visitas.");
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
        setFileAttachment({}); 
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

            if (onClientUpdate) {
                onClientUpdate({...editedClient, 
                    IdComercial: cliente.IdComercial,
                    NombreComercial: cliente.NombreComercial
                }); 
            }
            setIsEditing(false);
        } catch (error) {
            console.error("Error al guardar cliente:", error);
            setSaveError(error.message || "Error de red al intentar guardar.");
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
        } catch (error) {
            console.error("Error al eliminar cliente:", error);
            setSaveError(error.message || "Error de red al intentar eliminar.");
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditedClient(prev => ({ ...prev, [name]: value }));
    };
    

    const handleAddVisita = () => {
        if (isEditing) return;
        setEditedVisita({
            IdCliente: cliente.Id, 
            Fecha: formatDate(new Date(), true), 
            ProximaFecha: '', 
            Observaciones: '',
            Anexo: false 
        });
        setVisitaSaveError(null);
        setEditingVisitaId('NEW_VISIT'); 
        setFileAttachment(prev => ({ ...prev, 'NEW_VISIT': null })); 
    };
    
    const handleVisitaChange = (e) => {
        const { name, value } = e.target; 
        setEditedVisita(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e, visitaId) => {
        const file = e.target.files[0];
        
        setFileAttachment(prev => ({
            ...prev,
            [visitaId]: file
        }));

        // NOTA: Mantenemos la actualización de editedVisita.Anexo solo para visualizar
        // el nombre del archivo si es una nueva visita/edición.
        setEditedVisita(prev => ({
            ...prev,
            Anexo: file ? file.name : (visitas.find(v => v.Id === visitaId)?.Anexo || false)
        }));
    };

    const handleSaveNewVisita = async () => {
        setVisitaSaveError(null);
        const token = localStorage.getItem('token');

        if (!editedVisita.Fecha || !editedVisita.Observaciones) {
            setVisitaSaveError('La fecha y las observaciones de la visita son obligatorias.');
            return;
        }

        const file = fileAttachment['NEW_VISIT'];
        const formData = new FormData();
        formData.append('IdCliente', cliente.Id);
        formData.append('Fecha', editedVisita.Fecha);
        formData.append('ProximaFecha', editedVisita.ProximaFecha || ''); 
        formData.append('Observaciones', editedVisita.Observaciones);
        
        if (file) {
            formData.append('anexoFile', file); 
        }

        try {
            const response = await fetch(`${VISITAS_API_BASE_URL}`, { 
                method: 'POST', 
                headers: {
                    'Authorization': `Bearer ${token}` 
                },
                body: formData
            });

            if (!response.ok) {
                const contentType = response.headers.get("content-type");
                let errorMessage = `Error ${response.status}: Fallo al registrar la nueva visita.`;
                
                if (contentType && contentType.includes("application/json")) {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                }
                
                throw new Error(errorMessage);
            }

            const data = await response.json(); 
            
            const newVisita = { 
                ...editedVisita, 
                Id: data.Id || data.id, 
                NombreCliente: cliente.Nombre, 
                Anexo: data.Anexo || (file ? file.name : null) 
            };
            
            setVisitas(prev => [newVisita, ...prev].sort((a, b) => new Date(b.Fecha) - new Date(a.Fecha))); 
            
            setEditingVisitaId(null);
            setEditedVisita({});
            setFileAttachment(prev => { delete prev['NEW_VISIT']; return prev; }); 

        } catch (error) {
            console.error("Error al registrar nueva visita:", error);
            setVisitaSaveError(error.message || "Error de red al intentar registrar la visita.");
        }
    };

    const handleEditVisita = (visita) => {
        if (isEditing || editingVisitaId) return; 
        setEditingVisitaId(visita.Id);
        setVisitaSaveError(null);
        
        setEditedVisita({
            ...visita,
            Fecha: visita.Fecha ? formatDate(visita.Fecha, true) : '',
            ProximaFecha: visita.ProximaFecha ? formatDate(visita.ProximaFecha, true) : '',
            Anexo: visita.Anexo ? visita.Anexo : false 
        });
        
        setFileAttachment(prev => ({ ...prev, [visita.Id]: null }));
    };

    const handleSaveVisita = async () => {
        setVisitaSaveError(null);
        const token = localStorage.getItem('token');
        const visitaId = editedVisita.Id;
        
        if (!editedVisita.Fecha || !editedVisita.Observaciones) {
            setVisitaSaveError('La fecha y las observaciones de la visita son obligatorias.');
            return;
        }

        const file = fileAttachment[visitaId];

        const formData = new FormData();
        formData.append('IdCliente', editedVisita.IdCliente); 
        formData.append('Fecha', editedVisita.Fecha); 
        formData.append('ProximaFecha', editedVisita.ProximaFecha || ''); 
        formData.append('Observaciones', editedVisita.Observaciones);
        
        if (file) {
            formData.append('anexoFile', file); 
        } else {
            // Envía el nombre del anexo existente o vacío si no hay archivo nuevo y no se toca
            formData.append('Anexo', editedVisita.Anexo || ''); 
        }

        try {
            const response = await fetch(`${VISITAS_API_BASE_URL}/${visitaId}`, {
                method: 'PUT', 
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Fallo al guardar la visita.");
            }
            
            const responseData = await response.json();
            const updatedAnexoStatus = responseData.Anexo || editedVisita.Anexo || (file ? file.name : null);

            setVisitas(prev => prev.map(v => v.Id === visitaId ? { 
                ...v, 
                Fecha: editedVisita.Fecha,
                ProximaFecha: editedVisita.ProximaFecha || null,
                Observaciones: editedVisita.Observaciones,
                Anexo: updatedAnexoStatus 
            } : v).sort((a, b) => new Date(b.Fecha) - new Date(a.Fecha)));

            setEditingVisitaId(null);
            setEditedVisita({});
            setFileAttachment(prev => { delete prev[visitaId]; return prev; });
            
        } catch (error) {
            console.error("Error al guardar visita:", error);
            setVisitaSaveError(error.message || "Error de red al intentar guardar la visita.");
        }
    };

    const handleCancelVisitaEdit = () => {
        setEditingVisitaId(null);
        setEditedVisita({});
        setVisitaSaveError(null);
        setFileAttachment({});
    };

    const handleDeleteVisita = async (visitaId) => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar esta visita?")) {
            return;
        }
        setVisitaSaveError(null);
        const token = localStorage.getItem('token');
        
        try {
            const response = await fetch(`${VISITAS_API_BASE_URL}/${visitaId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Fallo al eliminar la visita. Verifique sus permisos.");
            }

            setVisitas(prev => prev.filter(v => v.Id !== visitaId));

        } catch (error) {
            console.error("Error al eliminar visita:", error);
            setVisitaSaveError(error.message || "Error de red al intentar eliminar la visita.");
        }
    };
    
    const handleDownloadAnexo = (filename) => {
        if (!filename) return; 
        const token = localStorage.getItem('token');
        const urlDescarga = `${VISITAS_API_BASE_URL}/download/${filename}`;

        setLoadingVisitas(true); 

        fetch(urlDescarga, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}` 
            }
        })
        .then(async response => {
            setLoadingVisitas(false); 

            if (!response.ok) {
                let errorMessage = `Error ${response.status}: Fallo en la descarga del anexo.`;

                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                // eslint-disable-next-line no-unused-vars
                } catch (_error) {
                    console.error("Respuesta de error no-JSON:", await response.text());
                }

                throw new Error(errorMessage);
            }
        
            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename; 
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        })
        .catch(error => {
            console.error('Error al descargar el anexo:', error);
            setVisitaSaveError(`Fallo en la descarga: ${error.message || 'Error de red.'}`);
        });
    };

    // ---------------------------------------------------------------------
    // LÓGICA DE ELIMINACIÓN CORREGIDA (Usa la función con la clave correcta)
    // ---------------------------------------------------------------------
    const loggedInUserId = getLoggedInUserId();
    // Solo el usuario logueado con ID 10 puede eliminar clientes
    const canDelete = loggedInUserId === 10; 
    // ---------------------------------------------------------------------

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
                    disabled={isVisitaEditing}
                />
            ) : (
                <span>{cliente[key] || 'N/A'}</span>
            )}
        </div>
    );
    
    // ---------------------------------------------------------------------
    // FUNCIÓN DE RENDERIZADO (Se mantiene igual a la versión anterior)
    // ---------------------------------------------------------------------
    const renderFileInput = (visitaId, currentAnexoValue) => {
        const file = fileAttachment[visitaId];
        const fileNameToDisplay = file ? file.name : (currentAnexoValue || null);
        const inputId = `file-input-${visitaId}`;

        return (
            <span className="file-input-group">
                <input
                    type="file"
                    id={inputId}
                    className="input-anexo-hidden" 
                    onChange={(e) => handleFileChange(e, visitaId)}
                    onClick={(e) => e.target.value = null}
                    disabled={isEditing} // El cliente no se edita, solo las visitas.
                />
                <label htmlFor={inputId} className="boton-secundario-file">
                    {fileNameToDisplay ? 'Cambiar' : 'Subir Archivo'}
                </label>
                {fileNameToDisplay && (
                    <span className="file-name-display" title={fileNameToDisplay}>
                        {fileNameToDisplay.length > 15 ? `${fileNameToDisplay.substring(0, 12)}...` : fileNameToDisplay}
                    </span>
                )}
                {/* Opción para quitar el archivo actualmente seleccionado si es un archivo nuevo */}
                {file && (
                     <button 
                        type="button" 
                        className="icon-button" 
                        onClick={() => setFileAttachment(prev => ({ ...prev, [visitaId]: null }))}
                        title="Quitar archivo seleccionado"
                     >
                        ❌
                    </button>
                )}
            </span>
        );
    };
    // ---------------------------------------------------------------------


    return (
        <div className="modal-backdrop-view" onClick={handleCancelEdit}>
            <div className="modal-content-view" onClick={e => e.stopPropagation()}> 
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
                                        disabled={isVisitaEditing}
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
                                    onClick={handleAddVisita} 
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
                                disabled={isVisitaEditing}
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
                                    disabled={isVisitaEditing}
                                />
                                <input
                                    type="text"
                                    name="Ciudad"
                                    value={editedClient.Ciudad || ''}
                                    onChange={handleChange}
                                    placeholder="Ciudad"
                                    className="editable-input inline-input"
                                    disabled={isVisitaEditing}
                                />
                                <input
                                    type="text"
                                    name="Provincia"
                                    value={editedClient.Provincia || ''}
                                    onChange={handleChange}
                                    placeholder="Provincia"
                                    className="editable-input inline-input"
                                    disabled={isVisitaEditing}
                                />
                            </span>
                        ) : (
                            <span>{cliente.Direccion}{cliente.Ciudad ? `, ${cliente.Ciudad}` : ''}{cliente.Provincia ? `, ${cliente.Provincia}` : ''}</span>
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
                                <th className="actions-col-header" colSpan={canDelete ? "2" : "1"}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {editingVisitaId === 'NEW_VISIT' && (
                                <tr className="new-visita-row">
                                    <td>
                                        <input
                                            type="date"
                                            name="Fecha"
                                            value={editedVisita.Fecha || ''}
                                            onChange={handleVisitaChange}
                                            className="editable-input-table"
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="date"
                                            name="ProximaFecha"
                                            value={editedVisita.ProximaFecha || ''}
                                            onChange={handleVisitaChange}
                                            className="editable-input-table"
                                        />
                                    </td>
                                    <td className="observaciones-col">
                                        <textarea
                                            name="Observaciones"
                                            value={editedVisita.Observaciones || ''}
                                            onChange={handleVisitaChange}
                                            className="editable-textarea-table"
                                            placeholder="Observaciones de la nueva visita..."
                                        />
                                    </td>
                                    <td className="anexo-col">
                                        {renderFileInput('NEW_VISIT', editedVisita.Anexo)} 
                                    </td>
                                    <td colSpan={canDelete ? "2" : "1"}> 
                                        <div className="table-actions editing">
                                            <button 
                                                onClick={handleSaveNewVisita} 
                                                className="icon-button save-icon"
                                                title="Guardar Nueva Visita"
                                            >
                                                💾
                                            </button>
                                            <button 
                                                onClick={handleCancelVisitaEdit} 
                                                className="icon-button cancel-icon"
                                                title="Cancelar"
                                            >
                                                ✖
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            
                            {visitas.length === 0 && !loadingVisitas && !errorVisitas && editingVisitaId !== 'NEW_VISIT' ? (
                                <tr>
                                    <td colSpan={canDelete ? "6" : "5"} className="no-data">No hay visitas registradas para este cliente.</td>
                                </tr>
                            ) : (
                                visitas.map(visita => (
                                    <tr key={visita.Id}>
                                        <td>
                                            {editingVisitaId === visita.Id ? (
                                                <input
                                                    type="date"
                                                    name="Fecha"
                                                    value={editedVisita.Fecha || ''}
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
                                                    value={editedVisita.ProximaFecha || ''}
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
                                                    value={editedVisita.Observaciones || ''}
                                                    onChange={handleVisitaChange}
                                                    className="editable-textarea-table"
                                                />
                                            ) : (
                                                `${visita.Observaciones.substring(0, 100)}${visita.Observaciones.length > 100 ? '...' : ''}`
                                            )}
                                        </td>
                                        <td className="anexo-col">
                                            {editingVisitaId === visita.Id ? (
                                                <>
                                                    {renderFileInput(visita.Id, editedVisita.Anexo)}
                                                </>
                                            ) : (
                                                visita.Anexo 
                                                    ? <span 
                                                        className="anexo-link"
                                                        onClick={() => handleDownloadAnexo(visita.Anexo)} 
                                                        title="Clic para descargar el anexo"
                                                      >
                                                        Ver Anexo
                                                      </span> 
                                                    : 'No'
                                            )}
                                        </td>
                                        
                                        {/* Columna de ACCIONES (Editar/Guardar/Cancelar y Eliminar) */}
                                        <td colSpan={canDelete ? "2" : "1"}> 
                                            <div className="table-actions">
                                                {editingVisitaId === visita.Id ? (
                                                    <>
                                                        <button 
                                                            onClick={handleSaveVisita} 
                                                            className="icon-button save-icon"
                                                            title="Guardar Visita"
                                                        >
                                                            💾
                                                        </button>
                                                        <button 
                                                            onClick={handleCancelVisitaEdit} 
                                                            className="icon-button cancel-icon"
                                                            title="Cancelar Edición"
                                                        >
                                                            ✖
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button 
                                                        onClick={() => handleEditVisita(visita)} 
                                                        className="icon-button edit-icon"
                                                        title="Editar Visita"
                                                        disabled={isEditing || isVisitaEditing}
                                                    >
                                                        ✏️
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button 
                                                        onClick={() => handleDeleteVisita(visita.Id)} 
                                                        className="icon-button delete-icon"
                                                        title="Eliminar Visita"
                                                        disabled={isEditing || isVisitaEditing}
                                                    >
                                                        🗑️
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
}
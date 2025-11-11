import { useEffect, useState, useMemo } from 'react';
import './viewClientModal.css';
import GenerateBudgetModal from './GenerateBudgetModal';

// 1. Definición de Constantes de API (CRÍTICO: Asegura que el puerto 8000/api sea correcto)
const API_BASE_URL = 'http://localhost:8000/api';
const CLIENTES_API_BASE_URL = `${API_BASE_URL}/clientes`; 
const VISITAS_API_BASE_URL_CLIENTE = `${API_BASE_URL}/visitas/cliente`; 
const VISITAS_API_BASE_URL = `${API_BASE_URL}/visitas`; 
const COMERCIALES_API_BASE_URL = `${API_BASE_URL}/comerciales`;

const formatDate = (dateString, forInput = false) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    if (forInput) return date.toISOString().slice(0, 10);
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

const getUserId = () => {
    const userIdString = localStorage.getItem('comercialId'); 
    return userIdString ? parseInt(userIdString, 10) : null;
};

const getToken = () => localStorage.getItem('token');

export default function ViewClientModal({ show, onClose, cliente, onClientUpdate, onClientDelete }) {
    
    // Identificación de usuario y rol
    const loggedInUserId = useMemo(() => getUserId(), []);
    const isAdmin = useMemo(() => loggedInUserId === 10, [loggedInUserId]);

    const [visitas, setVisitas] = useState([]);
    const [comerciales, setComerciales] = useState([]); 
    const [isEditing, setIsEditing] = useState(false);
    const [editedClient, setEditedClient] = useState({});
    const [saveError, setSaveError] = useState(null);
    
    const [loadingVisitas, setLoadingVisitas] = useState(false);
    const [editingVisitaId, setEditingVisitaId] = useState(null); 
    const [editedVisita, setEditedVisita] = useState({});
    const [visitaSaveError, setVisitaSaveError] = useState(null);
    const [fileAttachment, setFileAttachment] = useState({}); 

    // 🚨 Nuevo estado para el modal de presupuesto
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [visitaToBudget, setVisitaToBudget] = useState(null);

    const isVisitaEditing = editingVisitaId !== null;
    const isNewVisita = editingVisitaId === 'NEW_VISIT';
    
    const canEditClient = isAdmin || editedClient.IdComercial === loggedInUserId;
    const canDeleteClient = isAdmin;

    // 🚨 Nuevas funciones para manejar el modal de presupuesto
    const handleOpenBudgetModal = (visita = null) => {
        if (isEditing || isVisitaEditing) return;
        setVisitaToBudget(visita);
        setShowBudgetModal(true);
    };

    const handleCloseBudgetModal = () => {
        setVisitaToBudget(null);
        setShowBudgetModal(false);
    };

    useEffect(() => {
        if (cliente) {
            setEditedClient({ ...cliente });
            setIsEditing(false);
            setSaveError(null);
            setVisitaSaveError(null);
            setEditingVisitaId(null);
            setEditedVisita({});
            setFileAttachment({});
            handleCloseBudgetModal(); // 🚨 Cerrar el modal de presupuesto al cambiar de cliente
        }
    }, [cliente]);

    // 🚨 2. useEffect para Cargar Comerciales (Solo Admin)
    useEffect(() => {
        if (!show) return;

        const fetchComerciales = async () => {
            const token = getToken();
            try {
                const response = await fetch(COMERCIALES_API_BASE_URL, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (!response.ok) throw new Error("No se pudieron cargar los comerciales.");
                const data = await response.json();
                
                setComerciales(data);
                
            } catch (error) {
                console.error("Error fetching comerciales:", error);
                if (isAdmin) setSaveError("Error al cargar la lista de comerciales.");
            }
        };
        
        // Solo cargar si somos admin o si el cliente tiene un comercial asignado que no somos nosotros
        if (isAdmin || cliente?.IdComercial !== loggedInUserId) {
             fetchComerciales();
        }
       
    }, [show, isAdmin, loggedInUserId, cliente]);

    useEffect(() => {
        if (!cliente || !cliente.Id) { 
            setVisitas([]);
            return;
        }
        
        const fetchVisitas = async () => {
            setLoadingVisitas(true);
            const token = getToken(); 

            try {
                const response = await fetch(`${VISITAS_API_BASE_URL_CLIENTE}/${cliente.Id}`, { 
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                if (!response.ok) throw new Error("No se pudieron cargar las visitas del cliente.");
                const data = await response.json();
                
                const now = new Date();
                now.setHours(0, 0, 0, 0); 
                
                const sortedData = data.sort((a, b) => {
                    const nextDateA = a.ProximaFecha ? new Date(a.ProximaFecha) : null;
                    const nextDateB = b.ProximaFecha ? new Date(b.ProximaFecha) : null;
                    
                    const isAFuture = nextDateA && nextDateA >= now;
                    const isBFuture = nextDateB && nextDateB >= now;

                    if (isAFuture && isBFuture) return nextDateA.getTime() - nextDateB.getTime();
                    if (isAFuture) return -1;
                    if (isBFuture) return 1;

                    const visitaDateA = new Date(a.Fecha);
                    const visitaDateB = new Date(b.Fecha);
                    return visitaDateB.getTime() - visitaDateA.getTime();
                });

                setVisitas(sortedData);
                
            } catch (error) { 
                setVisitaSaveError(error.message || "Error al cargar las visitas.");
            } finally {
                setLoadingVisitas(false);
            }
        };

        fetchVisitas();
    }, [cliente]);

    if (!show || !cliente) return null;

    const handleEditClient = () => {
        if (isVisitaEditing) return; 
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
        handleCloseBudgetModal(); // 🚨 Asegurar el cierre del modal de presupuesto
    };
    
    const handleClientChange = (e) => {
        const { name, value } = e.target;
        setEditedClient(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveClient = async () => {
        setSaveError(null);
        const token = getToken();

        const clientDataToSave = {
            Nombre: editedClient.Nombre,
            Ciudad: editedClient.Ciudad,
            Provincia: editedClient.Provincia,
            Telefono: editedClient.Telefono,
            Correo: editedClient.Correo,
            PersonaContacto: editedClient.PersonaContacto,
            Telefono2: editedClient.Telefono2,
            Correo2: editedClient.Correo2,
            Direccion: editedClient.Direccion,
            IdComercial: isAdmin ? editedClient.IdComercial : cliente.IdComercial 
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
                const updatedComercial = comerciales.find(c => c.Id === editedClient.IdComercial)?.Comercial || cliente.NombreComercial;
                onClientUpdate({...editedClient, NombreComercial: updatedComercial}); 
            }
            setIsEditing(false);
        } catch (error) {
            setSaveError(error.message || "Error de red al intentar guardar.");
        }
    };

    const handleDeleteClient = async () => {
        if (!window.confirm(`¿Estás seguro de que quieres eliminar al cliente ${cliente.Nombre}? Esta acción es irreversible.`)) return;
        setSaveError(null);
        const token = getToken();

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
            if (onClientDelete) onClientDelete(cliente.Id);
        } catch (error) {
            setSaveError(error.message || "Error de red al intentar eliminar.");
        }
    };

    const handleAddVisita = () => {
        if (isEditing || isVisitaEditing) return;
        setEditedVisita({
            IdCliente: cliente.Id, 
            Fecha: formatDate(new Date(), true), 
            ProximaFecha: '', 
            Observaciones: '',
            Anexo: null 
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
        setEditedVisita(prev => ({
            ...prev,
            Anexo: file ? file.name : null 
        }));
    };

    const handleSaveVisita = async () => {
        setVisitaSaveError(null);
        const token = getToken();
        const isCreating = isNewVisita;
        const visitaId = editedVisita.Id;
        
        if (!editedVisita.Fecha || !editedVisita.Observaciones) {
            setVisitaSaveError('La fecha y las observaciones de la visita son obligatorias.');
            return;
        }

        const fileKey = isCreating ? 'NEW_VISIT' : visitaId;
        const file = fileAttachment[fileKey];
        const formData = new FormData();
        
        formData.append('IdCliente', cliente.Id);
        formData.append('Fecha', editedVisita.Fecha); 
        formData.append('ProximaFecha', editedVisita.ProximaFecha || ''); 
        formData.append('Observaciones', editedVisita.Observaciones);

        if (!isCreating) {
            formData.append('Id', editedVisita.Id); 
        }

        if (file) {
            formData.append('anexoFile', file);
        } else if (!isCreating) {
            if (editedVisita.Anexo === null) {
                formData.append('Anexo', ''); 
            }
        }
        
        try {
            const url = isCreating ? VISITAS_API_BASE_URL : `${VISITAS_API_BASE_URL}/${visitaId}`;
            const method = isCreating ? 'POST' : 'PUT'; 

            const response = await fetch(url, {
                method: method, 
                headers: {
                    'Authorization': `Bearer ${token}` 
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Fallo al ${isCreating ? 'registrar' : 'guardar'} la visita.`);
            }

            const responseData = await response.json(); 
            
            setVisitas(prev => {
                let updatedList;
                const visitaOriginal = prev.find(v => v.Id === (isCreating ? null : visitaId));
                
                const updatedVisitaData = {
                    ...editedVisita,
                    ...(isCreating && { 
                        Id: responseData.visita.Id, 
                        IdComercial: responseData.visita.IdComercial 
                    }), 
                    Anexo: responseData.Anexo || null, 
                    ProximaFecha: editedVisita.ProximaFecha || null,
                    comercial: visitaOriginal?.comercial || { Comercial: cliente.NombreComercial } 
                };
                
                if (isCreating) {
                    updatedList = [updatedVisitaData, ...prev];
                } else {
                    updatedList = prev.map(v => v.Id === visitaId ? updatedVisitaData : v);
                }

                const now = new Date();
                now.setHours(0, 0, 0, 0); 
                return updatedList.sort((a, b) => {
                    const nextDateA = a.ProximaFecha ? new Date(a.ProximaFecha) : null;
                    const nextDateB = b.ProximaFecha ? new Date(b.ProximaFecha) : null;
                    const isAFutureA = nextDateA && nextDateA >= now;
                    const isAFutureB = nextDateB && nextDateB >= now;
                    if (isAFutureA && isAFutureB) return nextDateA.getTime() - nextDateB.getTime();
                    if (isAFutureA) return -1;
                    if (isAFutureB) return 1;
                    return new Date(b.Fecha).getTime() - new Date(a.Fecha).getTime();
                });
            }); 
            
            setEditingVisitaId(null);
            setEditedVisita({});
            setFileAttachment({}); 

        } catch (error) {
            setVisitaSaveError(error.message || `Error de red al intentar ${isCreating ? 'crear' : 'guardar'} la visita.`);
        }
    };
    
    const handleEditVisita = (visita) => {
        if (isEditing || isVisitaEditing) return; 
        
        const canEdit = isAdmin || visita.IdComercial === loggedInUserId;
        if (!canEdit) {
            setVisitaSaveError("No tienes permiso para editar esta visita.");
            return;
        }

        setEditingVisitaId(visita.Id);
        setVisitaSaveError(null);
        
        setEditedVisita({
            ...visita,
            Fecha: visita.Fecha ? formatDate(visita.Fecha, true) : '',
            ProximaFecha: visita.ProximaFecha ? formatDate(visita.ProximaFecha, true) : '',
            Anexo: visita.Anexo || null 
        });
        
        setFileAttachment(prev => ({ ...prev, [visita.Id]: null }));
    };

    const handleCancelVisitaEdit = () => {
        setEditingVisitaId(null);
        setEditedVisita({});
        setVisitaSaveError(null);
        setFileAttachment({});
    };

    const handleDeleteVisita = async (visitaId) => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar esta visita?")) return;
        setVisitaSaveError(null);
        const token = getToken();
        
        try {
            const response = await fetch(`${VISITAS_API_BASE_URL}/${visitaId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Fallo al eliminar la visita.");
            }

            setVisitas(prev => prev.filter(v => v.Id !== visitaId));

        } catch (error) {
            setVisitaSaveError(error.message || "Error de red al intentar eliminar la visita.");
        }
    };
    
    const handleDownloadAnexo = (filename) => {
        if (!filename) return; 
        const token = getToken();
        const urlDescarga = `${VISITAS_API_BASE_URL}/anexo/${filename}`;

        fetch(urlDescarga, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}` 
            }
        })
        .then(async response => {
            if (!response.ok) {
                let errorMessage = `Error ${response.status}: Fallo en la descarga del anexo.`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                // eslint-disable-next-line no-unused-vars
                } catch (error) { //
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
            setVisitaSaveError(`Fallo en la descarga: ${error.message || 'Error de red.'}`);
        });
    };

    const renderDetail = (key, label) => (
        <div className="detail-item">
            <strong>{label}:</strong>
            {isEditing && key !== 'IdComercial' ? (
                <input
                    type={key.includes('Correo') ? 'email' : (key.includes('Telefono') ? 'tel' : 'text')}
                    name={key}
                    value={editedClient[key] || ''}
                    onChange={handleClientChange}
                    className="editable-input"
                    disabled={isVisitaEditing || !canEditClient}
                />
            ) : (
                <span>{editedClient[key] || 'N/A'}</span>
            )}
        </div>
    );

    const renderFileInput = (visitaId, currentAnexoValue) => {
        const file = fileAttachment[visitaId];
        const fileNameToDisplay = file ? file.name : (currentAnexoValue || null);
        const inputId = `file-input-${visitaId}`;
        const canDeleteAnexo = currentAnexoValue || file;

        return (
            <span className="file-input-group">
                <input
                    type="file"
                    id={inputId}
                    className="input-anexo-hidden" 
                    onChange={(e) => handleFileChange(e, visitaId)}
                    onClick={(e) => e.target.value = null} 
                    disabled={isEditing} 
                />
                <label htmlFor={inputId} className="boton-secundario-file">
                    {fileNameToDisplay ? 'Cambiar Anexo' : 'Subir Anexo'}
                </label>
                {fileNameToDisplay && (
                    <span className="file-name-display" title={fileNameToDisplay}>
                        {fileNameToDisplay.length > 15 ? `${fileNameToDisplay.substring(0, 12)}...` : fileNameToDisplay}
                    </span>
                )}
                {canDeleteAnexo && (
                     <button 
                        type="button" 
                        className="icon-button delete-anexo-icon" 
                        onClick={() => {
                            setFileAttachment(prev => ({ ...prev, [visitaId]: null }));
                            setEditedVisita(prev => ({ ...prev, Anexo: null })); 
                        }}
                        title="Quitar/Eliminar Anexo"
                     >
                        🗑️
                    </button>
                )}
            </span>
        );
    };

    return (
        <> {/* 🚨 Fragmento para incluir el modal de presupuesto */}
            <div className="modal-backdrop-view" onClick={handleCancelEdit}>
                <div className="modal-content-view" onClick={e => e.stopPropagation()}> 
                    <div className="modal-header-view">
                        <h2>Detalle del Cliente: {cliente.Nombre}</h2>
                        <div className="modal-actions-top">
                            {isEditing ? (
                                <>
                                    {canDeleteClient && (
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
                                        disabled={isVisitaEditing || !canEditClient}
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
                                    <button className="boton-secundario" onClick={onClose} aria-label="Cerrar">Cerrar</button>
                                </>
                            )}
                        </div>
                    </div>
                    
                    {saveError && <p className="error-message-modal">{saveError}</p>}
                    
                    <div className="client-details-grid">
                        
                        <div className="detail-item">
                            <strong>Comercial Asignado:</strong>
                            
                            {isEditing && isAdmin ? (
                                <select
                                    name="IdComercial"
                                    value={editedClient.IdComercial || ''}
                                    onChange={handleClientChange}
                                    className="editable-input"
                                    disabled={isVisitaEditing}
                                >
                                    <option value="">Sin Asignar</option>
                                    {comerciales
                                        .filter(c => c.Id !== 10) 
                                        .map(c => (
                                            <option key={c.Id} value={c.Id}>{c.Nombre}</option>
                                        ))}
                                </select>
                            ) : (
                                <span>{editedClient.NombreComercial || 'N/A'}</span>
                            )}
                        </div>

                        {renderDetail('PersonaContacto', 'Persona de Contacto')} 
                        {renderDetail('Telefono', 'Teléfono Principal')}
                        {renderDetail('Correo', 'Correo Principal')}
                        
                        {renderDetail('Telefono2', 'Teléfono Secundario')}
                        {renderDetail('Correo2', 'Correo Secundario')}
                        {renderDetail('Ciudad', 'Ciudad')}
                        {renderDetail('Provincia', 'Provincia')}

                        <div className="detail-item full-row">
                            <strong>Dirección Completa:</strong>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="Direccion"
                                    value={editedClient.Direccion || ''}
                                    onChange={handleClientChange}
                                    placeholder="Dirección"
                                    className="editable-input"
                                    disabled={isVisitaEditing || !canEditClient}
                                />
                            ) : (
                                <span>{cliente.Direccion || 'N/A'}</span>
                            )}
                        </div>
                        
                        <hr className="divider full-row" />
                    </div>

                    <h3>Historial de Visitas ({visitas.length})</h3>

                    {loadingVisitas && <p className="loading-message-modal">Cargando visitas...</p>}
                    {visitaSaveError && <p className="error-message-modal">{visitaSaveError}</p>}

                    <div className="table-container-view"> 
                        <table className="visitas-table">
                            <thead>
                                <tr>
                                    <th>Fecha Visita</th>
                                    <th>Próxima Visita</th>
                                    <th className="observaciones-col">Observaciones</th>
                                    <th>Comercial</th>
                                    <th>Anexo</th>
                                    {/* 🚨 CLASE AÑADIDA para el espacio extra del botón de Presupuesto */}
                                    <th className="actions-col-header wide-actions">Acciones</th> 
                                </tr>
                            </thead>
                            <tbody>
                                {(isNewVisita || editingVisitaId === 'NEW_VISIT') && (
                                    <tr className="new-visita-row">
                                        <td>
                                            <input type="date" name="Fecha" value={editedVisita.Fecha || ''} onChange={handleVisitaChange} className="editable-input-table" />
                                        </td>
                                        <td>
                                            <input type="date" name="ProximaFecha" value={editedVisita.ProximaFecha || ''} onChange={handleVisitaChange} className="editable-input-table" />
                                        </td>
                                        <td className="observaciones-col">
                                            <textarea name="Observaciones" value={editedVisita.Observaciones || ''} onChange={handleVisitaChange} className="editable-textarea-table" placeholder="Observaciones de la nueva visita..." />
                                        </td>
                                        <td>{cliente.NombreComercial}</td>
                                        <td className="anexo-col">{renderFileInput('NEW_VISIT', editedVisita.Anexo)}</td>
                                        <td> 
                                            <div className="table-actions editing wide-actions">
                                                <button onClick={handleSaveVisita} className="icon-button save-icon" title="Guardar Nueva Visita">💾</button>
                                                <button onClick={handleCancelVisitaEdit} className="icon-button cancel-icon" title="Cancelar">✖</button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                
                                {visitas.length === 0 && !loadingVisitas && !isNewVisita ? (
                                    <tr>
                                        <td colSpan="6" className="no-data">No hay visitas registradas para este cliente.</td>
                                    </tr>
                                ) : (
                                    visitas.map(visita => {
                                        const isVisitaOwner = visita.IdComercial === loggedInUserId;
                                        const canEditDelete = isAdmin || isVisitaOwner;

                                        const isEditingCurrent = editingVisitaId === visita.Id;
                                        
                                        const anexoToDisplay = isEditingCurrent ? editedVisita.Anexo : visita.Anexo;

                                        return (
                                        <tr key={visita.Id} className={isEditingCurrent ? 'editing-row' : ''}>
                                            <td>
                                                {isEditingCurrent ? (
                                                    <input type="date" name="Fecha" value={editedVisita.Fecha || ''} onChange={handleVisitaChange} className="editable-input-table" />
                                                ) : (
                                                    formatDate(visita.Fecha)
                                                )}
                                            </td>
                                            <td>
                                                {isEditingCurrent ? (
                                                    <input type="date" name="ProximaFecha" value={editedVisita.ProximaFecha || ''} onChange={handleVisitaChange} className="editable-input-table" />
                                                ) : (
                                                    formatDate(visita.ProximaFecha)
                                                )}
                                            </td>
                                            <td className="observaciones-col">
                                                {isEditingCurrent ? (
                                                    <textarea name="Observaciones" value={editedVisita.Observaciones || ''} onChange={handleVisitaChange} className="editable-textarea-table" />
                                                ) : (
                                                    visita.Observaciones
                                                )}
                                            </td>
                                            <td>{visita.comercial?.Comercial || 'N/A'}</td>
                                            <td className="anexo-col">
                                                {isEditingCurrent ? (
                                                    renderFileInput(visita.Id, visita.Anexo)
                                                ) : (
                                                    anexoToDisplay ? (
                                                        <button 
                                                            onClick={() => handleDownloadAnexo(anexoToDisplay)}
                                                            className="icon-button download-icon" 
                                                            title="Descargar Anexo"
                                                        >
                                                            📄
                                                        </button>
                                                    ) : ('N/A'))}
                                            </td>
                                            {/* Columna de Acciones */}
                                            <td className="actions-col wide-actions"> 
                                                {isEditingCurrent ? (
                                                    <div className="table-actions editing wide-actions">
                                                        <button onClick={handleSaveVisita} className="icon-button save-icon" title="Guardar Visita">💾</button>
                                                        <button onClick={handleCancelVisitaEdit} className="icon-button cancel-icon" title="Cancelar Edición">✖</button>
                                                    </div>
                                                ) : (
                                                    <div className="table-actions wide-actions">
                                                        {canEditDelete && (
                                                            <>
                                                                <button 
                                                                    onClick={() => handleEditVisita(visita)} 
                                                                    className="icon-button edit-icon"
                                                                    title="Editar Visita"
                                                                    disabled={isEditing || isVisitaEditing}
                                                                >
                                                                    ✏️
                                                                </button>

                                                                {/* 🚨 Botón para Generar Presupuesto (FUNCIONALIDAD SOLICITADA) */}
                                                                <button 
                                                                    onClick={() => handleOpenBudgetModal(visita)} 
                                                                    className="icon-button principal-icon budget-icon" 
                                                                    title="Generar Presupuesto para esta Visita"
                                                                    disabled={isEditing || isVisitaEditing}
                                                                >
                                                                    💲
                                                                </button>
                                                                {/* Fin del botón de Presupuesto */}
                                                                {isAdmin && (
                                                                    <button 
                                                                        onClick={() => handleDeleteVisita(visita.Id)} 
                                                                        className="icon-button delete-icon"
                                                                        title="Eliminar Visita"
                                                                        disabled={isEditing || isVisitaEditing}
                                                                    >
                                                                        🗑️
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    )})
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>
                
                {/* 🚨 CORRECCIÓN: Cambiar 'client' por 'cliente' y usar handleCloseBudgetModal */}
                {showBudgetModal && cliente && (
                    <GenerateBudgetModal
                        isOpen={showBudgetModal} 
                        onClose={handleCloseBudgetModal} 
                        currentIdCliente={cliente.Id}
                        clientName={cliente.Nombre}
                    />
                )}
            </div>
        </>
    );
}
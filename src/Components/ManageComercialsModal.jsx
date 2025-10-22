import React, { useState, useEffect } from 'react';
import './addClientModal.css'; 

const API_COMERCIALES_URL = 'http://localhost:3000/api/comercial';
const API_REASSIGN_URL = 'http://localhost:3000/api/comercial/reassign'; 

export default function ManageComercialsModal({ show, onClose, currentUserId, adminId = 10 }) {
    const [comerciales, setComerciales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [clientsToReassign, setClientsToReassign] = useState(null); 
    const [commercialToDeleteId, setCommercialToDeleteId] = useState(null);
    const [commercialToDeleteName, setCommercialToDeleteName] = useState('');
    const [newComercialId, setNewComercialId] = useState(''); 

    useEffect(() => {
        if (show) {
            fetchComerciales();
            resetReassignmentState();
        } else {
            setComerciales([]); 
        }
    }, [show]);
    
    const resetReassignmentState = () => {
        setClientsToReassign(null);
        setCommercialToDeleteId(null);
        setCommercialToDeleteName('');
        setNewComercialId('');
        setError(null);
    };


    const fetchComerciales = async () => {
        const token = localStorage.getItem('token');
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(API_COMERCIALES_URL, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Error al cargar comerciales: ${response.statusText} (Código: ${response.status})`);
            }

            const data = await response.json();
            setComerciales(data); 

        } catch (e) {
            console.error("Error al obtener comerciales:", e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteComercial = async (comercialId, comercialName) => {
        // Asegura que no se pueda eliminar al administrador (Id 10)
        if (comercialId === adminId) {
            alert("El administrador principal no puede ser eliminado.");
            return;
        }
        // Asegura que el comercial no pueda eliminarse a sí mismo
        if (comercialId === currentUserId) {
            alert("No puedes eliminar tu propia cuenta mientras estás logueado.");
            return;
        }

        if (!window.confirm(`¿Estás seguro de intentar eliminar al comercial "${comercialName}"?`)) {
            return;
        }

        const token = localStorage.getItem('token');
        
        try {
            const deleteUrl = `${API_COMERCIALES_URL}/${comercialId}`;
            
            const response = await fetch(deleteUrl, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                
                const contentType = response.headers.get("content-type");
                let data = {};
                if (contentType && contentType.includes("application/json")) {
                    try {
                        data = await response.json();
                    // eslint-disable-next-line no-unused-vars
                    } catch (e) {
                        data = {}; 
                    }
                }
                
                if ((response.status === 409 || response.status === 400) && data.clients && Array.isArray(data.clients) && data.clients.length > 0) {
                    
                    const availableComerciales = comerciales.filter(c => c.Id !== comercialId && c.Id !== adminId); 
                    
                    setClientsToReassign(data.clients);
                    setCommercialToDeleteId(comercialId);
                    setCommercialToDeleteName(comercialName);
                    
                    // Preselecciona el primer comercial disponible, o cadena vacía si no hay más.
                    setNewComercialId(availableComerciales[0]?.Id.toString() || ''); 

                    setError(null); 
                    return; 
                }

                const serverMessage = data.message || `Error ${response.status}: ${response.statusText}`;
                throw new Error(serverMessage);
            }

            setComerciales(prev => prev.filter(c => c.Id !== comercialId));
            alert(`Comercial "${comercialName}" eliminado con éxito.`);

        } catch (error) {
            console.error("Error al eliminar el comercial:", error);
            setError(error.message); 
        }
    };
    
    // FUNCIÓN PARA REALIZAR LA REASIGNACIÓN Y ELIMINACIÓN
    const handleReassignAndRemove = async () => {
        setError(null);
        if (!newComercialId) {
            setError("Por favor, selecciona un nuevo comercial para reasignar los clientes.");
            return;
        }

        const token = localStorage.getItem('token');
        
        try {
            const reassignData = {
                oldComercialId: commercialToDeleteId,
                newComercialId: parseInt(newComercialId, 10),
                clientIds: clientsToReassign.map(c => c.Id)
            };
            
            const response = await fetch(API_REASSIGN_URL, {
                method: 'POST', 
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reassignData)
            });

            if (!response.ok) {
                const data = await response.json(); 
                throw new Error(data.message || `Fallo en la reasignación y eliminación: ${response.statusText}`);
            }

            setComerciales(prev => prev.filter(c => c.Id !== commercialToDeleteId));
            alert(`Comercial "${commercialToDeleteName}" eliminado y ${clientsToReassign.length} clientes reasignados con éxito.`);

            resetReassignmentState();

        } catch (e) {
            console.error("Error en la reasignación:", e);
            setError(e.message);
        }
    };
    
    // Lista de comerciales disponibles para reasignar (excluye el que se va a eliminar Y el admin)
    const availableComerciales = comerciales.filter(c => c.Id !== commercialToDeleteId && c.Id !== adminId);
    // Lista visible en la tabla de gestión (excluye el admin)
    const visibleComerciales = comerciales.filter(c => c.Id !== adminId);

    if (!show) {
        return null;
    }
    
    // Renderizado del modal de reasignación
    if (clientsToReassign) {
        return (
            <div className="modal-backdrop">
                <div className="modal-content" style={{ maxWidth: '700px', padding: '30px' }}>
                    <h3 style={{color: 'rgb(var(--color-error))', borderBottom: '2px solid #eee', paddingBottom: '10px'}}>
                        ⚠️ Reasignación de Clientes Necesaria
                    </h3>
                    <p style={{marginBottom: '15px'}}>El comercial **{commercialToDeleteName}** tiene **{clientsToReassign.length} clientes** asignados. Selecciona un nuevo comercial de la lista para reasignarlos y poder eliminar la cuenta.</p>
                    
                    {error && <p style={{color: 'red', fontWeight: 'bold'}}>{error}</p>}
                    
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>Clientes Afectados:</h4>
                    <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #eee', padding: '10px', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
                        <ul style={{ listStyle: 'disc', paddingLeft: '20px', margin: 0 }}>
                            {clientsToReassign.map(client => (
                                <li key={client.Id}>{client.Nombre}</li>
                            ))}
                        </ul>
                    </div>
                    
                    <h4 style={{ fontSize: '1.1rem', marginTop: '20px', marginBottom: '10px' }}>Nuevo Comercial Destino:</h4>
                    <select
                        value={newComercialId}
                        onChange={(e) => setNewComercialId(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                        disabled={availableComerciales.length === 0}
                    >
                        {availableComerciales.length === 0 ? (
                            <option value="">No hay otros comerciales disponibles</option>
                        ) : (
                            <>
                                <option value="" disabled>Selecciona un comercial...</option>
                                {availableComerciales.map(comercial => (
                                    <option key={comercial.Id} value={comercial.Id}>
                                        {comercial.Nombre || comercial.Comercial}
                                    </option>
                                ))}
                            </>
                        )}
                    </select>

                    <div style={{ marginTop: '30px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                        <button 
                            className='boton-secundario' 
                            onClick={resetReassignmentState}
                            style={{ backgroundColor: '#6c757d', color: 'white', border: 'none' }} 
                        >
                            Cancelar
                        </button>
                        <button 
                            className='boton-alerta' 
                            onClick={handleReassignAndRemove}
                            disabled={!newComercialId || availableComerciales.length === 0}
                        >
                            Aceptar y Eliminar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Renderizado del modal de gestión principal
    return (
        <div className="modal-backdrop">
            <div className="modal-content" style={{ maxWidth: '600px' }}>
                <h3>Gestionar Comerciales ({visibleComerciales.length})</h3>
                <hr/>
                
                {loading && <p>Cargando lista de comerciales...</p>}
                {error && <p style={{color: 'red'}}>Error: {error}</p>}
                
                {!loading && !error && (
                    <table className="clientes-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleComerciales.map(comercial => (
                                <tr key={comercial.Id}>
                                    <td>{comercial.Nombre || comercial.Comercial}</td> 
                                    <td>
                                        <button 
                                            className='delete-button' 
                                            onClick={() => handleDeleteComercial(comercial.Id, comercial.Nombre || comercial.Comercial)}
                                            disabled={comercial.Id === currentUserId}
                                            title={comercial.Id === currentUserId ? "No puedes eliminarte a ti mismo" : "Eliminar Comercial"}
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            
                            {visibleComerciales.length === 0 && (
                                <tr>
                                    <td colSpan="2" style={{ textAlign: 'center' }}>
                                        No hay otros comerciales registrados para gestionar.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}

                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                    <button className='boton2' onClick={onClose}>Cerrar</button>
                </div>
            </div>
        </div>
    );
}
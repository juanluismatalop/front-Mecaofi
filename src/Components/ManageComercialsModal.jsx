import React, { useState, useEffect } from 'react';
import './addClientModal.css'; 
import ChangePasswordModal from './ChangePasswordModal'; 

// *** CORRECCIÓN CRÍTICA: La ruta de reasignación debe coincidir con el backend 'reassign-and-remove' ***
// const API_COMERCIALES_URL = 'http://localhost:8000/api/comerciales';
// const API_REASSIGN_URL = 'http://localhost:8000/api/comerciales/reassign-and-remove'; 

// Si estás en producción, usa las URLs comentadas:
const API_COMERCIALES_URL = 'https://www.mecaofi.com/LibroVisitas/back/public/api/comerciales';
const API_REASSIGN_URL = 'https://www.mecaofi.com/LibroVisitas/back/public/api/comerciales/reassign-and-remove'; 


export default function ManageComercialsModal({ show, onClose, currentUserId, adminId = 10 }) {
    // Estados principales para la gestión de comerciales
    const [comerciales, setComerciales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Estados para el proceso de reasignación
    const [clientsToReassign, setClientsToReassign] = useState(null); 
    const [commercialToDeleteId, setCommercialToDeleteId] = useState(null);
    const [commercialToDeleteName, setCommercialToDeleteName] = useState('');
    const [newComercialId, setNewComercialId] = useState(''); 

    // Estados para el modal de cambio de contraseña
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [commercialToChangePass, setCommercialToChangePass] = useState({ id: null, name: '' });

    // Efecto para cargar los comerciales cuando el modal se muestra
    useEffect(() => {
        if (show) {
            fetchComerciales();
            resetReassignmentState();
        } else {
            setComerciales([]); 
        }
    }, [show]);
    
    // Función para restablecer el estado de reasignación
    const resetReassignmentState = () => {
        setClientsToReassign(null);
        setCommercialToDeleteId(null);
        setCommercialToDeleteName('');
        setNewComercialId('');
        setError(null);
    };

    // Abre el modal de cambio de contraseña
    const handleOpenChangePassword = (comercialId, comercialName) => {
        setCommercialToChangePass({ id: comercialId, name: comercialName });
        setShowPasswordModal(true);
    };
    
    // Petición para obtener la lista de comerciales
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
            const validComerciales = Array.isArray(data) ? data : (data.comerciales || []);
            setComerciales(validComerciales); 

        } catch (e) {
            console.error("Error al obtener comerciales:", e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    // Función para intentar eliminar un comercial
    const handleDeleteComercial = async (comercialId, comercialName) => {
        // Validación de permisos y reglas de negocio
        if (comercialId === adminId) {
            // Nota: En un entorno de producción se debe usar un modal personalizado, no alert()
            alert("El administrador principal no puede ser eliminado."); 
            return;
        }
        if (comercialId === currentUserId) {
            // Nota: En un entorno de producción se debe usar un modal personalizado, no alert()
            alert("No puedes eliminar tu propia cuenta mientras estás logueado.");
            return;
        }

        // Nota: Reemplazar window.confirm con un modal personalizado
        if (!window.confirm(`¿Estás seguro de intentar eliminar al comercial "${comercialName}"?`)) {
            return;
        }

        const token = localStorage.getItem('token');
        setError(null);
        
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
                    } catch (e) {
                        data = {}; 
                        console.error("Error al intentar parsear JSON en 409:", e);
                    }
                }
                
                // Lógica clave para manejar el 409/400 (Conflicto) y solicitar reasignación
                if ((response.status === 409 || response.status === 400) && data.clients && Array.isArray(data.clients) && data.clients.length > 0) {
                    
                    const availableComerciales = comerciales.filter(c => c.Id !== comercialId && c.Id !== adminId); 
                    
                    setClientsToReassign(data.clients);
                    setCommercialToDeleteId(comercialId);
                    setCommercialToDeleteName(comercialName);
                    
                    setNewComercialId(availableComerciales[0]?.Id.toString() || ''); 

                    setError(null); 
                    return; 
                }

                const serverMessage = data.message || `Error ${response.status}: ${response.statusText}`;
                throw new Error(serverMessage);
            }

            // Éxito en la eliminación (sin clientes asignados)
            setComerciales(prev => prev.filter(c => c.Id !== comercialId));
            // Nota: En un entorno de producción se debe usar un modal personalizado, no alert()
            alert(`Comercial "${comercialName}" eliminado con éxito.`);

        } catch (error) {
            console.error("Error al eliminar el comercial:", error);
            setError(error.message); 
        }
    };
    
    // Función para reasignar clientes y luego eliminar al comercial
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
            
            // fetch usa la URL corregida: '.../reassign-and-remove'
            const response = await fetch(API_REASSIGN_URL, {
                method: 'POST', 
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reassignData)
            });

            if (!response.ok) {
                
                const contentType = response.headers.get("content-type");
                let data = {};
                
                // Manejo de Content-Type para evitar el SyntaxError si el backend no envía JSON
                if (contentType && contentType.includes("application/json")) {
                    try {
                        data = await response.json(); 
                    } catch (e) {
                         console.error("Fallo en la reasignación: SyntaxError al leer la respuesta del servidor.", e);
                         throw new Error("El servidor devolvió un error inesperado. El backend no envió JSON. (Revisar logs del servidor)");
                    }
                }
                
                // Lanza un error con el mensaje del backend o un mensaje genérico
                throw new Error(data.message || `Fallo en la reasignación y eliminación: ${response.statusText} (Código: ${response.status})`);
            }

            // Éxito en la reasignación y eliminación
            setComerciales(prev => prev.filter(c => c.Id !== commercialToDeleteId));
            // Nota: En un entorno de producción se debe usar un modal personalizado, no alert()
            alert(`Comercial "${commercialToDeleteName}" eliminado y ${clientsToReassign.length} clientes reasignados con éxito.`);

            resetReassignmentState();

        } catch (e) {
            console.error("Error en la reasignación:", e);
            setError(e.message);
        }
    };
    
    // Comerciales disponibles para reasignación 
    const availableComerciales = comerciales.filter(c => c.Id !== commercialToDeleteId && c.Id !== adminId);
    // Comerciales visibles en la lista principal
    const visibleComerciales = comerciales.filter(c => c.Id !== adminId);

    if (!show) {
        return null;
    }
    
    // --- Renderizado del Modal de Reasignación ---
    if (clientsToReassign) {
        return (
            <div className="modal-backdrop">
                <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', padding: '30px' }}>
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
                            className='boton2' 
                            onClick={resetReassignmentState}
                            style={{ backgroundColor: '#6c757d', color: 'white', border: 'none' }} 
                        >
                            Cancelar
                        </button>
                        <button 
                            className='delete-button' 
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

    // --- Renderizado del Modal Principal de Gestión ---
    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                <h3>Gestionar Comerciales ({visibleComerciales.length})</h3>
                <hr/>
                
                {loading && <p>Cargando lista de comerciales...</p>}
                {error && <p style={{color: 'red'}}>Error: {error}</p>}
                
                {!loading && !error && (
                    <table className="clientes-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th style={{width: '240px', textAlign: 'center'}}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleComerciales.map(comercial => (
                                <tr key={comercial.Id}>
                                    <td>{comercial.Nombre || comercial.Comercial}</td> 
                                    <td style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                        <button
                                            className='boton2'
                                            onClick={(e) => { 
                                                e.stopPropagation();
                                                handleOpenChangePassword(comercial.Id, comercial.Nombre || comercial.Comercial);
                                            }}
                                            style={{ backgroundColor: '#007bff', color: 'white' }}
                                        >
                                            Cambiar Contraseña
                                        </button>
                                        <button 
                                            className='delete-button' 
                                            onClick={(e) => { 
                                                e.stopPropagation();
                                                handleDeleteComercial(comercial.Id, comercial.Nombre || comercial.Comercial)
                                            }}
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
            
            {/* Componente del modal de cambio de contraseña */}
            <ChangePasswordModal
                show={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
                comercialId={commercialToChangePass.id}
                comercialName={commercialToChangePass.name}
            />
        </div>
    );
}
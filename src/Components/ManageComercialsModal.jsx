import React, { useState, useEffect } from 'react';
import './addClientModal.css'; 

const API_COMERCIALES_URL = 'http://localhost:3000/api/comercial';

export default function ManageComercialsModal({ show, onClose, currentUserId, adminId }) {
    const [comerciales, setComerciales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (show) {
            fetchComerciales();
        } else {
            setComerciales([]); 
        }
    }, [show]);

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
        if (comercialId === adminId) {
            alert("El administrador principal (ID: 10) no puede ser eliminado.");
            return;
        }
        if (comercialId === currentUserId) {
            alert("No puedes eliminar tu propia cuenta mientras estás logueado.");
            return;
        }

        if (!window.confirm(`¿Estás seguro de eliminar al comercial "${comercialName}"? Esta acción es irreversible.`)) {
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

            // 🚨 CAMBIO CLAVE: Siempre intentamos leer la respuesta del servidor, incluso si response.ok es falso
            const data = await response.json(); 

            if (!response.ok) {
                // Usamos el mensaje personalizado del servidor (data.message) o el statusText si no hay mensaje
                const serverMessage = data.message || `Error: ${response.statusText}`;
                throw new Error(serverMessage);
            }

            // Si la respuesta es OK (200)
            setComerciales(prev => prev.filter(c => c.Id !== comercialId));
            alert(`Comercial "${comercialName}" eliminado con éxito.`);

        } catch (error) {
            console.error("Error al eliminar el comercial:", error);
            // Mostrará el mensaje de error específico que capturamos
            alert(`Error al eliminar el comercial: ${error.message}`); 
        }
    };

    if (!show) {
        return null;
    }

    const visibleComerciales = comerciales.filter(c => c.Id !== adminId);

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
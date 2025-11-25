// ManageMachinesModal.jsx

import React, { useState, useEffect } from 'react';
import './addClientModal.css'; 
import { VscClose } from 'react-icons/vsc'; 

// --- CONFIGURACIÓN DE LA API ---
const MAQUINAS_API_URL = 'https://www.mecaofi.com/LibroVisitas/back/public/api/maquinas';
const ADMIN_ID = 10;

export default function ManageMachinesModal({ show, onClose, userId }) {
    const [machines, setMachines] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    const isAdmin = userId === ADMIN_ID;
    const token = localStorage.getItem('token');

    // --- FETCH DE MÁQUINAS ---
    const fetchMachines = async () => {
        if (!token || !isAdmin) return;

        setLoading(true);
        setError(null);
        setSuccessMessage('');

        try {
            const response = await fetch(MAQUINAS_API_URL, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                if (response.status === 401) throw new Error("Sesión expirada o no autorizado.");
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            setMachines(data);
        } catch (e) {
            setError(`Error al cargar máquinas: ${e.message}`);
            console.error(e);
            setMachines([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (show && isAdmin) {
            fetchMachines();
        }
    }, [show, isAdmin]);


    // --- FUNCIÓN DE ELIMINACIÓN ---
    const handleDeleteMachine = async (machineId, machineName) => {
        if (!isAdmin) {
            alert("No tienes permisos para realizar esta acción.");
            return;
        }

        // Se usa machineId, que ahora se pasa como machine.Id
        if (!machineId) {
            setError(`Error: ID de máquina inválido o no encontrado para la eliminación.`);
            return;
        }

        if (!window.confirm(`¿Estás seguro de que quieres eliminar la máquina "${machineName}" (ID: ${machineId})? Esta acción es irreversible.`)) {
            return;
        }
        
        setLoading(true);
        setError(null);
        setSuccessMessage('');

        try {
            const response = await fetch(`${MAQUINAS_API_URL}/${machineId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Error al eliminar: ${response.statusText}`);
            }

            // Actualizar el estado local (filtrar la máquina eliminada)
            setMachines(prevMachines => prevMachines.filter(m => m.Id !== machineId));
            setSuccessMessage(`Máquina eliminada con éxito (ID: ${machineId}).`);

        } catch (e) {
            setError(`Fallo al eliminar la máquina: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (!show || !isAdmin) return null;

    return (
        <div className="modal-backdrop">
            <div className="modal-content" style={{ maxWidth: '800px' }}>
                <div className="modal-header">
                    <h2 style={{color:'black'}}>⚙️ Gestionar Máquinas</h2>
                    <button className="close-button" onClick={onClose} aria-label="Cerrar modal">
                        <VscClose />
                    </button>
                </div>

                <div className="modal-body-scrollable">
                    <div style={{ marginBottom: '15px' }}>
                        <button 
                            className="submit-button" 
                            style={{ backgroundColor: 'gray', boxShadow: 'none' }}
                            onClick={fetchMachines} 
                            disabled={loading}
                        >
                            {loading ? 'Cargando...' : 'Recargar Listado'}
                        </button>
                    </div>

                    {error && <p className="error-message-modal">{error}</p>}
                    {successMessage && <p className="success-message-modal">{successMessage}</p>}

                    {!loading && machines.length === 0 && !error && (
                        <p className="status-message" style={{ padding: '15px', border: '1px solid #ccc', borderRadius: '10px' }}>
                            No hay máquinas registradas en el sistema.
                        </p>
                    )}

                    {!loading && machines.length > 0 && (
                        <table className="clientes-table" style={{ width: '100%', marginTop: '15px' }}>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nombre Máquina</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {machines.map((machine, index) => (
                                    <tr key={machine.Id || index}>
                                        <td>{machine.Id}</td>
                                        {/* Muestra el nombre usando la propiedad que asume el backend */}
                                        <td>{machine.Maquina || 'Sin nombre'} {machine.Modelo || ''}</td>
                                        {/* 🚨 Se eliminó la columna de Descripción de aquí 🚨 */}
                                        <td style={{ textAlign: 'center' }}>
                                            <button
                                                className='delete-button'
                                                onClick={() => handleDeleteMachine(machine.Id, machine.Nombre)}
                                                disabled={loading}
                                                style={{ 
                                                    backgroundColor: 'rgb(var(--color-error))', 
                                                    color: 'white',
                                                    padding: '5px 10px', 
                                                    borderRadius: '5px' 
                                                }}
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
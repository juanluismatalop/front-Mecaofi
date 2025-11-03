import React, { useState, useEffect } from 'react';
import './viewClientModal.css'; 

const MAQUINAS_API_URL = 'http://localhost:8000/api/maquinas';

export default function AddMachineModal({ show, onClose, onMachineAdded }) {
    const [formData, setFormData] = useState({
        Maquina: '',
        Modelo: '',
        Velocidad: '',
        NegroColor: 1,
        PrecioMaquina: '',
        Imagen: null,
        Id: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!show) {
            setFormData({
                Maquina: '',
                Modelo: '',
                Velocidad: '',
                NegroColor: 1,
                PrecioMaquina: '',
                Imagen: null,
                Id: ''
            });
            setError(null);
        }
    }, [show]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (checked ? 1 : 0) : value,
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setFormData(prev => ({ ...prev, Imagen: file }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('token');
        const dataToSend = new FormData();
        dataToSend.append('Maquina', formData.Maquina);
        dataToSend.append('Modelo', formData.Modelo);
        dataToSend.append('Velocidad', formData.Velocidad);
        dataToSend.append('NegroColor', formData.NegroColor);
        dataToSend.append('PrecioMaquina', formData.PrecioMaquina);
        if (formData.Imagen) {
            dataToSend.append('Imagen', formData.Imagen);
        }
        
        try {
            const response = await fetch(MAQUINAS_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: dataToSend,
            });

            if (!response.ok) {
                 const errorData = await response.json();
                 throw new Error(errorData.message || `Error ${response.status}: No se pudo añadir la máquina.`);
            }

            const newMachine = await response.json();
            alert(`Máquina "${newMachine.Maquina} - ${newMachine.Modelo}" añadida con éxito.`);
            onMachineAdded(newMachine);
            onClose();

        } catch (e) {
            console.error("Error al añadir máquina:", e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };
    
    if (!show) return null;

    return (
        <div className="modal-backdrop-view">
            <div className="modal-content-view modal-large">
                <div className="modal-header-view">
                    <h2>Registrar Nueva Máquina</h2>
                    <button 
                        onClick={onClose} 
                        className="icon-button cancel-icon" 
                        style={{ position: 'absolute', top: '0', right: '0' }}
                        disabled={loading}
                    >
                        &times;
                    </button>
                </div>

                {error && (
                    <div style={{ color: 'rgb(var(--color-error))', padding: '10px', backgroundColor: 'rgba(220, 53, 69, 0.1)', borderRadius: '5px', marginBottom: '15px' }}>
                        Error: {error}
                    </div>
                )}

                <div className="modal-body-content budget-builder">
                    <form onSubmit={handleSubmit} className="add-machine-form">
                        
                        <div className="maquina-info-grid">
                            
                            <div className="form-group">
                                <label htmlFor="Maquina">Nombre Máquina (*)</label>
                                <input 
                                    type="text" 
                                    id="Maquina" 
                                    name="Maquina" 
                                    value={formData.Maquina}
                                    onChange={handleChange}
                                    required
                                    className="select-input"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="Modelo">Modelo (*)</label>
                                <input 
                                    type="text" 
                                    id="Modelo" 
                                    name="Modelo" 
                                    value={formData.Modelo}
                                    onChange={handleChange}
                                    required
                                    className="select-input"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="PrecioMaquina">Precio Máquina (€) (*)</label>
                                <input 
                                    type="number" 
                                    id="PrecioMaquina" 
                                    name="PrecioMaquina" 
                                    value={formData.PrecioMaquina}
                                    onChange={handleChange}
                                    required
                                    min="0"
                                    step="0.01"
                                    className="select-input"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="Velocidad">Velocidad (Unidad) (*)</label>
                                <input 
                                    type="number" 
                                    id="Velocidad" 
                                    name="Velocidad" 
                                    value={formData.Velocidad}
                                    onChange={handleChange}
                                    required
                                    min="1"
                                    step="1"
                                    className="select-input"
                                />
                            </div>
                            
                            <div className="form-group full-width" style={{ marginTop: '10px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', fontWeight: 'normal' }}>
                                    <input
                                        type="checkbox"
                                        id="NegroColor"
                                        name="NegroColor"
                                        checked={formData.NegroColor === 1}
                                        onChange={handleChange}
                                        style={{ marginRight: '10px', width: 'auto' }}
                                    />
                                    Máquina a **Negro y Color** (Desmarcar para solo Negro)
                                </label>
                            </div>
                            
                            <div className="form-group full-width">
                                <label htmlFor="Imagen">Imagen</label>
                                <input 
                                    type="file" 
                                    id="Imagen" 
                                    name="Imagen" 
                                    onChange={handleFileChange}
                                    accept="image/*"
                                    className="select-input"
                                />
                                {formData.Imagen && (
                                    <span className="file-name-display">{formData.Imagen.name}</span>
                                )}
                            </div>

                        </div>
                        
                        <div className="modal-actions-bottom form-actions">
                            <button 
                                type="submit" 
                                className='boton' 
                                disabled={loading}
                                style={{ 
                                    backgroundColor: 'rgb(var(--color-success))', 
                                    width: '100%', 
                                    display: 'flex', 
                                    justifyContent: 'center', 
                                    alignItems: 'center', 
                                    gap: '10px' 
                                }}
                            >
                                {loading ? 'Añadiendo...' : 'Añadir Máquina'} 
                                {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-plus"></i>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
import React, { useState } from 'react';
// Asume que este archivo CSS existe en la misma carpeta
import './AddMaquinaModal.css'; 

// 🚨 CRÍTICO: Reemplaza estos valores con tu configuración real 🚨
const API_BASE_URL = 'http://localhost:8000'; // Tu URL base de Laravel
const API_TOKEN = 'TU_TOKEN_DE_AUTENTICACION'; // Token Sanctum del usuario logueado

/**
 * Modal para añadir una nueva Máquina.
 *
 * @param {object} props
 * @param {boolean} props.isOpen - Si el modal está abierto.
 * @param {function} props.onClose - Función para cerrar el modal.
 * @param {function} props.onSuccess - Función a ejecutar tras una creación exitosa.
 */
export default function addMaquinaModal({ isOpen, onClose, onSuccess }){
    
    const initialFormData = {
        Maquina: '',
        Modelo: '',
        Velocidad: '',
        NegroColor: 1, // Valor por defecto
        Imagen: '',
    };
    
    // 1. Estado del Formulario
    const [formData, setFormData] = useState(initialFormData);

    // 2. Estado de la Interfaz
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    // Maneja el cambio en cualquier campo del formulario
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: name === 'Velocidad' ? parseFloat(value) : (name === 'NegroColor' ? parseInt(value) : value),
        }));
    };
    
    // Resetea el estado y cierra el modal
    const handleClose = () => {
        setFormData(initialFormData); // Limpia el formulario
        setMessage('');
        setIsError(false);
        setLoading(false);
        onClose();
    };

    // Maneja el envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('Guardando máquina...');
        setIsError(false);

        // Simple chequeo de campos requeridos antes de enviar
        if (!formData.Maquina || !formData.Modelo || formData.Velocidad === '') {
            setMessage('🚨 Por favor, completa los campos Nombre, Modelo y Velocidad.');
            setIsError(true);
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/maquinas`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_TOKEN}`, 
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (response.ok) {
                setMessage(`✅ Máquina creada exitosamente.`);
                setIsError(false);
                onSuccess(); 
                setTimeout(handleClose, 2000); 

            } else {
                let errorMsg = result.message || 'Error desconocido al crear la máquina.';
                if (result.errors) {
                    errorMsg = Object.values(result.errors).flat().join(' | ');
                }
                setMessage(`❌ Error (${response.status}): ${errorMsg}`);
                setIsError(true);
            }

        } catch (error) {
            setMessage(`❌ Error de conexión: ${error.message}. Verifica API y Token.`);
            setIsError(true);
            console.error('Fetch Error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-backdrop"> 
            <div className="modal-content"> 
                <span className="close-button" onClick={handleClose}>&times;</span>
                <h2>Registrar Nueva Máquina</h2>
                <button 
                        className="close-button" 
                        onClick={onClose}
                        aria-label="Cerrar modal" // Importante para accesibilidad
                    >
                        {/* Puedes usar un icono o simplemente el carácter '×' */}
                        &times; 
                    </button>
                
                <form onSubmit={handleSubmit}>
                    
                    <label htmlFor="maquina">Nombre de Máquina/Marca *</label>
                    <input 
                        type="text" 
                        id="maquina" 
                        name="Maquina" 
                        value={formData.Maquina}
                        onChange={handleChange} 
                        maxLength="100"
                        required
                    />

                    <label htmlFor="modelo">Modelo *</label>
                    <input 
                        type="text" 
                        id="modelo" 
                        name="Modelo" 
                        value={formData.Modelo}
                        onChange={handleChange} 
                        maxLength="100"
                        required
                    />

                    <label htmlFor="velocidad">Velocidad (Unidad) *</label>
                    <input 
                        type="number" 
                        step="0.01" 
                        id="velocidad" 
                        name="Velocidad" 
                        value={formData.Velocidad}
                        onChange={handleChange} 
                        required
                    />
                    
                    <label htmlFor="negroColor">Tipo (1=ByN/Color, 0=Otro):</label>
                    <input 
                        type="number" 
                        id="negroColor" 
                        name="NegroColor" 
                        value={formData.NegroColor}
                        onChange={handleChange} 
                        min="0" 
                        max="1" 
                    />

                    <label htmlFor="imagen">URL de la Imagen (Opcional):</label>
                    <input 
                        type="text" 
                        id="imagen" 
                        name="Imagen" 
                        value={formData.Imagen}
                        onChange={handleChange} 
                    />

                    <button type="submit" disabled={loading}>
                        {loading ? 'Guardando...' : 'Guardar Máquina'}
                    </button>
                    
                    {message && (
                        <p className={isError ? 'error-message' : 'success-message'}>
                            {message}
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
};
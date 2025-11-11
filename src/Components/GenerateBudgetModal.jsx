import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './GenerateBudgetModal.css'; // Asegúrate de tener tu archivo CSS

const API_BASE_URL = 'http://localhost:8000/api';
const MAQUINAS_API_BASE_URL = `${API_BASE_URL}/maquinas`;
const PRESUPUESTOS_API_URL = `${API_BASE_URL}/presupuestos`;

const getAuthToken = () => localStorage.getItem('token');

// Función auxiliar para calcular el precio final
const calcularPrecioFinal = (precio, descuentoPorcentaje) => {
    if (!precio) return '0.00';
    const precioNum = parseFloat(precio) || 0;
    const descuentoNum = parseFloat(descuentoPorcentaje) || 0;
    
    // Asumimos que el descuento es un porcentaje (como se maneja en el frontend)
    const precioFinal = precioNum - (precioNum * descuentoNum / 100);
    return precioFinal.toFixed(2);
};

// =========================================================================
// 🚨 SUBCOMPONENTE: MachineBudgetItem (Contiene la mayoría de los inputs)
// =========================================================================
const MachineBudgetItem = ({ maquina, onUpdate, onRemove, saving }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    const handleFieldChange = (field, value) => {
        // 1. Actualizar el campo editado
        onUpdate(maquina.Id, field, value);
        
        // 2. Si el precio o descuento cambian, recalcular el precio final
        if (field === 'precioMaquina' || field === 'descuento') {
            const nuevoPrecio = field === 'precioMaquina' ? value : maquina.precioMaquina;
            const nuevoDescuento = field === 'descuento' ? value : maquina.descuento;
            
            const precioFinal = calcularPrecioFinal(nuevoPrecio, nuevoDescuento);
            onUpdate(maquina.Id, 'precioFinal', precioFinal);
        }
    };

    return (
        <div className="machine-budget-item">
            <div className="machine-header" onClick={toggleExpand}>
                <div className="machine-header-info">
                    <h5>{maquina.Nombre} - {maquina.Modelo}</h5>
                    <span className="machine-serial">{maquina.Nserie ? `S/N: ${maquina.Nserie}` : 'Sin número de serie'}</span>
                </div>
                <div className="machine-header-actions">
                    <span className="machine-final-price">
                        {maquina.precioFinal ? `${parseFloat(maquina.precioFinal).toFixed(2)}€` : '0.00€'}
                    </span>
                    <button 
                        type="button"
                        className={`toggle-button ${isExpanded ? 'expanded' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand();
                        }}
                        title={isExpanded ? "Contraer detalles" : "Expandir detalles"}
                    >
                        ▼
                    </button>
                    <button 
                        type="button"
                        className="delete-machine-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove(maquina.Id);
                        }}
                        disabled={saving}
                        title="Eliminar máquina del presupuesto"
                    >
                        🗑️
                    </button>
                </div>
            </div>

            <div className={`machine-details-content ${isExpanded ? 'expanded' : ''}`}>
                <div className="machine-budget-fields">
                    <div className="form-row">
                        <div className="form-group required">
                            <label>Precio Máquina (€)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                // 🚨 CORRECCIÓN 1: Usar || '' para evitar undefined/null
                                value={maquina.precioMaquina || ''} 
                                onChange={(e) => handleFieldChange('precioMaquina', e.target.value)}
                                disabled={saving}
                                placeholder="0.00"
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Descuento (%)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                // 🚨 CORRECCIÓN 2: Usar || '' para evitar undefined/null
                                value={maquina.descuento || ''} 
                                onChange={(e) => handleFieldChange('descuento', e.target.value)}
                                disabled={saving}
                                placeholder="0"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Precio Final (€)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                // 🚨 CORRECCIÓN 3: Usar || '' para evitar undefined/null
                                value={maquina.precioFinal || ''} 
                                readOnly
                                className="readonly-field"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    
                    <div className="form-row">
                        <div className="form-group">
                            <label>Coste Color (€)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                // 🚨 CORRECCIÓN 4: Usar || '' para evitar undefined/null
                                value={maquina.costePorCopiaColor || ''} 
                                onChange={(e) => handleFieldChange('costePorCopiaColor', e.target.value)} 
                                disabled={saving}
                                placeholder="0.00"
                            />
                        </div>
                        
                        <div className="form-group required">
                            <label>Coste Negro (€)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                // 🚨 CORRECCIÓN 5: Usar || '' para evitar undefined/null
                                value={maquina.costePorCopiaNegro || ''}
                                onChange={(e) => handleFieldChange('costePorCopiaNegro', e.target.value)}
                                disabled={saving}
                                placeholder="0.00"
                                required
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


// =========================================================================
// 🚨 COMPONENTE PRINCIPAL: GenerateBudgetModal
// =========================================================================
export default function GenerateBudgetModal({ isOpen, onClose, currentIdCliente, clientName, visitaId = null }) {
    
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [maquinas, setMaquinas] = useState([]);
    const [selectedMaquina, setSelectedMaquina] = useState('');
    const [maquinasSeleccionadas, setMaquinasSeleccionadas] = useState([]);
    const [observaciones, setObservaciones] = useState('');
    const [mesesRenting, setMesesRenting] = useState(''); // Estado para los meses de Renting

    useEffect(() => {
        if (isOpen && currentIdCliente) {
            fetchMachines();
            resetForm();
        }
    }, [isOpen, currentIdCliente]);

    const resetForm = () => {
        setSelectedMaquina('');
        setMaquinasSeleccionadas([]);
        setObservaciones('');
        setMesesRenting('');
        setError(null);
    };

    const fetchMachines = async () => {
        if (!currentIdCliente) return;

        setLoading(true);
        setError(null);
        try {
            const token = getAuthToken();
            
            const response = await axios.get(`${MAQUINAS_API_BASE_URL}?idCliente=${currentIdCliente}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Lógica de extracción de datos (puede variar según la respuesta real del backend)
            let machinesData = response.data.data || response.data.maquinas || response.data;
            if (!Array.isArray(machinesData)) machinesData = [];
            
            // Filtra y establece las máquinas disponibles
            const filteredMachines = machinesData.filter(m => 
                m.IdCliente === currentIdCliente || !m.IdCliente
            );
            
            setMaquinas(filteredMachines || []);
            
        } catch (err) {
            console.error('❌ Error al cargar máquinas:', err);
            setError('No se pudieron cargar las máquinas. Puede continuar manualmente.');
            setMaquinas([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMaquina = () => {
        if (!selectedMaquina) {
            setError('Por favor seleccione una máquina');
            return;
        }

        const maquinaExistente = maquinasSeleccionadas.find(m => m.Id == selectedMaquina);
        if (maquinaExistente) {
            setError('Esta máquina ya está en la lista');
            return;
        }

        const maquina = maquinas.find(m => m.Id == selectedMaquina);
        if (maquina) {
            setMaquinasSeleccionadas(prev => [...prev, {
                ...maquina,
                // 🚨 CORRECCIÓN: Usar '' como valor inicial para evitar undefined/null
                precioMaquina: String(maquina.PrecioVenta || ''), 
                descuento: String(maquina.Descuento || ''),
                precioFinal: calcularPrecioFinal(maquina.PrecioVenta, maquina.Descuento || 0),
                costePorCopiaColor: String(maquina.CostePorCopiaColor || ''), 
                costePorCopiaNegro: String(maquina.CostePorCopiaNegro || ''), 
            }]);
            setSelectedMaquina('');
            setError(null);
        }
    };

    const handleRemoveMaquina = (maquinaId) => {
        setMaquinasSeleccionadas(prev => prev.filter(m => m.Id !== maquinaId));
    };

    const handleUpdateMaquina = (maquinaId, field, value) => {
        setMaquinasSeleccionadas(prev => 
            prev.map(maquina => 
                maquina.Id === maquinaId 
                    ? { ...maquina, [field]: value }
                    : maquina
            )
        );
    };

    const validarFormulario = () => {
        if (maquinasSeleccionadas.length === 0) {
            setError('Debe añadir al menos una máquina');
            return false;
        }

        for (const maquina of maquinasSeleccionadas) {
            if (!maquina.precioMaquina || parseFloat(maquina.precioMaquina) <= 0) {
                setError(`La máquina "${maquina.Nombre}" debe tener un precio de venta válido.`);
                return false;
            }
            if (!maquina.costePorCopiaNegro || parseFloat(maquina.costePorCopiaNegro) < 0) {
                setError(`La máquina "${maquina.Nombre}" debe tener un coste por copia Negro válido.`);
                return false;
            }
            if(parseFloat(maquina.precioFinal) < 0) {
                 setError(`La máquina "${maquina.Nombre}" tiene un descuento excesivo.`);
                 return false;
            }
        }
        
        if(mesesRenting && (parseInt(mesesRenting) <= 0 || isNaN(parseInt(mesesRenting)))) {
             setError('Los meses de Renting deben ser un número entero positivo.');
             return false;
        }

        return true;
    };


    // 🚨 MÉTODO PARA GENERAR PDF y DESCARGAR
    const generarYDescargarPDF = async () => {
        try {
            const token = getAuthToken();
            
            // Mapear los datos de las máquinas para la solicitud del PDF
            const pdfData = {
                IdCliente: parseInt(currentIdCliente),
                observaciones: observaciones,
                mesesRenting: mesesRenting ? parseInt(mesesRenting) : null,
                maquinas: maquinasSeleccionadas.map(maquina => {
                    const precioMaquinaNum = parseFloat(maquina.precioMaquina) || 0;
                    const descuentoPorcentaje = parseFloat(maquina.descuento) || 0;
                    // Calcula el valor absoluto de la rebaja para enviarlo al PDF
                    const rebajaAbsoluta = precioMaquinaNum * descuentoPorcentaje / 100;
                    
                    return ({
                        Id: parseInt(maquina.Id),
                        Nombre: maquina.Nombre,
                        Modelo: maquina.Modelo,
                        Velocidad: maquina.Velocidad || '',
                        Imagen: maquina.Imagen || '',
                        Tipo: maquina.Tipo || 0, 
                        PrecioMaquina: precioMaquinaNum,
                        Rebaja: rebajaAbsoluta, // Rebaja como valor absoluto
                        PrecioFinal: parseFloat(maquina.precioFinal) || 0,
                        CostePorCopiaNegro: parseFloat(maquina.costePorCopiaNegro) || 0,
                        CostePorCopiaColor: maquina.costePorCopiaColor ? parseFloat(maquina.costePorCopiaColor) : null
                    });
                }),
            };

            const pdfResponse = await axios.post(
                `${PRESUPUESTOS_API_URL}/generar-pdf`, 
                pdfData,
                {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    responseType: 'blob'
                }
            );

            // Lógica de descarga del PDF
            const blob = new Blob([pdfResponse.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            
            const contentDisposition = pdfResponse.headers['content-disposition'];
            let filename = `Presupuesto_${clientName}_${new Date().toISOString().split('T')[0]}.pdf`;
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                if (filenameMatch && filenameMatch.length === 2) {
                    filename = filenameMatch[1];
                }
            }
            
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

        } catch (pdfError) {
            console.error('❌ Error al generar PDF:', pdfError.response?.data || pdfError.message);
            // Mostrar un error al usuario, pero no detener el guardado de la DB
            throw new Error('⚠️ Presupuesto(s) creado(s) pero hubo un error al generar el PDF.');
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validarFormulario()) return;

        setSaving(true);
        setError(null);

        try {
            const token = getAuthToken();
            if (!token) throw new Error('No se encontró el token de autenticación');

            // 🚨 1. GUARDAR CADA PRESUPUESTO EN LA BASE DE DATOS (una llamada por máquina)
            const promises = maquinasSeleccionadas.map(async (maquina) => {
                const precioMaquinaNum = parseFloat(maquina.precioMaquina) || 0;
                const descuentoPorcentaje = parseFloat(maquina.descuento) || 0;
                const rebajaAbsoluta = precioMaquinaNum * descuentoPorcentaje / 100;
                
                const presupuestoData = {
                    IdCliente: parseInt(currentIdCliente),
                    IdMaquina: parseInt(maquina.Id),
                    PrecioMaquina: precioMaquinaNum,
                    Rebaja: rebajaAbsoluta, // Rebaja en valor absoluto para la DB
                    PrecioFinal: parseFloat(maquina.precioFinal) || 0,
                    CostePorCopiaNegro: parseFloat(maquina.costePorCopiaNegro) || 0,
                    CostePorCopiaColor: maquina.costePorCopiaColor ? parseFloat(maquina.costePorCopiaColor) : null,
                    Notas: observaciones,
                    MesesRenting: mesesRenting ? parseInt(mesesRenting) : null,
                };
                
                await axios.post(PRESUPUESTOS_API_URL, presupuestoData, {
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
                });
            });

            await Promise.all(promises);
            console.log('✅ Todos los presupuestos creados.');

            // 🚨 2. GENERAR PDF CON TODAS LAS MÁQUINAS Y DESCARGAR
            await generarYDescargarPDF();
            
            alert(`✅ ${maquinasSeleccionadas.length} presupuesto(s) creado(s) exitosamente y PDF generado`);
            resetForm();
            onClose();

        } catch (err) {
            console.error('❌ Error al crear presupuesto(s):', err);
            
            let errorMessage = err.message || 'Error desconocido al procesar el presupuesto.';
            if (err.response) {
                // Priorizar mensajes de error del servidor
                errorMessage = err.response.data.message || errorMessage;
            }
            
            setError(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-backdrop" onClick={handleCancel}>
            <div className="modal-content budget-modal-large" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">Generar Presupuesto para: {clientName}</h3>
                    <button onClick={handleCancel} className="close-button" disabled={saving}>
                        &times;
                    </button>
                </div>
                
                <div className="modal-body">
                    {loading && <p className="loading-message">Cargando máquinas disponibles...</p>}
                    
                    {error && (
                        <div className="error-message-modal">
                            <p style={{ whiteSpace: 'pre-line' }}>{error}</p>
                            <button onClick={() => setError(null)} className="boton-secundario" style={{marginTop: '10px'}}>
                                Continuar Editando
                            </button>
                        </div>
                    )}

                    {/* Sección Añadir Máquina */}
                    <div className="section-add-machine">
                        <h4>Añadir Máquinas al Presupuesto</h4>
                        <div className="add-machine-controls">
                            <select 
                                value={selectedMaquina} 
                                onChange={(e) => setSelectedMaquina(e.target.value)}
                                disabled={loading || saving}
                                className="machine-select"
                            >
                                <option value="">--- Seleccione una máquina ---</option>
                                {maquinas.map(m => (
                                    <option key={m.Id} value={m.Id}>
                                        {m.Nombre} - {m.Modelo} {m.Nserie ? `(${m.Nserie})` : ''}
                                    </option>
                                ))}
                            </select>
                            <button 
                                type="button" 
                                onClick={handleAddMaquina}
                                disabled={loading || saving || !selectedMaquina}
                                className="boton-principal"
                            >
                                Añadir Máquina
                            </button>
                        </div>
                    </div>

                    {/* Sección Máquinas Seleccionadas */}
                    {maquinasSeleccionadas.length > 0 && (
                        <div className="section-selected-machines">
                            <h4>Máquinas en el Presupuesto ({maquinasSeleccionadas.length})</h4>
                            <div className="machine-list-container">
                                {maquinasSeleccionadas.map((maquina) => (
                                    <MachineBudgetItem 
                                        key={maquina.Id}
                                        maquina={maquina}
                                        onUpdate={handleUpdateMaquina}
                                        onRemove={handleRemoveMaquina}
                                        saving={saving}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="section-renting-and-observations">
                        <div className="form-group" style={{ maxWidth: '200px', marginBottom: '15px' }}>
                            <label>Meses de Renting</label>
                            <input
                                type="number"
                                min="1"
                                // 🚨 CORRECCIÓN 6: Usar || '' para evitar undefined/null
                                value={mesesRenting || ''}
                                onChange={(e) => setMesesRenting(e.target.value)}
                                placeholder="Ej: 36 o 60"
                                disabled={saving}
                            />
                            <small>Dejar vacío si no aplica renting.</small>
                        </div>
                        
                        <h4>Observaciones del Presupuesto</h4>
                        <textarea
                            // 🚨 CORRECCIÓN 7: Usar || '' para evitar undefined/null
                            value={observaciones || ''}
                            onChange={(e) => setObservaciones(e.target.value)}
                            placeholder="Añada observaciones adicionales sobre el presupuesto..."
                            disabled={saving}
                            rows="3"
                            className="observations-textarea"
                        />
                    </div>

                    <div className="button-group-modal">
                        <button 
                            type="button" 
                            onClick={handleCancel}
                            disabled={saving}
                            className="boton-secundario"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            onClick={handleSubmit}
                            disabled={saving || maquinasSeleccionadas.length === 0}
                            className="boton-principal"
                        >
                            {saving ? 'Guardando...' : 'Guardar y PDF'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
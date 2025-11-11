import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './GenerateBudgetModal.css';

const API_BASE_URL = 'http://localhost:8000/api';
const MAQUINAS_API_BASE_URL = `${API_BASE_URL}/maquinas`;
const PRESUPUESTOS_API_URL = `${API_BASE_URL}/presupuestos`;

const getAuthToken = () => localStorage.getItem('token');

// 🚨 Componente individual para cada máquina (Acordeón) - MANTENIDO IGUAL
const MachineBudgetItem = ({ maquina, onUpdate, onRemove, saving }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    const calcularPrecioFinal = (precio, descuento) => {
        if (!precio) return '0.00';
        const precioNum = parseFloat(precio);
        const descuentoNum = parseFloat(descuento) || 0;
        return (precioNum - (precioNum * descuentoNum / 100)).toFixed(2);
    };

    const handleFieldChange = (field, value) => {
        onUpdate(maquina.Id, field, value);
        
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
                                value={maquina.precioMaquina}
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
                                value={maquina.descuento}
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
                                value={maquina.precioFinal}
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
                                value={maquina.costeColor}
                                onChange={(e) => handleFieldChange('costeColor', e.target.value)}
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
                                value={maquina.costeNegro}
                                onChange={(e) => handleFieldChange('costeNegro', e.target.value)}
                                disabled={saving}
                                placeholder="0.00"
                                required
                            />
                        </div>
                        
                        <div className="form-group checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={maquina.renting}
                                    onChange={(e) => handleFieldChange('renting', e.target.checked)}
                                    disabled={saving}
                                />
                                Incluir Renting
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 🚨 COMPONENTE PRINCIPAL
export default function GenerateBudgetModal({ isOpen, onClose, currentIdCliente, clientName, visitaId = null }) {
    
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [maquinas, setMaquinas] = useState([]);
    const [selectedMaquina, setSelectedMaquina] = useState('');
    const [maquinasSeleccionadas, setMaquinasSeleccionadas] = useState([]);
    const [observaciones, setObservaciones] = useState('');

    useEffect(() => {
        if (isOpen && currentIdCliente) {
            console.log('✅ MODAL ABIERTO. Buscando máquinas para cliente ID:', currentIdCliente);
            fetchMachines();
            resetForm();
        }
    }, [isOpen, currentIdCliente]);

    const resetForm = () => {
        setSelectedMaquina('');
        setMaquinasSeleccionadas([]);
        setObservaciones('');
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
            
            let machinesData = response.data;
            
            if (response.data && Array.isArray(response.data.data)) {
                machinesData = response.data.data;
            } else if (response.data && Array.isArray(response.data.maquinas)) {
                machinesData = response.data.maquinas;
            } else if (Array.isArray(response.data)) {
                machinesData = response.data;
            }
            
            const filteredMachines = machinesData.filter(m => 
                m.IdCliente == currentIdCliente || !m.IdCliente
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
                precioMaquina: '',
                descuento: '',
                precioFinal: '',
                renting: false,
                costeColor: '',
                costeNegro: ''
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
            if (!maquina.precioMaquina || maquina.precioMaquina === '0' || parseFloat(maquina.precioMaquina) <= 0) {
                setError(`La máquina "${maquina.Nombre}" debe tener un precio válido mayor a 0`);
                return false;
            }
            if (!maquina.costeNegro || maquina.costeNegro === '0' || parseFloat(maquina.costeNegro) < 0) {
                setError(`La máquina "${maquina.Nombre}" debe tener un coste negro válido`);
                return false;
            }
        }

        return true;
    };

    // 🚨 MÉTODO PRINCIPAL CORREGIDO
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validarFormulario()) return;

        setSaving(true);
        setError(null);

        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No se encontró el token de autenticación');
            }

            // 🚨 CREAR UN PRESUPUESTO POR CADA MÁQUINA
            const promises = maquinasSeleccionadas.map(async (maquina) => {
                const presupuestoData = {
                    IdCliente: parseInt(currentIdCliente),
                    IdMaquina: parseInt(maquina.Id),
                    PrecioMaquina: parseFloat(maquina.precioMaquina) || 0,
                    Rebaja: parseFloat(maquina.descuento) || 0,
                    PrecioFinal: parseFloat(maquina.precioFinal) || parseFloat(maquina.precioMaquina) || 0,
                    CostePorCopiaNegro: parseFloat(maquina.costeNegro) || 0,
                    CostePorCopiaColor: parseFloat(maquina.costeColor) || 0,
                    Notas: observaciones
                };

                console.log('📤 Enviando presupuesto:', presupuestoData);
                
                const response = await axios.post(PRESUPUESTOS_API_URL, presupuestoData, {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                return response.data;
            });

            // Esperar a que todos los presupuestos se creen
            const resultados = await Promise.all(promises);
            console.log('✅ Todos los presupuestos creados:', resultados);

            // 🚨 GENERAR PDF CON TODAS LAS MÁQUINAS
            await generarYDescargarPDF();
            
            alert(`✅ ${maquinasSeleccionadas.length} presupuesto(s) creado(s) exitosamente y PDF generado`);
            resetForm();
            onClose();

        } catch (err) {
            console.error('❌ Error al crear presupuesto(s):', err);
            
            let errorMessage = 'Error al crear el presupuesto';
            
            if (err.response) {
                console.error('📊 Datos de error del servidor:', err.response.data);
                
                if (err.response.data && err.response.data.errors) {
                    const validationErrors = err.response.data.errors;
                    errorMessage = 'Errores de validación:\n';
                    Object.keys(validationErrors).forEach(key => {
                        errorMessage += `\n• ${key}: ${validationErrors[key].join(', ')}`;
                    });
                } else if (err.response.data && err.response.data.message) {
                    errorMessage += `\n${err.response.data.message}`;
                }
            }
            
            setError(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    // 🚨 MÉTODO PARA GENERAR PDF
    const generarYDescargarPDF = async () => {
        try {
            const token = getAuthToken();
            
            const pdfData = {
                IdCliente: parseInt(currentIdCliente),
                maquinas: maquinasSeleccionadas.map(maquina => ({
                    Id: parseInt(maquina.Id),
                    Nombre: maquina.Nombre,
                    Modelo: maquina.Modelo,
                    Velocidad: maquina.Velocidad || '',
                    Imagen: maquina.Imagen || '',
                    Tipo: maquina.Tipo || 0,
                    PrecioMaquina: parseFloat(maquina.precioMaquina) || 0,
                    Rebaja: parseFloat(maquina.descuento) || 0,
                    CostePorCopiaNegro: parseFloat(maquina.costeNegro) || 0,
                    CostePorCopiaColor: parseFloat(maquina.costeColor) || 0
                })),
                mesesRenting: maquinasSeleccionadas.some(m => m.renting) ? 12 : null
            };

            console.log('📄 Enviando datos para PDF:', pdfData);

            const pdfResponse = await axios.post(
                `${API_BASE_URL}/presupuestos/generar-pdf`, 
                pdfData,
                {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    responseType: 'blob'
                }
            );

            // Descargar PDF
            const blob = new Blob([pdfResponse.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Presupuesto_${clientName}_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(link);

        } catch (pdfError) {
            console.error('❌ Error al generar PDF:', pdfError);
            alert('⚠️ Presupuesto(s) creado(s) pero hubo un error al generar el PDF.');
        }
    };

    // 🚨 MÉTODO DE TESTING
    const handleSubmitTest = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const token = getAuthToken();
            const testData = {
                IdCliente: parseInt(currentIdCliente),
                IdMaquina: 1, // Usar un ID fijo para testing
                PrecioMaquina: 1000.00,
                Rebaja: 100.00,
                PrecioFinal: 900.00,
                CostePorCopiaNegro: 0.0050,
                CostePorCopiaColor: 0.0150,
                Notas: "Presupuesto de prueba"
            };

            console.log('🧪 TEST - Enviando:', testData);

            const response = await axios.post(PRESUPUESTOS_API_URL, testData, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('✅ TEST - Éxito:', response.data);
            alert('✅ Presupuesto de prueba creado exitosamente');
            onClose();

        } catch (err) {
            console.error('❌ TEST - Error:', err.response?.data || err.message);
            setError(`Error TEST: ${JSON.stringify(err.response?.data || err.message, null, 2)}`);
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
                            <div style={{ marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <button onClick={() => setError(null)} className="boton-secundario">
                                    Continuar Editando
                                </button>
                                <button onClick={handleSubmitTest} className="boton-principal" disabled={saving}>
                                    Probar Datos de Test
                                </button>
                            </div>
                        </div>
                    )}

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

                    <div className="section-observations">
                        <h4>Observaciones del Presupuesto</h4>
                        <textarea
                            value={observaciones}
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
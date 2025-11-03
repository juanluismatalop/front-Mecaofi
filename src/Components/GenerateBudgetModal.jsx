import React, { useState, useEffect } from 'react';
import './viewClientModal.css'; // Usando el CSS existente

// URLs de los endpoints
const API_BASE_URL = 'http://localhost:8000/api';
const PDF_API_URL = 'http://localhost:8000/generar-presupuesto-pdf'; // Endpoint de generación de PDF
const MAQUINAS_API_URL = `${API_BASE_URL}/maquinas`; // 🚨 NUEVO ENDPOINT PARA LAS MÁQUINAS

// Estado inicial base para una máquina, usado si no se selecciona ninguna
const initialMachineState = {
    // Identificador único para el front-end (clave de React)
    id: Date.now(), 
    // Propiedades que se sobrescribirán al seleccionar una máquina:
    IdMaquina: null,
    Maquina: 'Máquina Genérica', 
    Modelo: 'Modelo Base',
    Velocidad: 0, 
    PrecioMaquina: 0.00, 
    NegroColor: 1, 
    Imagen: null, // Asumimos que viene en base64 o null
    
    // Campos editables del presupuesto (valores por defecto):
    PrecioOferta: 0.00, 
    CosteNegro: 0.0050, 
    CosteColor: 0.0500,
    DescuentoMaquina: 0.00, 
    MesesRenting: 48, 
    ValorResidual: 0.00, 
    TextoNegro: 'Coste fijo a 0.0050 € la copia.', 
    TextoColor: 'Coste fijo a 0.0500 € la copia.',
    TextoAdicional: 'Condiciones: Renting a 48 meses. Incluye consumibles y mantenimiento por 4 años. Precio neto final tras descuento aplicado.',
};

export default function GenerateBudgetModal({ show, onClose, cliente, comercialId }) {
    const [maquinasDisponibles, setMaquinasDisponibles] = useState([]); // 🚨 Lista de máquinas desde el backend
    const [maquinas, setMaquinas] = useState([]); // Máquinas añadidas al presupuesto
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- Lógica de Carga de Máquinas ---
    useEffect(() => {
        if (!show) return;

        // Fetch de máquinas al abrir el modal
        const fetchMaquinas = async () => {
            const token = localStorage.getItem('token');
            try {
                const response = await fetch(MAQUINAS_API_URL, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) {
                    throw new Error("Fallo al cargar las máquinas disponibles.");
                }
                const data = await response.json();
                setMaquinasDisponibles(data);
                
                // Si hay máquinas disponibles, inicializar con la primera o con el estado base
                if (data.length > 0) {
                    const firstMachine = data[0];
                    setMaquinas([{ 
                        ...initialMachineState, 
                        id: Date.now(), // ID para el front
                        IdMaquina: firstMachine.Id,
                        Maquina: firstMachine.Maquina,
                        Modelo: firstMachine.Modelo,
                        Velocidad: firstMachine.Velocidad,
                        PrecioMaquina: firstMachine.PrecioMaquina,
                        PrecioOferta: firstMachine.PrecioMaquina, // Oferta inicial = Precio base
                        NegroColor: firstMachine.NegroColor,
                        // No se carga la Imagen aquí para evitar sobrecargar, 
                        // pero la puedes buscar en el backend con otro endpoint si es necesario.
                    }]);
                } else {
                    setMaquinas([{ ...initialMachineState, id: Date.now() }]);
                }
            } catch (e) {
                console.error("Error cargando máquinas:", e);
                setError("No se pudo cargar el catálogo de máquinas: " + e.message);
                setMaquinas([{ ...initialMachineState, id: Date.now() }]);
            }
        };

        fetchMaquinas();
        setError(null);
    }, [show]);

    // --- Manejo de Máquinas del Presupuesto ---

    const handleAddMachine = () => {
        const baseMachine = maquinasDisponibles.length > 0 
            ? maquinasDisponibles[0] 
            : { Id: null, Maquina: 'Máquina Genérica', Modelo: 'Modelo Base', Velocidad: 0, PrecioMaquina: 0, NegroColor: 1, Imagen: null };
            
        setMaquinas(prev => [
            ...prev,
            { 
                ...initialMachineState, 
                id: Date.now(), 
                IdMaquina: baseMachine.Id,
                Maquina: baseMachine.Maquina,
                Modelo: baseMachine.Modelo,
                Velocidad: baseMachine.Velocidad,
                PrecioMaquina: baseMachine.PrecioMaquina,
                PrecioOferta: baseMachine.PrecioMaquina,
                NegroColor: baseMachine.NegroColor,
            }
        ]);
    };

    const handleRemoveMachine = (idToRemove) => {
        if (maquinas.length > 1) {
            setMaquinas(prev => prev.filter(m => m.id !== idToRemove));
        } else {
            setError("Debe haber al menos una máquina en la propuesta.");
        }
    };
    
    // Función para cambiar datos de los inputs editables
    const handleChangeMachine = (id, name, value) => {
        setMaquinas(prev => 
            prev.map(m => 
                m.id === id ? { ...m, [name]: value } : m
            )
        );
    };

    // 🚨 Función para seleccionar una máquina del catálogo
    const handleSelectMachine = (machineId, machineStateId) => {
        const selectedId = parseInt(machineId);
        if (selectedId === 0) return; // Si selecciona "Seleccionar..."

        const selectedMachine = maquinasDisponibles.find(m => m.Id === selectedId);

        if (selectedMachine) {
            setMaquinas(prev => 
                prev.map(m => 
                    m.id === machineStateId 
                    ? { 
                        ...m, 
                        IdMaquina: selectedMachine.Id,
                        Maquina: selectedMachine.Maquina,
                        Modelo: selectedMachine.Modelo,
                        Velocidad: selectedMachine.Velocidad,
                        PrecioMaquina: selectedMachine.PrecioMaquina,
                        PrecioOferta: selectedMachine.PrecioMaquina, // Inicializar la oferta con el precio base
                        DescuentoMaquina: 0.00, // Reiniciar descuento
                        NegroColor: selectedMachine.NegroColor,
                        // Asignar los campos editables al valor de la plantilla
                        CosteNegro: m.CosteNegro || initialMachineState.CosteNegro,
                        CosteColor: m.CosteColor || initialMachineState.CosteColor,
                        TextoNegro: m.TextoNegro || initialMachineState.TextoNegro,
                        TextoColor: m.TextoColor || initialMachineState.TextoColor,
                    } 
                    : m
                )
            );
        }
    };


    // --- Lógica de Generación de PDF (Fetch API) ---

    const handleGeneratePdf = async () => {
        if (maquinas.length === 0 || maquinas.some(m => !m.IdMaquina)) {
            setError("Debes seleccionar una máquina para todas las propuestas.");
            return;
        }

        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        const comercialName = localStorage.getItem('comercialName') || 'Comercial';
        
        // 1. Preparar los datos finales
        const maquinasParaBackend = maquinas.map(m => ({
            ...m,
            // Asegurar que los números sean floats
            PrecioOferta: parseFloat(m.PrecioOferta),
            DescuentoMaquina: parseFloat(m.DescuentoMaquina),
            CosteNegro: parseFloat(m.CosteNegro),
            CosteColor: parseFloat(m.CosteColor),
            ValorResidual: parseFloat(m.ValorResidual),
            MesesRenting: parseInt(m.MesesRenting),
            
            // Cálculo del precio neto final para el PDF
            PrecioNetoFinal: parseFloat(m.PrecioOferta) - parseFloat(m.DescuentoMaquina),
            
            id: undefined, // Eliminar el 'id' temporal del front
        }));

        const dataToSend = {
            presupuestoId: `PRE-${Date.now().toString().slice(-6)}`,
            cliente: { ...cliente },
            comercial: { 
                Id: comercialId, 
                Nombre: comercialName, 
                Correo: 'comercial@mecaofi.com'
            }, 
            maquinas: maquinasParaBackend,
        };

        try {
            const response = await fetch(PDF_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify(dataToSend),
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = "Fallo al generar el PDF. Asegúrate de que el servidor está activo y la ruta es correcta.";
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.message || errorJson.error || errorMessage;
                // eslint-disable-next-line no-unused-vars
                } catch (e) {
                    console.error("Respuesta de error no JSON:", errorText);
                }
                throw new Error(errorMessage);
            }

            // Descargar el Blob
            const blob = await response.blob(); 
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Presupuesto_${cliente.Nombre.replace(/\s/g, '_')}_${dataToSend.presupuestoId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            alert("Presupuesto generado y descargado con éxito.");
            onClose();

        } catch (err) {
            console.error("Error al generar PDF:", err.message);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    if (!show) return null;

    // Calcular el coste neto final
    const calculateNetPrice = (oferta, descuento) => {
        return (parseFloat(oferta) || 0) - (parseFloat(descuento) || 0);
    };

    return (
        <div className="modal-backdrop-view" onClick={onClose}>
            <div className="modal-content-view modal-large" onClick={e => e.stopPropagation()}> 
                <div className="modal-header-view">
                    <h2>Constructor de Presupuesto</h2>
                    <button onClick={onClose} className="icon-button cancel-icon" disabled={loading}>
                        &times;
                    </button>
                </div>

                <div className="modal-body-content budget-builder"> 
                    
                    <div className="client-info-budget">
                        **Cliente:** {cliente.Nombre} | **Contacto:** {cliente.PersonaContacto || 'N/A'} | **Comercial:** {localStorage.getItem('comercialName')}
                    </div>

                    {error && (
                        <div style={{ color: 'rgb(var(--color-error))', padding: '10px', backgroundColor: 'rgba(220, 53, 69, 0.1)', borderRadius: '5px', marginBottom: '10px' }}>
                            Error: {error}
                        </div>
                    )}
                    
                    <div className="modal-actions-top">
                        <button 
                            className='boton-principal pdf-button full-width' 
                            onClick={handleGeneratePdf}
                            disabled={loading || maquinas.length === 0 || maquinas.some(m => !m.IdMaquina)}
                        >
                            {loading ? 'Generando PDF...' : 'Descargar Presupuesto PDF'} 
                            <i className="fas fa-file-pdf"></i>
                            {loading ? <i className="fas fa-spinner fa-spin"></i> : null}
                        </button>
                    </div>

                    <h3 className="section-title">Máquinas Incluidas ({maquinas.length})</h3>

                    <button 
                        className="boton-toggle-add" 
                        onClick={handleAddMachine}
                        disabled={loading}
                    >
                        Añadir Otra Máquina al Presupuesto ➕
                    </button>
                    
                    {/* Contenedor de Máquinas */}
                    <div className="maquinas-proposal-container">
                        {maquinas.map((maquina, index) => (
                            <div key={maquina.id} className="machine-proposal" style={{ marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h4 style={{ margin: '0', color: '#003399' }}>
                                        {index + 1}. Propuesta para {cliente.Nombre}
                                    </h4>
                                    {maquinas.length > 1 && (
                                        <button 
                                            onClick={() => handleRemoveMachine(maquina.id)} 
                                            className="icon-button delete-icon small-icon"
                                            title="Eliminar esta máquina del presupuesto"
                                            disabled={loading}
                                        >
                                            🗑️
                                        </button>
                                    )}
                                </div>
                                <hr />

                                <div className="maquina-info-grid">
                                    {/* 🚨 SELECTOR DE MÁQUINA */}
                                    <div className="form-group full-width">
                                        <label htmlFor={`select-${maquina.id}`}>Seleccionar Máquina del Catálogo</label>
                                        <select
                                            id={`select-${maquina.id}`}
                                            value={maquina.IdMaquina || 0}
                                            onChange={(e) => handleSelectMachine(e.target.value, maquina.id)}
                                            className="select-input"
                                            disabled={loading}
                                        >
                                            <option value={0}>-- Selecciona una máquina --</option>
                                            {maquinasDisponibles.map(m => (
                                                <option key={m.Id} value={m.Id}>
                                                    {m.Maquina} {m.Modelo} ({m.Velocidad} PPM - {m.PrecioMaquina.toFixed(2)} €)
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    {/* Mostrar info de máquina seleccionada */}
                                    <div className="form-group">
                                        <label>Modelo:</label>
                                        <input type="text" value={`${maquina.Maquina} ${maquina.Modelo}`} disabled className="disabled-input" />
                                    </div>
                                    <div className="form-group">
                                        <label>Precio Base:</label>
                                        <input type="text" value={`${maquina.PrecioMaquina.toFixed(2)} €`} disabled className="disabled-input" />
                                    </div>

                                    <div className="form-group">
                                        <label>Velocidad:</label>
                                        <input type="text" value={`${maquina.Velocidad} PPM`} disabled className="disabled-input" />
                                    </div>
                                    <div className="form-group">
                                        <label>Tipo:</label>
                                        <input type="text" value={maquina.NegroColor === 1 ? 'Color' : 'Sólo Negro'} disabled className="disabled-input" />
                                    </div>
                                    
                                    {/* --- Datos de Oferta --- */}
                                    <div className="form-group">
                                        <label htmlFor={`oferta-${maquina.id}`}>Precio Oferta (€)</label>
                                        <input 
                                            type="number" 
                                            id={`oferta-${maquina.id}`}
                                            name="PrecioOferta"
                                            value={maquina.PrecioOferta}
                                            onChange={(e) => handleChangeMachine(maquina.id, e.target.name, e.target.value)}
                                            step="0.01"
                                            min="0"
                                            className="select-input"
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor={`descuento-${maquina.id}`}>Descuento Aplicado (€)</label>
                                        <input 
                                            type="number" 
                                            id={`descuento-${maquina.id}`}
                                            name="DescuentoMaquina"
                                            value={maquina.DescuentoMaquina}
                                            onChange={(e) => handleChangeMachine(maquina.id, e.target.name, e.target.value)}
                                            step="0.01"
                                            min="0"
                                            className="select-input"
                                            disabled={loading}
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Precio Neto Final</label>
                                        <input 
                                            type="text" 
                                            value={`${calculateNetPrice(maquina.PrecioOferta, maquina.DescuentoMaquina).toFixed(2)} €`}
                                            className="disabled-input"
                                            disabled
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor={`renting-${maquina.id}`}>Meses Renting</label>
                                        <input 
                                            type="number" 
                                            id={`renting-${maquina.id}`}
                                            name="MesesRenting"
                                            value={maquina.MesesRenting}
                                            onChange={(e) => handleChangeMachine(maquina.id, e.target.name, e.target.value)}
                                            min="12"
                                            step="12"
                                            className="select-input"
                                            disabled={loading}
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor={`residual-${maquina.id}`}>Valor Residual (€)</label>
                                        <input 
                                            type="number" 
                                            id={`residual-${maquina.id}`}
                                            name="ValorResidual"
                                            value={maquina.ValorResidual}
                                            onChange={(e) => handleChangeMachine(maquina.id, e.target.name, e.target.value)}
                                            step="0.01"
                                            min="0"
                                            className="select-input"
                                            disabled={loading}
                                        />
                                    </div>
                                    
                                    {/* --- Costes de Copia --- */}
                                    <div className="form-group">
                                        <label htmlFor={`costeneg-${maquina.id}`}>Coste Copia Negro (€)</label>
                                        <input 
                                            type="number" 
                                            id={`costeneg-${maquina.id}`}
                                            name="CosteNegro"
                                            value={maquina.CosteNegro}
                                            onChange={(e) => handleChangeMachine(maquina.id, e.target.name, e.target.value)}
                                            step="0.0001"
                                            min="0"
                                            className="select-input"
                                            disabled={loading}
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor={`costecol-${maquina.id}`}>Coste Copia Color (€)</label>
                                        <input 
                                            type="number" 
                                            id={`costecol-${maquina.id}`}
                                            name="CosteColor"
                                            value={maquina.CosteColor}
                                            onChange={(e) => handleChangeMachine(maquina.id, e.target.name, e.target.value)}
                                            step="0.0001"
                                            min="0"
                                            className="select-input"
                                            disabled={loading || maquina.NegroColor === 0}
                                        />
                                    </div>
                                    
                                    <div className="form-group full-width">
                                        <label htmlFor={`textoneg-${maquina.id}`}>Texto Explicativo Coste Negro</label>
                                        <input 
                                            type="text" 
                                            id={`textoneg-${maquina.id}`}
                                            name="TextoNegro"
                                            value={maquina.TextoNegro}
                                            onChange={(e) => handleChangeMachine(maquina.id, e.target.name, e.target.value)}
                                            className="select-input"
                                            disabled={loading}
                                        />
                                    </div>
                                    
                                    <div className="form-group full-width">
                                        <label htmlFor={`textocol-${maquina.id}`}>Texto Explicativo Coste Color</label>
                                        <input 
                                            type="text" 
                                            id={`textocol-${maquina.id}`}
                                            name="TextoColor"
                                            value={maquina.TextoColor}
                                            onChange={(e) => handleChangeMachine(maquina.id, e.target.name, e.target.value)}
                                            className="select-input"
                                            disabled={loading}
                                        />
                                    </div>

                                    {/* --- Texto Adicional --- */}
                                    <div className="form-group full-width">
                                        <label htmlFor={`textoadd-${maquina.id}`}>Texto/Condiciones Adicionales (en la página de la máquina)</label>
                                        <textarea 
                                            id={`textoadd-${maquina.id}`}
                                            name="TextoAdicional"
                                            value={maquina.TextoAdicional}
                                            onChange={(e) => handleChangeMachine(maquina.id, e.target.name, e.target.value)}
                                            className="editable-textarea-table"
                                            disabled={loading}
                                        />
                                    </div>
                                    
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="modal-actions-bottom form-actions">
                        <button 
                            className='boton-principal pdf-button' 
                            onClick={handleGeneratePdf}
                            disabled={loading || maquinas.length === 0 || maquinas.some(m => !m.IdMaquina)}
                            style={{ width: '100%', marginTop: '20px', backgroundColor: '#e67e22' }}
                        >
                            {loading ? 'Generando...' : 'Descargar Presupuesto Final'} 
                            {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-download"></i>}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
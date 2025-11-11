import React, { useState, useEffect } from 'react';
// import './GenerateBudgetModal.css'; // Asegúrate de tener tus estilos aquí

const GenerateBudgetModal = ({ isOpen, onClose, availableMachines }) => {
    // --- 1. ESTADOS DE GESTIÓN DE LA VISTA ---
    
    // Almacena la máquina seleccionada para la configuración. Si es null, mostramos la lista.
    const [machineToConfigure, setMachineToConfigure] = useState(null);
    // Almacena los datos de configuración actuales para los inputs del formulario.
    const [config, setConfig] = useState({
        PrecioMaquina: 0,
        Rebaja: 0,
        RentingMeses: 36,
        CosteColor: 0,
        CosteNegro: 0,
    });
    // Almacena la lista final de máquinas añadidas al presupuesto.
    const [configuredMachines, setConfiguredMachines] = useState([]);

    // --- 2. CÁLCULO REACTIVO ---

    // El precio total se calcula automáticamente cada vez que config cambia.
    const PrecioTotal = config.PrecioMaquina - config.Rebaja;

    // --- 3. EFECTO PARA INICIALIZAR LA CONFIGURACIÓN ---

    // Se ejecuta cada vez que se selecciona una nueva máquina (machineToConfigure cambia)
    useEffect(() => {
        if (machineToConfigure) {
            // Inicializa la configuración con los valores por defecto de la máquina
            setConfig({
                PrecioMaquina: machineToConfigure.PrecioMaquina || 0,
                Rebaja: 0, // Siempre iniciar la rebaja en 0
                RentingMeses: 36, 
                CosteColor: machineToConfigure.NegroColor || 0, // Asumo que NegroColor incluye el coste por copia
                CosteNegro: machineToConfigure.NegroColor || 0, 
            });
        }
    }, [machineToConfigure]);

    // --- 4. MANEJADORES DE ACCIÓN ---

    // Abre la vista de configuración con la máquina seleccionada
    const handleSelectMachine = (machine) => {
        setMachineToConfigure(machine);
    };

    // Vuelve a la vista de lista de máquinas (cuando el usuario pulsa "Volver" o "Cancelar")
    const handleCancelConfiguration = () => {
        setMachineToConfigure(null);
    };

    // Manejador genérico para actualizar los inputs del formulario de configuración
    const handleChange = (e) => {
        const { name, value } = e.target;
        // Convertir a número con manejo de decimales
        const newValue = (name === 'RentingMeses') ? parseInt(value, 10) : parseFloat(value) || 0;
        
        setConfig(prevConfig => ({
            ...prevConfig,
            [name]: newValue,
        }));
    };

    // Guarda la configuración final de la máquina en el presupuesto y vuelve a la lista
    const handleSaveConfiguration = () => {
        if (!machineToConfigure) return;

        const finalMachineData = {
            ...machineToConfigure, // Datos originales (Id, Modelo, etc.)
            ...config, // Datos configurados (Precios, Renting)
            PrecioTotal, // Precio Total calculado
        };
        
        setConfiguredMachines(prev => [...prev, finalMachineData]);
        
        // Volver a la vista de lista
        handleCancelConfiguration(); 
    };

    if (!isOpen) return null;

    // --- 5. RENDERIZADO CONDICIONAL DE LA VISTA ---

    // Determina qué encabezado y qué cuerpo mostrar en el modal
    const isConfigView = machineToConfigure !== null;
    const modalTitle = isConfigView ? `Configurar: ${machineToConfigure.Maquina} - ${machineToConfigure.Modelo}` : 'Generar Presupuesto: Seleccionar Máquina';

    return (
        <div className="modal-backdrop" onClick={!isConfigView ? onClose : undefined}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>

                {/* --- CABECERA --- */}
                <div className="modal-header">
                    <h3>{modalTitle}</h3>
                    {/* Botón de cierre para la vista de lista, o botón de volver para la vista de configuración */}
                    <button 
                        className="close-button" 
                        onClick={isConfigView ? handleCancelConfiguration : onClose} 
                        aria-label={isConfigView ? "Volver a la lista de máquinas" : "Cerrar modal"}
                    >
                        {isConfigView ? '← Volver' : '×'}
                    </button>
                </div>

                {/* --- CUERPO DEL MODAL (Condicional) --- */}
                <div className="modal-body">
                    
                    {/* VISTA 1: LISTA DE MÁQUINAS (si machineToConfigure es null) */}
                    {!isConfigView && (
                        <div>
                            <h4>Máquinas disponibles:</h4>
                            <ul className="machine-list">
                                {availableMachines && availableMachines.map(machine => (
                                    <li 
                                        key={machine.Id} 
                                        onClick={() => handleSelectMachine(machine)}
                                        className="machine-item-clickable"
                                    >
                                        {/* Aquí el botón o elemento de la lista al que le haces clic */}
                                        <span style={{ fontWeight: 'bold', cursor: 'pointer' }}>
                                            {machine.Maquina} - {machine.Modelo}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                            <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                                <h4>Máquinas añadidas al presupuesto ({configuredMachines.length})</h4>
                                {/* Muestra el resumen de las máquinas ya configuradas */}
                                <ul>
                                    {configuredMachines.map((m, index) => (
                                        <li key={index}>
                                            {m.Maquina} ({m.RentingMeses} meses) - **{m.PrecioTotal.toFixed(2)} €**
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* VISTA 2: FORMULARIO DE CONFIGURACIÓN (si machineToConfigure no es null) */}
                    {isConfigView && (
                        <div className="configuration-form">
                            
                            {/* Campos del formulario */}
                            <fieldset>
                                <legend>Detalles de Venta</legend>
                                <div className="form-group">
                                    <label>Precio Máquina (€)</label>
                                    <input type="number" name="PrecioMaquina" value={config.PrecioMaquina} onChange={handleChange} min="0" step="0.01" />
                                </div>
                                <div className="form-group">
                                    <label>Rebaja (€)</label>
                                    <input type="number" name="Rebaja" value={config.Rebaja} onChange={handleChange} min="0" step="0.01" />
                                </div>
                                <div className="form-group total-field">
                                    <label>Precio Total (Calculado)</label>
                                    <strong>{PrecioTotal.toFixed(2)} €</strong>
                                </div>
                            </fieldset>

                            <fieldset>
                                <legend>Opciones de Renting y Costes</legend>
                                <div className="form-group">
                                    <label>Renting (Meses)</label>
                                    <input type="number" name="RentingMeses" value={config.RentingMeses} onChange={handleChange} min="12" max="72" />
                                </div>
                                <div className="form-group">
                                    <label>Coste Color (€/copia)</label>
                                    <input type="number" name="CosteColor" value={config.CosteColor} onChange={handleChange} min="0" step="0.001" />
                                </div>
                                <div className="form-group">
                                    <label>Coste Negro (€/copia)</label>
                                    <input type="number" name="CosteNegro" value={config.CosteNegro} onChange={handleChange} min="0" step="0.001" />
                                </div>
                            </fieldset>
                        </div>
                    )}
                </div>

                {/* --- PIE DE PÁGINA (Condicional) --- */}
                <div className="modal-footer">
                    {/* Botones para la Vista de Lista */}
                    {!isConfigView && (
                        <button className="btn btn-secondary" onClick={onClose}>
                            Cerrar
                        </button>
                    )}
                    
                    {/* Botones para la Vista de Configuración */}
                    {isConfigView && (
                        <>
                            <button className="btn btn-secondary" onClick={handleCancelConfiguration}>
                                Cancelar
                            </button>
                            <button className="btn btn-primary" onClick={handleSaveConfiguration}>
                                Añadir Máquina
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GenerateBudgetModal;
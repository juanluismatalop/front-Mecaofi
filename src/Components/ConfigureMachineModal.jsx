import React, { useState, useEffect } from 'react';

// Se asume que 'machine' es el objeto de la máquina seleccionada
// Por ejemplo: { Id: 1, Maquina: "Copier X", PrecioMaquina: 5000, NegroColor: 0.02 }

const ConfigureMachineModal = ({ isOpen, onClose, machine, onSaveConfiguration }) => {
    // 1. Inicializar el estado con los valores de la máquina
    const [config, setConfig] = useState({
        PrecioMaquina: machine?.PrecioMaquina || 0,
        Rebaja: 0,
        RentingMeses: 36, // Valor por defecto
        CosteColor: machine?.CosteColor || 0, // Asume que CosteColor viene del objeto machine
        CosteNegro: machine?.CosteNegro || 0, // Asume que CosteNegro viene del objeto machine
    });

    // 2. Cálculo Reactivo del Precio Total
    // El PrecioTotal se recalcula cada vez que cambian PrecioMaquina o Rebaja
    const PrecioTotal = config.PrecioMaquina - config.Rebaja;

    // Actualizar el estado si cambia la máquina seleccionada (útil si el modal se reutiliza)
    useEffect(() => {
        if (machine) {
            setConfig(prevConfig => ({
                ...prevConfig,
                PrecioMaquina: machine.PrecioMaquina || 0,
                CosteColor: machine.CosteColor || 0,
                CosteNegro: machine.CosteNegro || 0,
                Rebaja: 0, // Reiniciar la rebaja al cambiar de máquina
            }));
        }
    }, [machine]);

    // Manejador genérico para todos los inputs
    const handleChange = (e) => {
        const { name, value } = e.target;
        // Convertir a número si es un campo numérico
        setConfig(prevConfig => ({
            ...prevConfig,
            [name]: name === 'RentingMeses' ? parseInt(value, 10) : parseFloat(value) || 0,
        }));
    };

    // Manejador para guardar la configuración y cerrar
    const handleSave = () => {
        if (onSaveConfiguration) {
            // Se envía la configuración completa, incluyendo el PrecioTotal calculado
            onSaveConfiguration({
                ...machine, // Incluir toda la info de la máquina
                ...config,
                PrecioTotal,
            });
        }
        onClose();
    };

    if (!isOpen || !machine) return null;

    return (
        <div className="modal-backdrop-nested" onClick={onClose}>
            <div className="modal-content-nested" onClick={e => e.stopPropagation()}>
                
                {/* Cabecera con Botón de Cierre 'X' */}
                <div className="modal-header">
                    <h3>Configurar: {machine.Maquina} - {machine.Modelo}</h3>
                    <button className="close-button" onClick={onClose} aria-label="Cerrar configuración">&times;</button>
                </div>

                <div className="modal-body-form">
                    
                    {/* Sección de Precios y Descuentos */}
                    <fieldset>
                        <legend>Precios</legend>
                        <div className="form-group">
                            <label>Precio Máquina (€)</label>
                            <input
                                type="number"
                                name="PrecioMaquina"
                                value={config.PrecioMaquina}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                            />
                        </div>
                        <div className="form-group">
                            <label>Rebaja (€)</label>
                            <input
                                type="number"
                                name="Rebaja"
                                value={config.Rebaja}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                            />
                        </div>
                        <div className="precio-total">
                            <label>Precio Total</label>
                            {/* Mostrar el valor calculado */}
                            <strong>{PrecioTotal.toFixed(2)} €</strong>
                        </div>
                    </fieldset>

                    {/* Sección de Renting y Costes por Impresión */}
                    <fieldset>
                        <legend>Opciones Adicionales</legend>
                        <div className="form-group">
                            <label>Renting (Meses)</label>
                            <input
                                type="number"
                                name="RentingMeses"
                                value={config.RentingMeses}
                                onChange={handleChange}
                                min="12"
                                max="72"
                            />
                        </div>
                        <div className="form-group">
                            <label>Coste Color (€/copia)</label>
                            <input
                                type="number"
                                name="CosteColor"
                                value={config.CosteColor}
                                onChange={handleChange}
                                min="0"
                                step="0.001"
                            />
                        </div>
                        <div className="form-group">
                            <label>Coste Negro (€/copia)</label>
                            <input
                                type="number"
                                name="CosteNegro"
                                value={config.CosteNegro}
                                onChange={handleChange}
                                min="0"
                                step="0.001"
                            />
                        </div>
                    </fieldset>

                </div>

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                    <button className="btn btn-primary" onClick={handleSave}>Añadir al Presupuesto</button>
                </div>
            </div>
        </div>
    );
};

export default ConfigureMachineModal;
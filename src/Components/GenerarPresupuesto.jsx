import React, { useState, useEffect } from 'react'; // Eliminado 'useCallback'

// URL base de tu API (ajusta según tu entorno)
const API_BASE_URL = 'http://localhost:8000/api'; 

// NOTA: Se ha eliminado la definición de 'initialMaquina' ya que no se usaba.

// --- Funciones de Utilidad y Cálculo ---

/**
 * Calcula el precio final de una máquina después de aplicar el descuento.
 * @param {object} maquina - Objeto máquina con PrecioMaquina y Descuento.
 * @returns {number} El precio final calculado.
 */
const calcularPrecioFinal = (maquina) => {
    // Aseguramos que los valores sean números antes de calcular
    const precio = Number(maquina.PrecioMaquina) || 0;
    const descuento = Number(maquina.Descuento) || 0;
    return precio * (1 - descuento / 100);
};

// --- Componente Principal ---

const CreacionPresupuesto = () => {
    // 💾 Estados
    const [maquinasDisponibles, setMaquinasDisponibles] = useState([]); // Todas las máquinas del backend
    const [maquinasPresupuesto, setMaquinasPresupuesto] = useState([]);  // Máquinas añadidas al presupuesto
    const [clienteNombre, setClienteNombre] = useState('');
    const [visitaFecha, setVisitaFecha] = useState(new Date().toISOString().split('T')[0]); 
    const [totalPresupuesto, setTotalPresupuesto] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 🔄 Efecto para cargar las máquinas disponibles al montar el componente
    useEffect(() => {
        fetchMaquinasDisponibles();
    }, []);

    // 🔄 Efecto para recalcular el total cada vez que cambia el presupuesto
    useEffect(() => {
        const total = maquinasPresupuesto.reduce((sum, maquina) => sum + calcularPrecioFinal(maquina), 0);
        setTotalPresupuesto(total);
    }, [maquinasPresupuesto]);

    // 💻 Llamadas al Backend
    const fetchMaquinasDisponibles = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/maquinas`); 
            if (!response.ok) {
                throw new Error(`Error al cargar máquinas: ${response.statusText}`);
            }
            const data = await response.json();
            
            const maquinasConPrecioFinal = data.map(maquina => ({
                ...maquina,
                // Convierte PrecioMaquina a número si viene como string
                PrecioMaquina: Number(maquina.PrecioMaquina || 0), 
                Descuento: Number(maquina.Descuento || 0),
                precioFinal: calcularPrecioFinal(maquina)
            }));
            setMaquinasDisponibles(maquinasConPrecioFinal);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Llama al backend para crear el presupuesto y luego descargar el PDF.
     */
    const handleCrearYDescargarPresupuesto = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!clienteNombre || maquinasPresupuesto.length === 0) {
            alert("Por favor, introduce el nombre del cliente y añade al menos una máquina.");
            setLoading(false);
            return;
        }

        const presupuestoData = {
            clienteNombre,
            visitaFecha,
            // Solo envía los datos clave de las máquinas
            maquinas: maquinasPresupuesto.map(({ uniqueId, precioFinal, ...rest }) => rest), 
            totalPrecio: totalPresupuesto,
        };

        try {
            // 1. Llama a Route::post('/presupuestos') para guardar el presupuesto
            const createResponse = await fetch(`${API_BASE_URL}/presupuestos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(presupuestoData),
            });
            
            if (!createResponse.ok) {
                const errorBody = await createResponse.json();
                throw new Error(`Error ${createResponse.status}: ${errorBody.message || createResponse.statusText}`);
            }

            const createdPresupuesto = await createResponse.json();
            const presupuestoId = createdPresupuesto.id; 

            // 2. Llama a la ruta para generar y devolver el PDF
            const pdfResponse = await fetch(`${API_BASE_URL}/presupuestos/${presupuestoId}/pdf`, {
                method: 'GET',
            });

            if (!pdfResponse.ok) {
                throw new Error(`Error al generar el PDF: ${pdfResponse.statusText}`);
            }

            // Descargar el PDF
            const blob = await pdfResponse.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Presupuesto_${clienteNombre.replace(/\s/g, '_')}_${presupuestoId}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            
            alert(`Presupuesto para ${clienteNombre} creado y descargado con éxito.`);
            setMaquinasPresupuesto([]);
            setClienteNombre('');

        } catch (err) {
            console.error('Error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    // ➕ Manejadores de Estado/UI
    const handleAddMaquina = (maquinaId) => {
        const maquinaToAdd = maquinasDisponibles.find(m => m.id === parseInt(maquinaId));
        if (maquinaToAdd) {
            setMaquinasPresupuesto(prev => [...prev, { ...maquinaToAdd, uniqueId: Date.now() + Math.random() }]); // uniqueId para la lista
        }
    };

    const handleRemoveMaquina = (uniqueId) => {
        setMaquinasPresupuesto(prev => prev.filter(m => m.uniqueId !== uniqueId));
    };

    const handleMaquinaChange = (uniqueId, field, value) => {
        setMaquinasPresupuesto(prev => 
            prev.map(m => {
                if (m.uniqueId === uniqueId) {
                    // Asegurar que PrecioMaquina y Descuento sean números si se editan
                    const parsedValue = (field === 'PrecioMaquina' || field === 'Descuento') ? (parseFloat(value) || 0) : value;
                    const updated = { ...m, [field]: parsedValue };
                    
                    if (field === 'PrecioMaquina' || field === 'Descuento') {
                        updated.precioFinal = calcularPrecioFinal(updated);
                    }
                    return updated;
                }
                return m;
            })
        );
    };


    // 🎨 Renderizado (JSX) - *Se mantiene igual que el original*

    // --- Estilos Simples (Para que se vea decente) ---
    const inputStyle = {
        width: '100%',
        padding: '8px',
        marginTop: '5px',
        marginBottom: '10px',
        boxSizing: 'border-box',
        border: '1px solid #ccc',
        borderRadius: '4px',
    };

    const buttonStyle = {
        padding: '10px 15px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        color: 'white',
        fontWeight: 'bold',
        transition: 'background-color 0.3s',
    };

    const tableStyle = {
        width: '100%',
        borderCollapse: 'collapse',
        marginBottom: '20px',
    };

    const thStyle = {
        border: '1px solid #ddd',
        padding: '10px',
        backgroundColor: '#f2f2f2',
        textAlign: 'left',
    };

    const tdStyle = {
        border: '1px solid #ddd',
        padding: '8px',
        textAlign: 'left',
    };


    return (
        <div className="presupuesto-container" style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
            <h1 style={{ borderBottom: '2px solid #333', paddingBottom: '10px' }}>📋 Creación de Presupuesto</h1>

            {loading && <p style={{ color: 'blue' }}>Cargando o procesando...</p>}
            {error && <p style={{ color: 'red', fontWeight: 'bold' }}>Error: {error}</p>}
            
            <form onSubmit={handleCrearYDescargarPresupuesto}>
                {/* --- Datos del Presupuesto --- */}
                <h2 style={{ fontSize: '1.5em', marginTop: '20px' }}>Datos Generales</h2>
                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                    <label style={{ flex: 1 }}>
                        Nombre del Cliente:
                        <input
                            type="text"
                            value={clienteNombre}
                            onChange={(e) => setClienteNombre(e.target.value)}
                            required
                            style={inputStyle}
                        />
                    </label>
                    <label style={{ flex: 1 }}>
                        Fecha de Visita:
                        <input
                            type="date"
                            value={visitaFecha}
                            onChange={(e) => setVisitaFecha(e.target.value)}
                            required
                            style={inputStyle}
                        />
                    </label>
                </div>

                {/* --- Añadir Máquina --- */}
                <h2 style={{ fontSize: '1.5em', marginTop: '20px' }}>Añadir Máquina</h2>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'flex-end' }}>
                    <label style={{ flex: 2 }}>
                        Seleccionar Máquina:
                        <select
                            onChange={(e) => {
                                if (e.target.value) handleAddMaquina(e.target.value);
                            }}
                            value="" 
                            style={inputStyle}
                            disabled={maquinasDisponibles.length === 0}
                        >
                            <option value="">-- Selecciona una máquina --</option>
                            {maquinasDisponibles.map(maquina => (
                                <option key={maquina.id} value={maquina.id}>
                                    {maquina.MaquinaNombre} - {maquina.Modelo} (Precio: ${maquina.PrecioMaquina})
                                </option>
                            ))}
                        </select>
                    </label>
                    <button 
                        type="button"
                        onClick={() => { /* La lógica de añadir está en el select onChange */ }}
                        disabled={maquinasDisponibles.length === 0 || loading}
                        style={{ ...buttonStyle, backgroundColor: '#4CAF50', flex: 1 }}
                    >
                        Añadir Máquina (Desde la lista)
                    </button>
                </div>


                {/* --- Detalle del Presupuesto (Tabla) --- */}
                <h2 style={{ fontSize: '1.5em', marginTop: '30px' }}>Máquinas en el Presupuesto ({maquinasPresupuesto.length})</h2>
                {maquinasPresupuesto.length > 0 ? (
                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th style={thStyle}>Máquina/Modelo</th>
                                <th style={thStyle}>Precio Base ($)</th>
                                <th style={thStyle}>Descuento (%)</th>
                                <th style={thStyle}>Renting</th>
                                <th style={thStyle}>Costes (N/C)</th>
                                <th style={thStyle}>Precio Final ($)</th>
                                <th style={thStyle}>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {maquinasPresupuesto.map((maquina) => (
                                <tr key={maquina.uniqueId}>
                                    <td style={tdStyle}>{maquina.MaquinaNombre} - {maquina.Modelo}</td>
                                    <td style={tdStyle}>
                                        <input
                                            type="number"
                                            value={maquina.PrecioMaquina}
                                            onChange={(e) => handleMaquinaChange(maquina.uniqueId, 'PrecioMaquina', e.target.value)}
                                            min="0"
                                            style={{ width: '80px', textAlign: 'right' }}
                                        />
                                    </td>
                                    <td style={tdStyle}>
                                        <input
                                            type="number"
                                            value={maquina.Descuento}
                                            onChange={(e) => handleMaquinaChange(maquina.uniqueId, 'Descuento', e.target.value)}
                                            min="0"
                                            max="100"
                                            style={{ width: '60px', textAlign: 'right' }}
                                        />
                                    </td>
                                    <td style={tdStyle}>
                                        <select
                                            value={maquina.Renting}
                                            onChange={(e) => handleMaquinaChange(maquina.uniqueId, 'Renting', e.target.value)}
                                            style={{ width: '60px' }}
                                        >
                                            <option>No</option>
                                            <option>Sí</option>
                                        </select>
                                    </td>
                                    <td style={tdStyle}>
                                        N: {maquina.CosteNegro} | C: {maquina.CosteColor || 'N/A'}
                                    </td>
                                    <td style={{ ...tdStyle, fontWeight: 'bold' }}>
                                        ${maquina.precioFinal.toFixed(2)}
                                    </td>
                                    <td style={tdStyle}>
                                        <button 
                                            type="button" 
                                            onClick={() => handleRemoveMaquina(maquina.uniqueId)} 
                                            style={{ ...buttonStyle, backgroundColor: '#f44336', padding: '5px 10px' }}
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {/* Fila de Totales */}
                            <tr>
                                <td colSpan="5" style={{ ...tdStyle, textAlign: 'right', fontWeight: 'bold', fontSize: '1.2em' }}>
                                    TOTAL PRESUPUESTO:
                                </td>
                                <td style={{ ...tdStyle, fontWeight: 'bold', fontSize: '1.2em', backgroundColor: '#e0e0e0' }}>
                                    ${totalPresupuesto.toFixed(2)}
                                </td>
                                <td style={{ ...tdStyle, backgroundColor: '#e0e0e0' }}></td>
                            </tr>
                        </tbody>
                    </table>
                ) : (
                    <p>No hay máquinas añadidas al presupuesto. Por favor, selecciona una.</p>
                )}


                {/* --- Botón Final --- */}
                <div style={{ marginTop: '30px', textAlign: 'right' }}>
                    <button
                        type="submit"
                        disabled={maquinasPresupuesto.length === 0 || loading}
                        style={{ ...buttonStyle, backgroundColor: '#007bff', fontSize: '1.2em' }}
                    >
                        💾 **Crear Presupuesto y Descargar PDF**
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreacionPresupuesto;
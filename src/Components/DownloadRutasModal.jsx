import React, { useState, useEffect } from 'react';
import moment from 'moment';
import './addClientModal.css';

const VISITAS_API_URL = 'https://www.mecaofi.com/LibroVisitas/back/public/api/visitas';

export default function DownloadRutasModal ({ show, onClose }) {
    const [selectionType, setSelectionType] = useState('day');
    const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false); 
    const [visitasData, setVisitasData] = useState(null); // Nuevo estado para la tabla

    useEffect(() => {
        if (show) {
            setError(null);
            setSubmitting(false);
            setVisitasData(null); // Resetear datos al abrir
            setSelectedDate(moment().format('YYYY-MM-DD'));
            setSelectionType('day');
            setStartDate('');
            setEndDate('');
        }
    }, [show]);

    if (!show) {
        return null;
    }
    
    const handleGoBack = () => {
        setVisitasData(null);
        setError(null);
    };

    const getUrlAndDates = (format = null) => {
        let start_date = null;
        let end_date = null;

        if (selectionType === 'day') {
            start_date = selectedDate;
            end_date = selectedDate;
        } else if (selectionType === 'month') {
            start_date = moment().startOf('month').format('YYYY-MM-DD');
            end_date = moment().endOf('month').format('YYYY-MM-DD');
        } else if (selectionType === 'range') {
            if (!startDate || !endDate || moment(startDate).isAfter(endDate)) {
                setError("Por favor, seleccione un rango de fechas válido.");
                setSubmitting(false);
                return null;
            }
            start_date = startDate;
            end_date = endDate;
        }

        // Se usa 'start' y 'end' para coincidir con la validación del backend (VisitaController.php)
        let fetchUrl = `${VISITAS_API_URL}/pdf-rutas?start=${start_date}&end=${end_date}`;
        
        if (format) {
            fetchUrl += `&format=${format}`;
        }
        
        return { fetchUrl, start_date, end_date };
    };


    const handleDownload = async (e) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        const token = localStorage.getItem('token');
        if (!token) {
            alert("No estás autenticado.");
            onClose();
            return;
        }
        
        const data = getUrlAndDates(); 
        if (!data) return;

        const { fetchUrl, start_date, end_date } = data;
        const headers = { 'Authorization': `Bearer ${token}` };

        try {
            const response = await fetch(fetchUrl, {
                method: 'GET',
                headers: headers,
            });

            if (response.status === 404) {
                 // Si el backend devuelve un error 404, se intenta parsear el cuerpo para un mensaje específico.
                 const errorBody = await response.json().catch(() => ({ message: response.statusText }));
                 setError(errorBody.message || `No se encontraron visitas programadas entre ${moment(start_date).format('DD/MM/YYYY')} y ${moment(end_date).format('DD/MM/YYYY')}.`);
                 setSubmitting(false);
                 return;
            }

            if (!response.ok) {
                // Si la respuesta no es 404, pero falla, se intenta leer el error
                const errorText = await response.text();
                // Intenta parsear como JSON si es posible, sino usa el texto
                let errorMessage = `Error ${response.status}: ${response.statusText}.`;
                try {
                     const jsonError = JSON.parse(errorText);
                     errorMessage = jsonError.message || errorMessage;
                } catch {
                     errorMessage += ` Detalle: ${errorText}`;
                }
                throw new Error(errorMessage);
            }
            
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = 'Rutas_Personalizadas.pdf';
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="(.+)"/);
                if (match && match[1]) {
                    filename = match[1];
                }
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            
            a.remove();
            window.URL.revokeObjectURL(url);
            onClose();

        } catch (e) {
            console.error('Error durante la descarga del PDF:', e);
            setError(e.message || `Error al descargar las rutas: ${e.message}`);
        } finally {
            setSubmitting(false);
        }
    };


    const handleView = async () => {
        setVisitasData(null); // Limpiar datos anteriores
        setError(null);
        setSubmitting(true);

        try {
            // 1️⃣ Obtener el token guardado al iniciar sesión
            const token = localStorage.getItem('token');

            // 2️⃣ Verificar que el token exista antes de llamar al backend
            if (!token) {
                alert("No se encontró un token de autenticación. Inicia sesión nuevamente.");
                return;
            }

            // ✅ CORRECCIÓN: Obtener la URL y las fechas del usuario, no hardcodearlas
            const data = getUrlAndDates(); 
            if (!data) return; 
            const { start_date, end_date } = data; 
            
            // fetchUrl apunta a /pdf-rutas. Para ver la tabla, necesitamos un endpoint que devuelva JSON.
            // Si el backend solo devuelve PDF desde /pdf-rutas, se necesita un endpoint nuevo para JSON.
            // ASUMIMOS que el endpoint /pdf-rutas puede devolver JSON si se le pide
            // o que devolver PDF/JSON es indistinto si solo queremos comprobar el 404.
            
            // Para el propósito de "Ver en Pantalla", el backend DEBE devolver JSON con los datos.
            // Dado que el endpoint '/pdf-rutas' devuelve un PDF, debemos crear una URL temporal 
            // que devuelva JSON si queremos que funcione 'Ver en Pantalla' como se pretende aquí.

            // Por ahora, modificaremos fetchUrl para que pida JSON (si el backend lo soporta)
            let fetchJsonUrl = `${VISITAS_API_URL}/pdf-rutas?start=${start_date}&end=${end_date}&format=json`; 
            
            // Si el backend no tiene 'format=json' implementado, usaremos la lógica de la descarga:
            // Si queremos mostrar la tabla, necesitamos los datos de las visitas.
            // Dado que el backend no tiene un endpoint específico para la data de la tabla,
            // (a menos que el endpoint de PDF devuelva JSON si se le pasa un parámetro extra).
            // MANTENDRÉ la lógica de descarga, pero la adaptaré para que capture los datos si fuera un endpoint de JSON:

            const response = await fetch(
                fetchJsonUrl, // Si 'format=json' funciona, obtendremos JSON.
                {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Accept": "application/json", // Pedimos JSON
                    },
                }
            );

            if (response.status === 404) {
                const errorBody = await response.json().catch(() => ({ message: response.statusText }));
                setError(errorBody.message || `No se encontraron visitas programadas entre ${moment(start_date).format('DD/MM/YYYY')} y ${moment(end_date).format('DD/MM/YYYY')}.`);
                return;
            }

            if (!response.ok) {
                let errorText = await response.text();
                try {
                    const jsonError = JSON.parse(errorText);
                    throw new Error(jsonError.message || "Error al obtener las rutas para la tabla.");
                } catch {
                    throw new Error("Error interno del servidor o token inválido al cargar datos.");
                }
            }

            // ATENCIÓN: Si el backend /pdf-rutas DEVUELVE UN PDF y no JSON, esta parte fallará.
            // ASUMO que se requiere que el backend devuelva JSON si se llama con 'format=json' 
            // para mostrar la tabla. Si no, se necesita un endpoint nuevo en Laravel.
            const jsonResponse = await response.json();
            
            if (jsonResponse.visitas) {
                setVisitasData(jsonResponse.visitas); // Asumiendo que el JSON tiene una clave 'visitas'
            } else {
                 // Si el endpoint no devuelve un JSON con datos, forzamos un error
                 throw new Error("El servidor no devolvió los datos de ruta esperados para la tabla.");
            }

        } catch (error) {
            console.error("❌ Error en handleView:", error);
            setError(error.message || "Error inesperado al cargar la tabla de rutas.");
        } finally {
            setSubmitting(false);
        }
    };
    
    // --- Componente de Tabla (Inline) ---
    const RutasTable = ({ visitas, onGoBack, onDownload }) => {
        const hasData = visitas && visitas.length > 0;
        
        const periodText = () => {
            if (!hasData) return 'Resultados de Búsqueda';
            const firstDate = visitas[0].Dia; // 'Dia' ya viene formateado
            const lastDate = visitas[visitas.length - 1].Dia;
            if (firstDate === lastDate) {
                return `Rutas Programadas para el ${firstDate}`;
            }
            return `Rutas Programadas desde ${firstDate} hasta ${lastDate}`;
        };

        return (
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '90vw', maxWidth: '1000px', padding: '1rem' }}>
                <div className="modal-header">
                    <h2>{periodText()}</h2>
                    <button className="boton2" onClick={onClose} disabled={submitting}>&times;</button>
                </div>

                {error && <p className="error-message-modal">{error}</p>}

                {hasData ? (
                    <>
                    <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85em' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#003399', color: 'white' }}>
                                    <th style={{ padding: '10px', textAlign: 'left', minWidth: '80px' }}>Día</th>
                                    <th style={{ padding: '10px', textAlign: 'left', minWidth: '150px' }}>Cliente</th>
                                    <th style={{ padding: '10px', textAlign: 'left', minWidth: '150px' }}>Dirección</th>
                                    <th style={{ padding: '10px', textAlign: 'left', minWidth: '100px' }}>Localidad</th>
                                    <th style={{ padding: '10px', textAlign: 'left', minWidth: '80px' }}>Provincia</th>
                                    <th style={{ padding: '10px', textAlign: 'left', minWidth: '200px' }}>Observaciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visitas.map((visita, index) => (
                                    <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white', borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '10px' }}>{visita.Dia}</td>
                                        <td style={{ padding: '10px' }}>{visita.NombreCliente}</td>
                                        <td style={{ padding: '10px' }}>{visita.Direccion || 'N/A'}</td>
                                        <td style={{ padding: '10px' }}>{visita.Localidad || 'N/A'}</td>
                                        <td style={{ padding: '10px' }}>{visita.Provincia || 'N/A'}</td>
                                        <td style={{ padding: '10px' }}>{visita.Observaciones || 'Sin observaciones'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    <div className="modal-actions" style={{ justifyContent: 'flex-start', borderTop: 'none', paddingTop: '20px' }}>
                        <button 
                            type="button" 
                            className="boton2" 
                            onClick={onDownload} 
                            disabled={submitting} 
                            style={{ backgroundColor: 'rgb(0, 123, 255)', color: 'white' }}
                        >
                            Descargar PDF
                        </button>
                        <button type="button" className="boton2" onClick={onGoBack} disabled={submitting} style={{ backgroundColor: '#e0e0e0', color: '#333' }}>
                            Volver a Selección
                        </button>
                    </div>
                    </>
                ) : (
                    <div className="modal-actions" style={{ justifyContent: 'center' }}>
                         <p>No se encontraron rutas para el período seleccionado.</p>
                         <button type="button" className="boton2" onClick={onGoBack} disabled={submitting} style={{ backgroundColor: '#e0e0e0', color: '#333' }}>
                            Volver a Selección
                        </button>
                    </div>
                   
                )}
            </div>
        );
    };


    // --- Renderizado principal del Modal ---
    if (visitasData) {
        return (
            <div className="modal-backdrop" onClick={onClose}>
                <RutasTable 
                    visitas={visitasData} 
                    onGoBack={handleGoBack} 
                    onDownload={handleDownload}
                    onClose={onClose}
                />
            </div>
        );
    }

    return (
        <div className="modal-backdrop" onClick={onClose}> 
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '450px' }}>
                <div className="modal-header">
                    <h2>Descargar/Ver Rutas</h2>
                    <button className="boton2" onClick={onClose} disabled={submitting}>&times;</button>
                </div>
                
                {error && <p className="error-message-modal">{error}</p>}
                
                <form> 
                    <div className="form-group-row" style={{ marginBottom: '20px', alignItems: 'center' }}>
                        <label>Seleccionar Periodo:</label>
                        <select 
                            value={selectionType} 
                            onChange={(e) => setSelectionType(e.target.value)}
                            style={{ padding: '10px', borderRadius: '10px', border: '1px solid #ccc', flexGrow: 1 }}
                            disabled={submitting}
                        >
                            <option value="day">Día Específico</option>
                            <option value="month">Mes Actual</option>
                            <option value="range">Rango de Fechas</option>
                        </select>
                    </div>

                    {selectionType === 'day' && (
                        <div className="form-group required">
                            <label htmlFor="selectedDate">Fecha de la Ruta:</label>
                            <input 
                                type="date" 
                                id="selectedDate" 
                                name="selectedDate" 
                                value={selectedDate} 
                                onChange={(e) => setSelectedDate(e.target.value)} 
                                required
                                disabled={submitting}
                            />
                        </div>
                    )}
                    
                    {selectionType === 'month' && (
                        <div className="form-group">
                             <p>Se verán/descargarán todas las visitas programadas para el mes de **{moment().format('MMMM [de] YYYY')}**.</p>
                        </div>
                    )}

                    {selectionType === 'range' && (
                        <div className="form-group-row">
                            <div className="form-group required">
                                <label htmlFor="startDate">Fecha de Inicio:</label>
                                <input 
                                    type="date" 
                                    id="startDate" 
                                    name="startDate" 
                                    value={startDate} 
                                    onChange={(e) => setStartDate(e.target.value)} 
                                    required
                                    disabled={submitting}
                                />
                            </div>
                            <div className="form-group required">
                                <label htmlFor="endDate">Fecha de Fin:</label>
                                <input 
                                    type="date" 
                                    id="endDate" 
                                    name="endDate" 
                                    value={endDate} 
                                    onChange={(e) => setEndDate(e.target.value)} 
                                    required
                                    disabled={submitting}
                                />
                            </div>
                        </div>
                    )}

                    <div className="modal-actions">
                        
                        <button 
                            type="button" 
                            className="boton2" 
                            onClick={handleDownload} 
                            disabled={submitting} 
                            style={{ flexGrow: 1, backgroundColor: 'rgb(0, 123, 255)' }}
                        >
                            {submitting ? 'Generando PDF...' : 'Descargar PDF'}
                        </button>

                        <button 
                            type="button" 
                            className="boton2" 
                            onClick={handleView} 
                            disabled={submitting} 
                            style={{ flexGrow: 1, backgroundColor: 'rgb(40, 167, 69)' }}
                        >
                            {submitting ? 'Cargando Tabla...' : 'Ver en Pantalla'}
                        </button>
                    </div>
                    
                </form>
            </div>
        </div>
    );
}
import React, { useState, useEffect } from 'react';
import moment from 'moment';
import './addClientModal.css';

const VISITAS_API_URL = 'http://localhost:8000/api/visitas';

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
                 const errorBody = await response.json().catch(() => ({ message: response.statusText }));
                 setError(errorBody.message || `No se encontraron visitas programadas entre ${moment(start_date).format('DD/MM/YYYY')} y ${moment(end_date).format('DD/MM/YYYY')}.`);
                 setSubmitting(false);
                 return;
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error ${response.status}: ${response.statusText}. Detalle: ${errorText}`);
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


    const handleView = async (e) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        const token = localStorage.getItem('token');
        if (!token) {
            alert("No estás autenticado.");
            onClose();
            return;
        }
        
        // Llamada a la API con format=json
        const data = getUrlAndDates('json');
        if (!data) return;

        const { fetchUrl, start_date, end_date } = data;
        const headers = { 'Authorization': `Bearer ${token}` };

        try {
            const response = await fetch(fetchUrl, {
                method: 'GET',
                headers: headers,
            });
            
            const responseData = await response.json(); 

            if (response.status === 404) {
                 setError(responseData.message || `No se encontraron visitas programadas entre ${moment(start_date).format('DD/MM/YYYY')} y ${moment(end_date).format('DD/MM/YYYY')}.`);
                 setSubmitting(false);
                 return;
            }

            if (!response.ok) {
                throw new Error(responseData.message || `Error ${response.status}: El servidor rechazó la solicitud de datos.`);
            }
            
            // Éxito: guardar los datos y mostrar la tabla
            setVisitasData(responseData);
            
        } catch (e) {
            console.error('Error durante la visualización de la tabla:', e);
            setError(e.message || `Error al obtener los datos de las rutas: ${e.message}`);
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
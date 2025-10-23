import React, { useState, useEffect } from 'react';
import moment from 'moment';
import './addClientModal.css';

const VISITAS_API_URL = 'http://localhost:3000/api/visitas';

export default function DownloadRutasModal ({ show, onClose }) {
    const [selectionType, setSelectionType] = useState('day');
    const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (show) {
            setError(null);
            setSubmitting(false);
            setSelectedDate(moment().format('YYYY-MM-DD'));
            setSelectionType('day');
            setStartDate('');
            setEndDate('');
        }
    }, [show]);

    if (!show) {
        return null;
    }

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
        
        let fetchUrl = `${VISITAS_API_URL}/pdf-rutas`;
        const headers = { 'Authorization': `Bearer ${token}` };
        
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
                return;
            }
            start_date = startDate;
            end_date = endDate;
        }

        fetchUrl += `?start=${start_date}&end=${end_date}`;

        try {
            const response = await fetch(fetchUrl, {
                method: 'GET',
                headers: headers,
            });

            if (response.status === 404) {
                 setError(`No se encontraron visitas programadas entre ${moment(start_date).format('DD/MM/YYYY')} y ${moment(end_date).format('DD/MM/YYYY')}.`);
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


    return (
        <div className="modal-backdrop" onClick={onClose}> 
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '450px' }}>
                <div className="modal-header">
                    <h2>Descargar Rutas</h2>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>
                
                {error && <p className="error-message-modal">{error}</p>}
                
                <form onSubmit={handleDownload}>
                    <div className="form-group-row" style={{ marginBottom: '20px' }}>
                        <label>Seleccionar Periodo:</label>
                        <select 
                            value={selectionType} 
                            onChange={(e) => setSelectionType(e.target.value)}
                            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', marginLeft: '10px' }}
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
                            />
                        </div>
                    )}
                    
                    {selectionType === 'month' && (
                        <p>Se descargarán todas las visitas programadas para el mes de **{moment().format('MMMM [de] YYYY')}**.</p>
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
                                />
                            </div>
                        </div>
                    )}

                    <button type="submit" className="submit-button" disabled={submitting} style={{ marginTop: '20px' }}>
                        {submitting ? 'Generando PDF...' : 'Descargar PDF de Rutas'}
                    </button>
                    
                </form>
            </div>
        </div>
    );
}
import React, { useEffect, useState, useMemo } from 'react';
import './viewCalendarModal.css';

const generateCalendarDays = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const startingDay = (firstDayOfMonth.getDay() + 6) % 7; // lunes = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = [];
  let day = 1;
  let week = Array(startingDay).fill(null);

  while (day <= daysInMonth) {
    week.push(new Date(year, month, day));
    if (week.length === 7) {
      calendarDays.push(week);
      week = [];
    }
    day++;
  }

  if (week.length) {
    while (week.length < 7) week.push(null);
    calendarDays.push(week);
  }

  return calendarDays;
};

// ⭐️ MODIFICADO: Añadimos la prop onViewClient ⭐️
export default function ViewCalendarModal({ show, onClose, visitas, onViewClient }) {
  const [visitasConNombres, setVisitasConNombres] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date(2025, 10, 1)); // noviembre 2025
  const [transitionDirection, setTransitionDirection] = useState('none'); // 'left' o 'right'

  // Procesa las visitas, asegurando que tengamos el objeto cliente completo
  useEffect(() => {
    if (!visitas.length) return;

    const visitasProcesadas = visitas.map((v) => ({
      ...v,
      NombreCliente:
        v.cliente?.Nombre ||
        v.NombreCliente ||
        'Cliente desconocido',
      clientData: v.cliente, // ⭐️ CRÍTICO: Guardamos el objeto cliente completo
    }));

    // Filtramos cualquier visita que no tenga un objeto cliente asociado
    setVisitasConNombres(visitasProcesadas.filter(v => v.clientData)); 
  }, [visitas]);

  // Agrupar visitas por fecha
  const visitasPorFecha = useMemo(() => {
    return visitasConNombres.reduce((acc, visita) => {
      const date = visita.Fecha ? visita.Fecha.split('T')[0] : null;
      if (date) acc[date] = [...(acc[date] || []), visita];
      return acc;
    }, {});
  }, [visitasConNombres]);
    
  // ⭐️ NUEVO HANDLER: Función para abrir el modal del cliente
  const handleVisitClick = (visita) => {
      // Solo procede si tenemos los datos del cliente y la función del padre
      if (visita.clientData && onViewClient) {
          onClose(); // 1. Cierra el modal de calendario
          onViewClient(visita.clientData); // 2. Llama a la función del padre pasando el cliente
      }
  };


  const calendar = useMemo(() => generateCalendarDays(currentDate), [currentDate]);

  if (!show) return null;

  // Navegación de meses
  const nextMonth = () => {
    setTransitionDirection('left');
    setTimeout(() => {
      setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
      setTransitionDirection('none');
    }, 200);
  };

  const prevMonth = () => {
    setTransitionDirection('right');
    setTimeout(() => {
      setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
      setTransitionDirection('none');
    }, 200);
  };

  const isToday = (day) =>
    day && day.toDateString() === new Date().toDateString();

  return (
    <div className="gc-modal-overlay" onClick={onClose}>
      <div className="gc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="gc-header">
          <div className="gc-month-nav">
            <button onClick={prevMonth} className="gc-nav-btn">‹</button>
            <h2>{currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</h2>
            <button onClick={nextMonth} className="gc-nav-btn">›</button>
          </div>
          <button className="gc-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className={`gc-calendar ${transitionDirection}`}>
          <div className="gc-weekdays">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="gc-grid">
            {calendar.map((week, i) =>
              week.map((day, j) => {
                const dateString = day ? day.toISOString().split('T')[0] : null;
                const dayVisitas = dateString ? visitasPorFecha[dateString] || [] : [];

                return (
                  <div
                    key={`${i}-${j}`}
                    className={`gc-day ${day ? '' : 'empty'} ${isToday(day) ? 'today' : ''}`}
                  >
                    {day && (
                      <>
                        <div className="gc-day-number">{day.getDate()}</div>
                        {dayVisitas.map((v, idx) => (
                          <div 
                            key={idx} 
                            // ⭐️ AÑADIDO: Clase y Manejador de clic en el día
                            className={`gc-event ${v.clientData ? 'clickable-event' : ''}`} 
                            onClick={() => handleVisitClick(v)}
                            title={v.clientData ? `Ver cliente: ${v.NombreCliente}` : 'Cliente no disponible'}
                          >
                            {v.Hora ? `${v.Hora} — ` : ''}{v.NombreCliente}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="gc-visits-summary">
          <h4>Visitas del mes ({visitasConNombres.length})</h4>
          <div className="gc-visits-list">
            {visitasConNombres.length === 0 ? (
              <p>No hay visitas programadas.</p>
            ) : (
              <ul>
                {visitasConNombres.map((v, i) => (
                  <li 
                    key={i}
                    // ⭐️ AÑADIDO: Manejador de clic en el resumen
                    onClick={() => handleVisitClick(v)}
                    style={{ cursor: v.clientData ? 'pointer' : 'default' }}
                    title={v.clientData ? `Ver cliente: ${v.NombreCliente}` : 'Cliente no disponible'}
                  >
                    <strong>
                      {v.Fecha.split('T')[0]} {v.Hora || ''}
                    </strong>{' '}
                    — {v.NombreCliente}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import './ViewCalendarModal.css'; // ✅ CSS ya existe

// --- Generador de días del calendario ---
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

export default function ViewCalendarModal({ 
  show, 
  onClose, 
  visitas = [], 
  comerciales = [], 
  onViewClient, 
  userId, 
  ADMIN_ID 
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transitionDirection, setTransitionDirection] = useState('center');
  const [selectedComercialId, setSelectedComercialId] = useState('all');
  
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  const isAdmin = useMemo(() => userId === ADMIN_ID, [userId, ADMIN_ID]);

  // --- EFECTO DE INICIALIZACIÓN ---
  useEffect(() => {
    if (show && userId !== null) {
      console.log("📅 Modal abierto. Visitas recibidas:", visitas.length);
      console.log("📅 Comerciales recibidos:", comerciales.length);
      
      // Configurar el filtro inicial
      if (!isAdmin && userId) {
        setSelectedComercialId(userId.toString());
      } else if (isAdmin) {
        setSelectedComercialId('all');
      }
    }
    
    // Resetear al cerrar el modal
    if (!show) {
      setSelectedComercialId('all');
      setCurrentDate(new Date());
    }
  }, [show, userId, isAdmin]);

  // --- FILTRADO ---
  const filteredVisitas = useMemo(() => {
    try {
      if (!visitas || visitas.length === 0) {
        return [];
      }
      
      // Mantenemos SOLO las visitas que tienen ProximaFecha definida para el calendario
      let result = visitas.filter(v => v.ProximaFecha);
      const filterId = parseInt(selectedComercialId, 10);

      // 1. Filtrado para usuario no-admin
      if (!isAdmin && userId !== null) {
        result = result.filter(v => {
          const visitaComercialId = parseInt(v.IdComercial, 10);
          return visitaComercialId === userId;
        });
      }
      
      // 2. Filtrado para usuario admin
      if (isAdmin && selectedComercialId !== 'all') {
        result = result.filter(v => {
          const visitaComercialId = parseInt(v.IdComercial, 10);
          return visitaComercialId === filterId;
        });
      }
      
      return result;
      
    } catch (error) {
      console.error("❌ Error en filtrado de visitas:", error);
      return [];
    }
  }, [visitas, selectedComercialId, isAdmin, userId]);

  // --- Agrupar visitas por Próxima Fecha ---
  const groupedVisitas = useMemo(() => {
    const groups = {};
    try {
      filteredVisitas.forEach(v => {
        // CAMBIO: Usamos ProximaFecha
        if (v && v.ProximaFecha) {
          // Usamos la cadena literal YYYY-MM-DD (la clave)
          const dateKey = v.ProximaFecha.split('T')[0]; 
          if (dateKey) {
            if (!groups[dateKey]) {
              groups[dateKey] = [];
            }
            groups[dateKey].push(v);
          }
        }
      });
    } catch (error) {
      console.error("❌ Error agrupando visitas:", error);
    }
    return groups; 
  }, [filteredVisitas]);

  const getDailyVisitas = (date) => {
    if (!date) return [];
    try {
      // 🚀 CORRECCIÓN FINAL: Usamos métodos LOCALES (getFullYear, getMonth, getDate)
      // para crear la clave. Esto coincide con la fecha que se muestra en la celda
      // del calendario (que es local) y se alinea con la clave YYYY-MM-DD
      // extraída de la cadena del servidor.
      const year = date.getFullYear();
      // getMonth() es base 0, por eso se suma 1
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`; 
      
      return groupedVisitas[dateKey] || []; 
    } catch (error) {
      return [];
    }
  };
  
  const handleMonthChange = (direction) => {
    setTransitionDirection(direction);
    setTimeout(() => {
      setCurrentDate(prevDate => {
        const newDate = new Date(prevDate.getFullYear(), prevDate.getMonth() + (direction === 'next' ? 1 : -1), 1);
        return newDate;
      });
      setTransitionDirection('center');
    }, 200);
  };

  const handleVisitClick = (visit) => {
    if (visit && visit.cliente) {
      // Las visitas de Laravel vienen con `visita.cliente` anidado.
      onViewClient(visit.cliente); 
    } else {
      console.warn("⚠️ No hay datos del cliente para esta visita o la estructura es incorrecta:", visit);
    }
  };

  if (!show) return null; 

  const calendarDays = generateCalendarDays(currentDate);
  const monthTitle = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  // Usa la fecha de hoy en formato ISO, sin hora (para la clase 'today')
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="gc-modal-overlay" onClick={onClose}>
      <div className="gc-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="gc-header">
          <div className="gc-month-nav">
            <button className="gc-nav-btn" onClick={() => handleMonthChange('prev')} title="Mes anterior">
              &lt;
            </button>
            <h2>{monthTitle}</h2>
            <button className="gc-nav-btn" onClick={() => handleMonthChange('next')} title="Mes siguiente">
              &gt;
            </button>
          </div>
          <button className="gc-close" onClick={onClose} title="Cerrar">&times;</button>
          {isAdmin && (
          <div className="gc-filter-bar">
            <label htmlFor="comercialFilter">Filtrar por Comercial:</label>
            <select
              id="comercialFilter"
              value={selectedComercialId}
              onChange={(e) => setSelectedComercialId(e.target.value)}
            >
              <option value="all">Todos los comerciales</option>
              {comerciales && comerciales
                .filter(c => c.Id !== ADMIN_ID) 
                .map(c => (
                  <option key={c.Id} value={c.Id}>
                    {c.Nombre}
                  </option>
                ))}
            </select>
          </div>
        )}
        </div>
        

        {/* Contenido del Calendario */}
        <div className="gc-calendar">
          <div className="gc-weekdays">
            {dayNames.map(day => <div key={day}>{day}</div>)}
          </div>
          
          <div className="gc-grid">
            {calendarDays.map((week, weekIndex) => 
              week.map((date, dayIndex) => {
                const isToday = date && date.toISOString().split('T')[0] === today;
                const dailyVisitas = getDailyVisitas(date); 
                
                return (
                  <div 
                    key={`${weekIndex}-${dayIndex}`} 
                    className={`gc-day ${date ? '' : 'empty'} ${isToday ? 'today' : ''}`}
                  >
                    {date && (
                      <>
                        <div className="gc-day-number">{date.getDate()}</div>
                        {dailyVisitas.map((visit, i) => (
                          <div 
                            key={i}
                            className={`gc-event ${visit.cliente ? 'clickable-event' : ''}`} 
                            onClick={() => handleVisitClick(visit)}
                            title={`Próx. Visita | Comercial: ${visit.comercial?.Nombre || 'N/A'} | Cliente: ${visit.cliente?.Nombre || 'N/A'}`}
                          >
                            {visit.Hora ? `${visit.Hora} — ` : ''}{visit.cliente?.Nombre || 'Cliente Desconocido'} 
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

        {/* Resumen de Visitas */}
        <div className="gc-visits-summary">
          <h4>Próximas Visitas del mes ({filteredVisitas.length})</h4> 
          <div className="gc-visits-list">
            {filteredVisitas.length === 0 ? (
              <p>No hay próximas visitas programadas para este filtro.</p>
            ) : (
              <ul>
                {filteredVisitas.map((visit, i) => (
                  <li 
                    key={i}
                    onClick={() => handleVisitClick(visit)}
                    style={{ cursor: visit.cliente ? 'pointer' : 'default' }} 
                    title={visit.cliente ? `Ver cliente: ${visit.cliente.Nombre}` : 'Cliente no disponible'}
                  >
                    <strong>
                      {/* Mostramos ProximaFecha */}
                      {visit.ProximaFecha.split('T')[0]} {visit.Hora || ''} 
                    </strong>{' '}
                    — {visit.cliente?.Nombre || 'Cliente Desconocido'}
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
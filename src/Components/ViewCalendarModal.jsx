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
      
      let result = visitas;
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

  // --- Agrupar visitas por fecha ---
  const groupedVisitas = useMemo(() => {
    const groups = {};
    try {
      filteredVisitas.forEach(v => {
        if (v && v.Fecha) {
          const dateKey = v.Fecha.split('T')[0]; 
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
      const dateKey = date.toISOString().split('T')[0];
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
    if (visit && visit.clientData) {
      onViewClient(visit.clientData);
    } else {
      console.warn("⚠️ No hay datos del cliente para esta visita:", visit);
    }
  };

  if (!show) return null; 

  const calendarDays = generateCalendarDays(currentDate);
  const monthTitle = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
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
        </div>

        {/* FILTRO COMERCIAL (solo para Admin) */}
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
                            className={`gc-event ${visit.clientData ? 'clickable-event' : ''}`}
                            onClick={() => handleVisitClick(visit)}
                            title={`Comercial: ${visit.NombreComercial || 'N/A'} | Cliente: ${visit.NombreCliente || 'N/A'}`}
                          >
                            {visit.Hora ? `${visit.Hora} — ` : ''}{visit.NombreCliente || 'Cliente Desconocido'}
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
          <h4>Visitas del mes ({filteredVisitas.length})</h4>
          <div className="gc-visits-list">
            {filteredVisitas.length === 0 ? (
              <p>No hay visitas programadas para este filtro.</p>
            ) : (
              <ul>
                {filteredVisitas.map((visit, i) => (
                  <li 
                    key={i}
                    onClick={() => handleVisitClick(visit)}
                    style={{ cursor: visit.clientData ? 'pointer' : 'default' }}
                    title={visit.clientData ? `Ver cliente: ${visit.NombreCliente}` : 'Cliente no disponible'}
                  >
                    <strong>
                      {visit.Fecha.split('T')[0]} {visit.Hora || ''}
                    </strong>{' '}
                    — {visit.NombreCliente || 'Cliente Desconocido'}
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
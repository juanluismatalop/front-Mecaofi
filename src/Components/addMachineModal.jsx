// addMachineModal.jsx (Código Propuesto)

import React from 'react';
// IMPORTANTE: Asegúrate de tener los estilos CSS importados, si los tienes en un archivo separado
// import './addClientModal.css'; // O el archivo CSS que uses para los modales

export default function AddMachineModal({ show, onClose,  }) {
    
    // Si 'show' es falso, no renderizamos nada
    if (!show) {
        return null; 
    }
    
    // Estructura del modal (Fondo y Contenido)
    return (
        <div className="modal-backdrop" onClick={onClose}> 
            {/* El div 'modal-content' es el cuerpo visible del modal. 
                El stopPropagation evita que un clic dentro del modal lo cierre. */}
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '450px' }}>
                <div className="modal-header">
                    <h2>Agregar Nueva Máquina</h2>
                    
                    {/* Botón de cierre que llama a la función onClose */}
                    <button className="boton2" onClick={onClose}>&times;</button>
                </div>
                
                <div className="modal-body" style={{ padding: '20px' }}>
                    
                    {/* El mensaje original, ahora dentro de la estructura */}
                    <h1 style={{ textAlign: 'center', color: '#003399' }}>Estamos trabajando en esto</h1>
                    
                    <p style={{ textAlign: 'center', marginTop: '15px', color: '#666' }}>
                        Pronto podrás agregar y gestionar la información de las máquinas.
                    </p>
                </div>

                <div className="modal-actions" style={{ justifyContent: 'flex-end' }}>
                    {/* Botón de ejemplo para cerrar el modal */}
                    <button 
                        type="button" 
                        className="boton2" 
                        onClick={onClose} 
                        style={{ backgroundColor: '#e0e0e0', color: '#333' }}
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
// GenerateBudgetModal.jsx (Código Propuesto)

export default function GenerateBudgetModal({ show, onClose, clienteNombre }) {

    if (!show) {
        return null; // No renderiza nada si 'show' es falso
    }
    
    // El fondo gris oscuro que cubre toda la pantalla
    return (
        <div className="modal-backdrop" onClick={onClose}> 
            {/* El contenido del modal. 
              El onClick={e => e.stopPropagation()} evita que un clic
              dentro del modal lo cierre (porque el clic burbujearía al backdrop).
            */}
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '500px' }}>
                <div className="modal-header">
                    {/* Usamos el nombre del cliente para el título */}
                    <h2>Generar Presupuesto para {clienteNombre || 'Cliente'}</h2>
                    
                    {/* Botón de cierre */}
                    <button className="boton2" onClick={onClose}>&times;</button>
                </div>
                
                <div className="modal-body" style={{ padding: '20px' }}>
                    
                    {/* 🚨 Aquí iría el formulario real de generación de presupuesto */}
                    <h1 style={{ textAlign: 'center', color: '#003399' }}>Estamos trabajando en esta funcionalidad</h1>
                    
                    <p style={{ textAlign: 'center', marginTop: '15px', color: '#666' }}>
                        Pronto podrás crear, previsualizar y enviar presupuestos en formato PDF.
                    </p>
                </div>

                <div className="modal-actions" style={{ justifyContent: 'flex-end' }}>
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
    )
}
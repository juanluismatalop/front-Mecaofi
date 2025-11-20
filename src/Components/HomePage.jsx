import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AddClientModal from './addClientModal';
import ViewClientModal from './viewClientModal';
import AddComercialModal from './addComercialModal';
import AddMachineModal from './AddMachineModal'; 
import ManageComercialsModal from './ManageComercialsModal'; 
import ViewCalendarModal from './ViewCalendarModal'; 
import './HomePage.css';
import logo from '../assets/Logo-Mecaofi.jpg';

const CLIENTES_API_URL = 'http://localhost:8000/api/clientes'; 
const COMERCIALES_API_URL = 'http://localhost:8000/api/comerciales/';
const VISITAS_API_URL = 'http://localhost:8000/api/visitas'; 
const ADMIN_ID = 10; 

export default function HomePage() {
    const [clientes, setClientes] = useState([]);
    const [comerciales, setComerciales] = useState([]);
    const [visitas, setVisitas] = useState([]);
    // ESTADO CLAVE: Visitas con la información del cliente adjunta
    const [visitasEnriquecidas, setVisitasEnriquecidas] = useState([]); 
    
    const [selectedComercialId, setSelectedComercialId] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null); 
    const [showComercialModal, setShowComercialModal] = useState(false); 
    const [showManageComercialsModal, setShowManageComercialsModal] = useState(false); 
    const [showAddMachineModal, setShowAddMachineModal] = useState(false);
    const [showCalendarModal, setShowCalendarModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchCity, setSearchCity] = useState('');
    const [userId, setUserId] = useState(null); 
    const [userName, setUserName] = useState("Cargando..."); 
    
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('comercialId');
        localStorage.removeItem('comercialName');
        navigate('/');
    };
    
    // --- LÓGICA DE AUTENTICACIÓN INICIAL ---
    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUserId = localStorage.getItem('comercialId');
        const storedUserName = localStorage.getItem('comercialName'); 

        if (!token) {
            setError("Usuario no autenticado. Redirigiendo al login...");
            setLoading(false);
            navigate('/'); 
            return; 
        }

        if (storedUserId) {
            const id = parseInt(storedUserId, 10);
            setUserId(id); 
            
            if (storedUserName) {
                setUserName(storedUserName); 
            } else if (id === ADMIN_ID) {
                setUserName("Administrador");
            } else {
                setUserName("Comercial");
            }
        } 
        
        setAuthChecked(true);
    }, [navigate]); 

    // --- FETCH DE DATOS ---
    const fetchClientes = async () => {
        const token = localStorage.getItem('token');
        setError(null);

        try {
            const response = await fetch(CLIENTES_API_URL, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    handleLogout(); 
                    throw new Error("Sesión expirada o no autorizado.");
                }
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            setClientes(data);

        } catch (e) {
            setError(e.message);
        }
    };

    const fetchComerciales = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        try {
            const response = await fetch(COMERCIALES_API_URL, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                console.error(`Error ${response.status} al obtener comerciales: ${response.statusText}`);
                return; 
            }

            const data = await response.json();
            setComerciales(data);
        } catch (e) {
            console.error("Error en la petición de comerciales:", e.message);
        }
    };
    
    const fetchVisitas = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        try {
            const response = await fetch(VISITAS_API_URL, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                console.error(`Error ${response.status} al obtener visitas: ${response.statusText}`);
                setVisitas([]);
                return; 
            }

            const data = await response.json();
            setVisitas(data);
        } catch (e) {
            console.error("Error en la petición de visitas:", e.message);
            setVisitas([]);
        }
    };

    // 🚨 NUEVA FUNCIÓN: Recargar datos específicos para el calendario
    const reloadCalendarData = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        try {
            console.log("🔃 Recargando datos para el calendario...");
            
            // Recargar visitas y comerciales para tener datos frescos
            const [visitasResponse, comercialesResponse] = await Promise.all([
                fetch(VISITAS_API_URL, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }),
                fetch(COMERCIALES_API_URL, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                })
            ]);

            if (visitasResponse.ok) {
                const visitasData = await visitasResponse.json();
                setVisitas(visitasData);
            }

            if (comercialesResponse.ok) {
                const comercialesData = await comercialesResponse.json();
                setComerciales(comercialesData);
            }

        } catch (e) {
            console.error("Error al recargar datos del calendario:", e.message);
        }
    };
    
    // --- EFECTO PRINCIPAL DE CARGA DE DATOS ---
    useEffect(() => {
        if (authChecked && userId !== null) {
            const token = localStorage.getItem('token');
            const isAdmin = userId === ADMIN_ID;

            if (!token) {
                setLoading(false);
                return;
            }
            
            setLoading(true);
            const promises = [fetchClientes(), fetchVisitas()]; 
            if (isAdmin) {
                promises.push(fetchComerciales()); 
            } else {
                promises.push(fetchComerciales()); 
            }

            Promise.all(promises).finally(() => {
                setLoading(false);
            });

        } else if (authChecked && userId === null) {
            setLoading(false);
        }
    }, [authChecked, userId]);

    // --- 🚨 useMemo MEJORADO: ENRIQUECIMIENTO DE CLIENTES CON MANEJO DE NULL ---
    const clientesEnriquecidos = useMemo(() => {
        if (!clientes || !Array.isArray(clientes)) {
            console.warn("⚠️ clientes no es un array válido:", clientes);
            return [];
        }
        
        if (!comerciales || !Array.isArray(comerciales)) {
            console.warn("⚠️ comerciales no es un array válido, usando clientes sin enriquecer");
            return clientes;
        }

        console.log("🔄 Enriqueciendo clientes:", clientes.length, "clientes con", comerciales.length, "comerciales");

        const comercialesMap = new Map(comerciales.map(c => [c.Id, c]));

        const clientesEnriquecidos = clientes.map(c => {
            if (!c) {
                console.warn("⚠️ Cliente nulo encontrado");
                return null;
            }

            const comercial = comercialesMap.get(c.IdComercial); 

            // 🚨 CORRECCIÓN: Manejar todos los campos que podrían ser NULL
            const clienteEnriquecido = {
                ...c,
                NombreComercial: comercial ? comercial.Nombre : 'Comercial Eliminado',
                // 🚨 Asegurar valores por defecto para campos NULL
                Nombre: c.Nombre || 'Sin nombre',
                PersonaContacto: c.PersonaContacto || 'No especificado',
                Telefono: c.Telefono || 'No especificado',
                Telefono2: c.Telefono2 || '',
                Correo: c.Correo || 'No especificado',
                Correo2: c.Correo2 || '',
                Direccion: c.Direccion || 'No especificada',
                Ciudad: c.Ciudad || 'No especificada',
                Provincia: c.Provincia || 'No especificada'
            };

            return clienteEnriquecido;
        }).filter(Boolean); // Filtrar posibles valores null

        console.log("✅ Clientes enriquecidos:", clientesEnriquecidos.length);
        
        return clientesEnriquecidos;

    }, [clientes, comerciales]);

    // --- EFECTO ENRIQUECIMIENTO DE VISITAS (CORREGIDO) ---
    useEffect(() => {
        if (visitas.length > 0 && comerciales.length > 0) {
            
            const clientesMap = new Map(clientes.map(c => [c.Id, c]));
            
            const comercialesMap = new Map(comerciales.map(c => [c.Id.toString(), c])); 

            const visitasConDatos = visitas.map(v => {
                // 🚨 CORRECCIÓN: Usar los nombres correctos del backend
                const cliente = clientesMap.get(v.IdCliente); 
                
                const comercialIdString = v.IdComercial ? v.IdComercial.toString() : null;
                
                const comercial = comercialIdString ? comercialesMap.get(comercialIdString) : null;

                return {
                    ...v,
                    NombreCliente: cliente ? cliente.Nombre : 'Cliente Desconocido', 
                    NombreComercial: comercial ? comercial.Nombre : 'Comercial Desconocido',
                    clientData: cliente || null,
                };
            });
            
            setVisitasEnriquecidas(visitasConDatos);
        } else {
            setVisitasEnriquecidas([]);
        }
    }, [clientes, visitas, comerciales]); 

    // --- 🚨 LÓGICA DE FILTRADO DE CLIENTES CORREGIDA ---
    const clientesFiltrados = useMemo(() => {
        console.log("🔍 Iniciando filtrado de clientes...");
        
        const lowerSearchTerm = searchTerm.toLowerCase().trim();
        const lowerSearchCity = searchCity.toLowerCase().trim();
        
        let clientesVisibles = clientesEnriquecidos;
        const isAdmin = userId === ADMIN_ID;

        console.log(`👥 Clientes antes de filtrar: ${clientesVisibles.length}`);
        console.log(`🔎 Término de búsqueda: "${searchTerm}", Ciudad: "${searchCity}"`);

        if (isAdmin && selectedComercialId !== 'all') {
            const filterId = parseInt(selectedComercialId, 10);
            clientesVisibles = clientesVisibles.filter(cliente => cliente.IdComercial === filterId);
            console.log(`📊 Filtrado por comercial ${filterId}: ${clientesVisibles.length} clientes`);
        }
        
        if (userId !== null && userId !== ADMIN_ID) {
            clientesVisibles = clientesVisibles.filter(cliente => cliente.IdComercial === userId);
            console.log(`📊 Filtrado por usuario ${userId}: ${clientesVisibles.length} clientes`);
        }
        
        const clientesFiltrados = clientesVisibles.filter(cliente => {
            // 🚨 CORRECCIÓN: Manejar valores null/undefined correctamente
            const nombre = cliente.Nombre || '';
            const personaContacto = cliente.PersonaContacto || '';
            const comercialName = cliente.NombreComercial || '';
            const ciudad = cliente.Ciudad || '';

            const matchesSearchTerm = 
                nombre.toLowerCase().includes(lowerSearchTerm) ||
                personaContacto.toLowerCase().includes(lowerSearchTerm) ||
                comercialName.toLowerCase().includes(lowerSearchTerm);

            // 🚨 CORRECCIÓN: Si no hay término de búsqueda de ciudad, mostrar todos
            const matchesCity = lowerSearchCity === '' || 
                               ciudad.toLowerCase().includes(lowerSearchCity);
            
            return matchesSearchTerm && matchesCity;
        });

        console.log(`✅ Clientes después de filtrar: ${clientesFiltrados.length}`);
        
        // 🚨 DEBUG: Mostrar qué clientes fueron filtrados
        if (clientesFiltrados.length === 0 && clientesVisibles.length > 0) {
            console.log("❌ Todos los clientes fueron filtrados. Clientes disponibles:");
            clientesVisibles.forEach((cliente, index) => {
                console.log(`   ${index + 1}. ${cliente.Nombre} | Ciudad: "${cliente.Ciudad}" | Comercial: "${cliente.NombreComercial}"`);
            });
        }
        
        return clientesFiltrados;

    }, [clientesEnriquecidos, searchTerm, searchCity, userId, selectedComercialId]);
    
    // --- 🚨 HANDLER CORREGIDO: handleClientAdded ---
    const handleClientAdded = (newClient) => {
        // 🚨 VERIFICACIÓN DE SEGURIDAD: Asegurarse de que newClient existe
        if (!newClient) {
            console.error("Error: newClient es undefined en handleClientAdded");
            setShowModal(false);
            return;
        }

        console.log("🔄 Cliente recibido para agregar:", newClient);

        // 🚨 CORRECCIÓN: Buscar el comercial asignado
        const comercialAsignado = comerciales.find(c => c.Id === newClient.IdComercial);
        
        // 🚨 CORRECCIÓN: Crear el cliente enriquecido con manejo de NULL
        const enrichedNewClient = {
            ...newClient,
            NombreComercial: comercialAsignado ? comercialAsignado.Nombre : 'Comercial Eliminado',
            // 🚨 Asegurar que todos los campos tengan valores por defecto si son NULL
            Nombre: newClient.Nombre || 'Sin nombre',
            PersonaContacto: newClient.PersonaContacto || 'No especificado',
            Telefono: newClient.Telefono || 'No especificado',
            Telefono2: newClient.Telefono2 || '',
            Correo: newClient.Correo || 'No especificado',
            Correo2: newClient.Correo2 || '',
            Direccion: newClient.Direccion || 'No especificada',
            Ciudad: newClient.Ciudad || 'No especificada',
            Provincia: newClient.Provincia || 'No especificada'
        };

        console.log("✅ Cliente enriquecido para agregar:", enrichedNewClient);

        // 🚨 ACTUALIZACIÓN DEL ESTADO CON VERIFICACIÓN
        setClientes(prevClientes => {
            // Verificar si el cliente ya existe para evitar duplicados
            const clientExists = prevClientes.some(c => c.Id === enrichedNewClient.Id);
            if (clientExists) {
                // Si existe, actualizarlo
                console.log("🔄 Actualizando cliente existente");
                return prevClientes.map(c => 
                    c.Id === enrichedNewClient.Id ? enrichedNewClient : c
                );
            } else {
                // Si no existe, añadirlo al principio
                console.log("➕ Añadiendo nuevo cliente a la lista");
                return [enrichedNewClient, ...prevClientes];
            }
        });
        
        setShowModal(false);
    };

    const handleComercialRegistered = (newComercial) => {
        if (newComercial) {
            setComerciales(prevComerciales => [...prevComerciales, newComercial]);
        }
    }

    const handleMachineAdded = (newMachine) => {
        console.log("Máquina añadida, éxito:", newMachine);
    }
    
    const handleClientUpdate = (updatedClient) => {
        setShowViewModal(false); 
        
        const comercialAsignado = comerciales.find(c => c.Id === updatedClient.IdComercial);
        const enrichedUpdatedClient = {
            ...updatedClient,
            NombreComercial: comercialAsignado ? comercialAsignado.Nombre : 'Comercial Eliminado',
            // 🚨 Asegurar valores por defecto para campos actualizados
            Nombre: updatedClient.Nombre || 'Sin nombre',
            PersonaContacto: updatedClient.PersonaContacto || 'No especificado',
            Telefono: updatedClient.Telefono || 'No especificado',
            Telefono2: updatedClient.Telefono2 || '',
            Correo: updatedClient.Correo || 'No especificado',
            Correo2: updatedClient.Correo2 || '',
            Direccion: updatedClient.Direccion || 'No especificada',
            Ciudad: updatedClient.Ciudad || 'No especificada',
            Provincia: updatedClient.Provincia || 'No especificada'
        };

        setClientes(prevClientes => 
            prevClientes.map(c => 
                c.Id === enrichedUpdatedClient.Id ? enrichedUpdatedClient : c
            )
        );
        if (selectedClient && selectedClient.Id === enrichedUpdatedClient.Id) {
            setSelectedClient(enrichedUpdatedClient);
        }
    };

    const handleClientDelete = (deletedClientId) => {
        setShowViewModal(false); 
        setClientes(prevClientes => 
            prevClientes.filter(c => c.Id !== deletedClientId)
        );
        setSelectedClient(null);
    };

    const handleDeleteClientInTable = async (clientId, clientName, event) => {
        event.stopPropagation(); 
        if (window.confirm(`¿Estás seguro de que quieres eliminar al cliente "${clientName}"? Esta acción es irreversible.`)) {
            const token = localStorage.getItem('token');
            try {
                const response = await fetch(`${CLIENTES_API_URL}/${clientId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error(`Error al eliminar: ${response.statusText}`);
                }

                handleClientDelete(clientId);
                alert(`Cliente "${clientName}" eliminado con éxito.`);
            } catch (error) {
                alert(`Error al eliminar el cliente: ${error.message}`);
            }
        }
    };

    const handleViewClient = (cliente) => {
        setSelectedClient(cliente);
        setShowViewModal(true);
    };
    
    // 🚨 HANDLER CORREGIDO: Abrir calendario con recarga de datos
    const handleOpenCalendarModal = async () => {
        console.log("📅 Abriendo modal de calendario...");
        
        // Recargar datos antes de abrir el modal
        await reloadCalendarData();
        
        // Abrir el modal después de recargar datos
        setShowCalendarModal(true);
    };


    if (loading || !authChecked) {
        return <div className="loading-message">Cargando listado de clientes...</div>;
    }
    
    if (error) {
        return <div className="error-message">Error: {error}</div>;
    }

    const isAdmin = userId === ADMIN_ID;

    return (
        <div className="homepage-container">
            
            {/* --- NAV BAR --- */}
            <div className="navBar">
                <img src={logo} alt="Logo Mecaofi" height={100} width={100}/>
                
                {/* Campo de Búsqueda General */}
                <div className="form__group field" style={{flexGrow: 1}}>
                    <input 
                        type="input" 
                        className="form__field" 
                        placeholder="Buscar cliente, contacto o comercial..." 
                        name="cliente" 
                        id='cliente' 
                        required 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <label htmlFor="cliente" className="form__label">Cliente</label>
                </div>
                
                {/* Campo de Búsqueda por Ciudad */}
                <div className="form__group field" style={{flexGrow: 1}}>
                    <input 
                        type="input" 
                        className="form__field" 
                        placeholder="Buscar localidad" 
                        name="localidad" 
                        id='localidad' 
                        required 
                        value={searchCity}
                        onChange={(e) => setSearchCity(e.target.value)}
                    />
                    <label htmlFor="localidad" className="form__label">Localidad</label>
                </div>
                
                {/* Botón Calendario */}
                <button 
                    className='boton2' 
                    onClick={handleOpenCalendarModal} 
                    style={{ 
                        backgroundColor: '#4CAF50',
                        color: 'white', 
                        fontWeight: 'bold',
                        marginLeft: '10px'
                    }}
                    title='Ver todas las visitas programadas en formato calendario'
                >
                    Ver Calendario 🗓️
                </button>
                
                {/* Botones de Administración (Solo Admin) */}
                {isAdmin && (
                    <button className='boton2' onClick={() => setShowComercialModal(true)} style={{ marginLeft: '10px' }}>
                        Registrar Comercial
                    </button>
                )}
                
                {isAdmin && (
                    <button className='boton2' onClick={() => setShowManageComercialsModal(true)} style={{ marginLeft: '10px' }}>
                        Gestionar Comerciales
                    </button>
                )}
                
                {/* Botón Cerrar Sesión */}
                <button 
                    className='boton2' 
                    onClick={handleLogout}
                    title='Cerrar Sesión' 
                >
                    Cerrar Sesión
                </button>
            </div>

            <h2>Listado de Clientes de {userName} ({clientesFiltrados.length})</h2>
            
            {/* --- TABLA DE CLIENTES --- */}
            <div className="table-container">
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px' }}>
                    <button className='boton' onClick={() => setShowModal(true)}>Añadir Cliente</button>
                    
                    {/* Botón Añadir Máquina (Solo Admin) */}
                    {isAdmin && ( 
                        <button 
                            className='boton' 
                            onClick={() => setShowAddMachineModal(true)}
                            title='Añadir Nueva Máquina'
                        >
                            Añadir Máquina
                        </button>
                    )}
                    
                    {/* Filtro de Clientes por Comercial (Solo Admin) */}
                    {isAdmin && (
                        <div className="form__group field" style={{ width: '250px' }}>
                            <select
                                className="form__field"
                                name="comercialFilter"
                                id="comercialFilter"
                                value={selectedComercialId}
                                onChange={(e) => setSelectedComercialId(e.target.value)}
                                style={{ paddingTop: '20px', paddingBottom: '5px', color: '#0f37a8' }}
                            >
                                <option value="all">Todos los comerciales</option>
                                {comerciales.filter(comercial => comercial.Id !== 10).map(comercial => (
                                    <option key={comercial.Id} value={comercial.Id}>
                                        {comercial.Nombre} 
                                    </option>
                                ))}
                            </select>
                            <label htmlFor="comercialFilter" className="form__label" style={{ top: '8px' }}>Filtrar por Comercial</label>
                        </div>
                    )}
                </div>
                <table className="clientes-table">
                    <thead>
                        <tr>
                            <th>Nombre Cliente</th>
                            <th>Persona Contacto</th>
                            <th>Teléfono</th>
                            <th>Ciudad</th>
                            <th>Correo Electrónico</th>
                            <th>Comercial Asignado</th>
                            <th>Acciones</th>
                            {isAdmin && <th><i className="fas fa-trash-alt" title='Borrar'></i></th>} 
                        </tr>
                    </thead>
                    <tbody>
                        {clientesFiltrados.length === 0 && (
                            <tr>
                                <td colSpan={isAdmin ? "8" : "7"} style={{textAlign: 'center', padding: '20px'}}>
                                    No se encontraron clientes que coincidan con los criterios.
                                </td>
                            </tr>
                        )}

                        {clientesFiltrados.map(cliente => (
                            <tr 
                                key={cliente.Id} 
                                onClick={() => handleViewClient(cliente)}
                                style={{ cursor: 'pointer' }} 
                            >
                                <td>{cliente.Nombre}</td>
                                <td>{cliente.PersonaContacto}</td>
                                <td>{cliente.Telefono}</td>
                                <td>{cliente.Ciudad}</td>
                                <td>{cliente.Correo}</td>
                                <td>{cliente.NombreComercial}</td> 
                                <td style={{ textAlign: 'center' }}>
                                    {isAdmin && (
                                        <button 
                                            className='delete-button'
                                            onClick={(e) => handleDeleteClientInTable(cliente.Id, cliente.Nombre, e)}
                                            title="Eliminar Cliente"
                                        >
                                            Eliminar
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- MODALES --- */}
            <AddClientModal
                show={showModal}
                onClose={() => setShowModal(false)}
                onClientAdded={handleClientAdded}
            />

            <ViewClientModal
                show={showViewModal}
                onClose={() => setShowViewModal(false)}
                cliente={selectedClient} 
                onClientUpdate={handleClientUpdate} 
                onClientDelete={handleClientDelete}
                userId={userId} 
                ADMIN_ID={ADMIN_ID}
                comerciales={comerciales} 
            />
            
            <AddComercialModal
                show={showComercialModal}
                onClose={() => setShowComercialModal(false)}
                onComercialAdded={handleComercialRegistered}
            />

            <ManageComercialsModal
                show={showManageComercialsModal}
                onClose={() => setShowManageComercialsModal(false)}
                currentUserId={userId} 
                adminId={ADMIN_ID} 
            />
            
            {/* 🚨 MODAL DE CALENDARIO - AHORA SE DEBERÍA ABRIR */}
            <ViewCalendarModal
                show={showCalendarModal}
                onClose={() => setShowCalendarModal(false)}
                visitas={visitasEnriquecidas}
                comerciales={comerciales}
                onViewClient={handleViewClient}
                userId={userId}
                ADMIN_ID={ADMIN_ID}
            /> 
            
            <AddMachineModal 
                isOpen={showAddMachineModal} 
                onClose={() => setShowAddMachineModal(false)}
                onSuccess={handleMachineAdded}
            />
        </div>
    );
}
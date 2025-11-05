import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AddClientModal from './addClientModal';
import ViewClientModal from './viewClientModal';
import AddComercialModal from './addComercialModal';
import AddMachineModal from './addMachineModal'; 
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
    }, []); 

    const fetchClientes = async () => {
        const token = localStorage.getItem('token');
        setLoading(true);
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
        } finally {//
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
                return; 
            }

            const data = await response.json();
            setVisitas(data);
        } catch (e) {
            console.error("Error en la petición de visitas:", e.message);
        }
    };
    
    useEffect(() => {
        if (authChecked && userId !== null) {
            const token = localStorage.getItem('token');
            const isAdmin = userId === ADMIN_ID;

            if (!token) {
                setLoading(false);
                return;
            }
            
            const promises = [fetchClientes(), fetchVisitas()]; 
            if (isAdmin) {
                promises.push(fetchComerciales());
            }

            Promise.all(promises).finally(() => {
                setLoading(false);
            });

        } else if (authChecked && userId === null) {
            setLoading(false);
        }
    }, [authChecked, userId]);
    
    const clientesFiltrados = useMemo(() => {
        const lowerSearchTerm = searchTerm.toLowerCase().trim();
        const lowerSearchCity = searchCity.toLowerCase().trim();
        
        let clientesVisibles = clientes;
        const isAdmin = userId === ADMIN_ID;

        if (isAdmin && selectedComercialId !== 'all') {
            const filterId = parseInt(selectedComercialId, 10);
            clientesVisibles = clientesVisibles.filter(cliente => cliente.IdComercial === filterId);
        }
        
        if (userId !== null && userId !== ADMIN_ID) {
             clientesVisibles = clientesVisibles.filter(cliente => cliente.IdComercial === userId);
        }
        
        return clientesVisibles.filter(cliente => {
            const comercialName = cliente.NombreComercial || '';

            const matchesSearchTerm = 
                (cliente.Nombre && cliente.Nombre.toLowerCase().includes(lowerSearchTerm)) ||
                (cliente.PersonaContacto && cliente.PersonaContacto.toLowerCase().includes(lowerSearchTerm)) ||
                (comercialName.toLowerCase().includes(lowerSearchTerm));

            const matchesCity = cliente.Ciudad && cliente.Ciudad.toLowerCase().includes(lowerSearchCity);
            
            return matchesSearchTerm && matchesCity;
        });

    }, [clientes, searchTerm, searchCity, userId, selectedComercialId]); 
    
    
    const handleClientAdded = (newClient) => {
        if (newClient) {
            setClientes(prevClientes => [newClient, ...prevClientes]); 
        }
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
        setClientes(prevClientes => 
            prevClientes.map(c => 
                c.Id === updatedClient.Id ? updatedClient : c
            )
        );
        if (selectedClient && selectedClient.Id === updatedClient.Id) {
             setSelectedClient(updatedClient);
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
    
    const handleOpenCalendarModal = () => {
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
            
            <div className="navBar">
                <img src={logo} alt="Logo Mecaofi" height={100} width={100}/>
                
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
                
                <button 
                    className='boton2' 
                    onClick={handleLogout}
                    title='Cerrar Sesión' 
                >
                    Cerrar Sesión
                </button>
            </div>

            <h2>Listado de Clientes de {userName} ({clientesFiltrados.length})</h2>
            
            <div className="table-container">
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px' }}>
                    <button className='boton' onClick={() => setShowModal(true)}>Añadir Cliente</button>
                    {isAdmin && ( 
                        <button 
                            className='boton' 
                            onClick={() => setShowAddMachineModal(true)}
                            title='Añadir Nueva Máquina'
                        >
                            Añadir Máquina
                        </button>
                    )}
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
                                <td>{cliente.PersonaContacto || 'N/A'}</td>
                                <td>{cliente.Telefono}</td>
                                <td>{cliente.Ciudad}</td>
                                <td>{cliente.Correo}</td>
                                <td>{cliente.NombreComercial || 'Sin Asignar'}</td>
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
            
            <ViewCalendarModal
                show={showCalendarModal}
                onClose={() => setShowCalendarModal(false)}
                visitas={visitas} 
                clientes={clientes}
                onViewClient={handleViewClient}
                userId={userId}
                ADMIN_ID={ADMIN_ID}
            /> 
            
            <AddMachineModal 
                show={showAddMachineModal}
                onClose={() => setShowAddMachineModal(false)}
                onMachineAdded={handleMachineAdded} 
            />
        </div>
    );
}
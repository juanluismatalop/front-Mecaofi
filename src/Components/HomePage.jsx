import { useState, useEffect } from 'react';
import AddClientModal from './addClientModal';
import ViewClientModal from './viewClientModal';
import AddComercialModal from './addComercialModal';
import './HomePage.css';
import logo from '../assets/Logo-Mecaofi.jpg';

export default function HomePage() {
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    
    const [authChecked, setAuthChecked] = useState(false);

    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null); 

    // 👈 2. Nuevo estado para el modal de Comercial
    const [showComercialModal, setShowComercialModal] = useState(false); 

    const [searchTerm, setSearchTerm] = useState('');
    const [searchCity, setSearchCity] = useState('');

    const [userId, setUserId] = useState(null); 
    const [userName, setUserName] = useState(""); 
    const ADMIN_ID = 10; 

    // ... (Tu useEffect para la autenticación permanece igual) ...
    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUserId = localStorage.getItem('comercialId');
        const storedUserName = localStorage.getItem('comercialName'); 

        
        if (!token) {
             setError("Usuario no autenticado. Por favor, inicie sesión.");
             setLoading(false);
        } else if (storedUserId) {
            setUserId(parseInt(storedUserId, 10)); 
            if (storedUserName) {
                setUserName(storedUserName); 
            }
        } 
        
        setAuthChecked(true);
    }, []); 

    const fetchClientes = async () => {
        const token = localStorage.getItem('token');
        
        if (!token) {
            setLoading(false);
            return; 
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('http://localhost:3000/api/clientes', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('token'); 
                    localStorage.removeItem('comercialId');
                    localStorage.removeItem('comercialName'); 
                    throw new Error("401 Unauthorized. Sesión expirada o inválida.");
                }
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            setClientes(data);

        } catch (e) {
            console.error("Error al obtener clientes:", e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authChecked && userId !== null) {
            fetchClientes();
        } else if (authChecked && userId === null) {
            setLoading(false);
        }
    }, [authChecked, userId]); 

    function handleClientAdded(){
        fetchClientes(); 
    };

    function handleComercialRegistered(){
        console.log("Comercial registrado, puedes añadir aquí un toast de éxito.");
        setShowComercialModal(false);
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

    function filteredClientes(){
        const lowerSearchTerm = searchTerm.toLowerCase();
        const lowerSearchCity = searchCity.toLowerCase();
        
        let clientesVisibles = clientes;

        if (userId === null) {
            return [];
        }

        if (userId !== ADMIN_ID) {
            clientesVisibles = clientes.filter(cliente => cliente.IdComercial === userId);
        }

        return clientesVisibles.filter(cliente => {
            const matchesName = 
                (cliente.Nombre && cliente.Nombre.toLowerCase().includes(lowerSearchTerm)) ||
                (cliente.PersonaContacto && cliente.PersonaContacto.toLowerCase().includes(lowerSearchTerm));

            const matchesCity = cliente.Ciudad && cliente.Ciudad.toLowerCase().includes(lowerSearchCity);
            
            return matchesName && matchesCity;
        });
    }

    const handleViewClient = (cliente) => {
        setSelectedClient(cliente);
        setShowViewModal(true);
    };

    if (loading || !authChecked) {
        return <div className="loading-message">Cargando listado de clientes...</div>;
    }
    
    if (error) {
        return <div className="error-message">Error: {error}</div>;
    }

    const clientesFiltrados = filteredClientes();

    return (
        <div className="homepage-container">
            <div className="navBar">
                <img src={logo} alt="Logo Mecaofi" height={100} width={100}/>
                
                <div className="form__group field">
                    <input 
                        type="input" 
                        className="form__field" 
                        placeholder="Buscar cliente" 
                        name="cliente" 
                        id='cliente' 
                        required 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <label htmlFor="cliente" className="form__label">Cliente</label>
                </div>
                
                <div className="form__group field">
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
                {userId === ADMIN_ID && (
                    <button className='boton2' onClick={() => setShowComercialModal(true)}>
                        Registrar Comercial
                    </button>
                )}
            </div>

            <h2>Listado de Clientes de {userName} ({clientesFiltrados.length})</h2>

            <div className="table-container">
                <button className='boton' onClick={() => setShowModal(true)}>Añadir Cliente</button>
                <table className="clientes-table">
                    <thead>
                        <tr>
                            <th>Nombre Comercial</th>
                            <th>Persona Contacto</th>
                            <th>Teléfono</th>
                            <th>Ciudad</th>
                            <th>Correo Electrónico</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clientesFiltrados.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{textAlign: 'center', padding: '20px'}}>
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
            />
            
            <AddComercialModal
                show={showComercialModal}
                onClose={() => setShowComercialModal(false)}
                onComercialAdded={handleComercialRegistered}
            />
        </div>
    );
}
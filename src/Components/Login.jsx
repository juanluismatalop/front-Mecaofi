import { useState } from "react";
import './Login.css';
import { useNavigate } from "react-router-dom"; 

export default function Login(){
    const [comercial, setComercial] = useState(''); 
    const [contrasenna, setContrasenna] = useState('');
    const [error, setError] = useState(''); 
    const navigate = useNavigate();

    async function Entrar(){
        setError(''); 
        try {
            const response = await fetch('http://localhost:8000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    Comercial: comercial, 
                    Pass: contrasenna,    
                }),
            });
            
            // CORRECCIÓN: Leer el cuerpo de la respuesta SOLO UNA VEZ
            const data = await response.json(); 

            if (!response.ok) {
                // Si la respuesta no es OK (ej. 401), 'data' contiene el error del servidor.
                const errorMessage = data.message || `Error del servidor (Código ${response.status}).`;
                throw new Error(errorMessage);
            }

            // Si es exitoso (200)
            localStorage.setItem('token', data.token);
            localStorage.setItem('comercialId', data.comercialId);
            
            // Guardamos el nombre del usuario para mostrarlo en HomePage
            localStorage.setItem('comercialName', comercial); 
            
            navigate("/Home"); 

        } catch (err) {
            console.error("Error al iniciar sesión:", err.message);
            setError(err.message || "No se pudo conectar con el servidor. ¿Está el backend corriendo?");
            alert(err.message || "No se pudo conectar con el servidor.");
        }
    }
    
    return(
        <div>
            <div className="container">
                <img src="src\assets\Logo-Mecaofi.jpg" className="imagen" alt="Logo MecaOfi"/>
                <div>
                    <h2>Usuario</h2>
                    <input 
                        type="text" 
                        value={comercial} 
                        onChange={(e) => setComercial(e.target.value)}
                    />
                    <h2>Contraseña</h2>
                    <input 
                        type="password" 
                        value={contrasenna} 
                        onChange={(e) => setContrasenna(e.target.value)}
                    />
                </div>
                <br />
                {error && <p style={{color: 'red', fontWeight: 'bold'}}>{error}</p>}
                
                <button className="boton" onClick={Entrar}>
                    Entrar
                </button>
            </div>
        </div>
    );
}
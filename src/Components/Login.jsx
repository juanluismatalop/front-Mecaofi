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
            const response = await fetch('http://localhost:3000/api/comercial/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    Comercial: comercial, 
                    Pass: contrasenna,    
                }),
            });

            const data = await response.json();

            if (response.ok) {
                console.log("Login exitoso. Token recibido:", data.token);
                
                localStorage.setItem('token', data.token);
                localStorage.setItem('comercialId', data.comercialId);
                
                if (data.Comercial) { 
                    localStorage.setItem('comercialName', data.Comercial);
                }
                
                navigate("/Home"); 

            } else {
                const errorMessage = data.message || 'Error de conexión. Inténtelo de nuevo.';
                setError(errorMessage);
                alert(`Error al iniciar sesión: ${errorMessage}`);
            }

        } catch (err) {
            console.error("Error de red o servidor:", err);
            setError("No se pudo conectar con el servidor. ¿Está el backend corriendo?");
            alert("No se pudo conectar con el servidor.");
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
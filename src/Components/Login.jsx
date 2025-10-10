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
            // Nota: Aquí se usa '/api/comercial/login' (singular). 
            // Si tu servidor usa '/api/comerciales/login' (plural), esto fallará con 404.
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
            
            // Verificamos si la respuesta fue OK (200). Si no es OK, 
            // el intento de response.json() podría fallar si es un 404 que devuelve HTML.
            if (!response.ok) {
                // Intenta leer el error como JSON, si falla, usa un mensaje genérico.
                const errorData = (await response.text()).includes('{') ? await response.json() : { message: 'Error de red o servidor no reconocido.' };
                
                const errorMessage = errorData.message || `Error del servidor (Código ${response.status}).`;
                setError(errorMessage);
                alert(`Error al iniciar sesión: ${errorMessage}`);
                return; // Salir de la función
            }

            const data = await response.json();

            // 🚨 CORRECCIÓN CLAVE: Guardamos directamente el valor del input (estado 'comercial')
            localStorage.setItem('token', data.token);
            localStorage.setItem('comercialId', data.comercialId);
            
            // Garantizamos que el nombre guardado es el que el usuario tecleó.
            localStorage.setItem('comercialName', comercial); 
            
            navigate("/Home"); 

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
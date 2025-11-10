import { useState } from "react";
import './Login.css';
import { useNavigate } from "react-router-dom"; 

// ==========================================================
// ** CONFIGURACIÓN **
// Asegúrate de que esta URL coincida con la de tu backend (Laravel)
// ==========================================================
const API_URL = 'http://localhost:8000';

export default function Login(){
    const [comercial, setComercial] = useState(''); 
    const [contrasenna, setContrasenna] = useState('');
    const [error, setError] = useState(''); 
    const navigate = useNavigate();

    async function Entrar(){
        setError(''); 
        
        try {
            // ==========================================================
            // PASO 1: OBTENER LA COOKIE CSRF DE SANCTUM
            // Esto es crucial para solucionar el error 419 (CSRF Mismatch).
            // ==========================================================
            const csrfResponse = await fetch(`${API_URL}/sanctum/csrf-cookie`, {
                method: 'GET',
                // CRUCIAL: Incluye las cookies en la solicitud y permite recibirlas.
                credentials: 'include', 
            });

            if (!csrfResponse.ok) {
                throw new Error("Fallo al obtener la cookie CSRF. Revisa el CORS en el backend.");
            }

            // ==========================================================
            // PASO 2: REALIZAR LA SOLICITUD DE LOGIN
            // El navegador ahora enviará la cookie CSRF automáticamente.
            // ==========================================================
            const loginResponse = await fetch(`${API_URL}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    Comercial: comercial, 
                    Pass: contrasenna,    
                }),
                // CRUCIAL: Incluye las cookies de sesión/CSRF en el login.
                credentials: 'include', 
            });
            
            // --- Manejo de la Respuesta del Servidor ---
            
            if (!loginResponse.ok) {
                
                // Si el servidor devuelve el error 419
                if (loginResponse.status === 419) {
                    throw new Error("ERROR 419: Sesión expirada o token CSRF inválido. Revisa tu archivo cors.php.");
                }
                
                let errorData;
                const contentType = loginResponse.headers.get("content-type");

                // Intentar parsear JSON solo si el Content-Type lo indica
                if (contentType && contentType.includes("application/json")) {
                    errorData = await loginResponse.json();
                } else {
                    // Si el servidor devuelve HTML (ej. un 500, o un error que no es JSON)
                    const errorText = await loginResponse.text();
                    console.error("Respuesta no-JSON del servidor:", errorText);
                    throw new Error(`Error ${loginResponse.status}. El servidor no devolvió un JSON válido.`);
                }

                // Si el error es un JSON válido, mostramos el mensaje del servidor
                const errorMessage = errorData.message || `Error del servidor (Código ${loginResponse.status}).`;
                throw new Error(errorMessage);
            }

            // --- Si la solicitud es exitosa (200 OK) ---
            const data = await loginResponse.json(); 

            localStorage.setItem('token', data.token);
            localStorage.setItem('comercialId', data.comercialId);
            localStorage.setItem('comercialName', comercial); 
            
            navigate("/Home"); 

        } catch (err) {
            console.error("Error al iniciar sesión:", err.message);
            // Mostrar el mensaje de error capturado en la interfaz
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
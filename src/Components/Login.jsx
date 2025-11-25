import React, { useState } from "react";
import './Login.css';
import { useNavigate } from "react-router-dom"; 
import logo from '../assets/Logo-Mecaofi.jpg'; 

// ==========================================================
// ** CONFIGURACIÓN **
// ==========================================================
// const API_URL = 'http://localhost:8000';
const API_URL = 'https://www.mecaofi.com/LibroVisitas/back/public';

export default function Login(){
    const [comercial, setComercial] = useState(''); 
    const [contrasenna, setContrasenna] = useState('');
    const [error, setError] = useState(''); 
    const [loading, setLoading] = useState(false); // Nuevo estado para manejo de carga
    const navigate = useNavigate();

    async function Entrar(){
        setError(''); 
        setLoading(true); // Inicia la carga
        
        try {
            // 1. Obtener la cookie CSRF
            const csrfResponse = await fetch(`${API_URL}/sanctum/csrf-cookie`, {
                method: 'GET',
                credentials: 'include', 
            });

            if (!csrfResponse.ok) {
                throw new Error("Fallo al obtener la cookie CSRF. Revisa el CORS en el backend.");
            }

            // 2. Intentar iniciar sesión
            const loginResponse = await fetch(`${API_URL}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    Comercial: comercial, 
                    Pass: contrasenna,    
                }),
                credentials: 'include', // Necesario para enviar las cookies de sesión/CSRF
            });
            
            if (!loginResponse.ok) {
                // Manejo específico de errores HTTP
                
                let errorMessage = `Error al iniciar sesión (Código ${loginResponse.status}).`;
                
                // El error 419 suele indicar un fallo en el token CSRF (Sanctum no lo aceptó)
                if (loginResponse.status === 419) {
                    errorMessage = "ERROR 419: Sesión expirada o token CSRF inválido. Revisa tu archivo `cors.php` o `sanctum.php`.";
                    console.error("DEBUG Sanctum: 419 CSRF token error. Asegúrate de que SANCTUM_STATEFUL_DOMAINS incluye la URL de tu frontend.");
                }

                // Intentar obtener el mensaje de error del cuerpo JSON
                const contentType = loginResponse.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const errorData = await loginResponse.json();
                    errorMessage = errorData.message || errorMessage;
                } else {
                    const errorText = await loginResponse.text();
                    console.error("Respuesta no-JSON del servidor:", errorText);
                    // Usamos el mensaje base si no podemos leer el JSON
                }

                throw new Error(errorMessage);
            }

            // 3. Éxito: Guardar datos de sesión
            const data = await loginResponse.json(); 

            if (!data.token || !data.comercialId) {
                throw new Error("Respuesta de login incompleta. Faltan token o ID.");
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('comercialId', data.comercialId);
            localStorage.setItem('comercialName', comercial); 
            
            navigate("/Home"); // Redirigir al Home

        } catch (err) {
            console.error("Error al iniciar sesión:", err);
            setError(err.message || "No se pudo conectar con el servidor. ¿Está el backend corriendo?");
        } finally {
            setLoading(false); // Finaliza la carga en cualquier caso
        }
    }
    
    // Si el usuario presiona Enter en la contraseña, también se ejecuta el login
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            Entrar();
        }
    };

    return(
        <div className="login-page">
            <div className="container">
                <img src={logo} className="imagen" alt="Logo MecaOfi"/>
                
                <div className="input-group">
                    <h2>Usuario</h2>
                    <input 
                        type="text" 
                        value={comercial} 
                        onChange={(e) => setComercial(e.target.value)}
                        disabled={loading}
                    />
                </div>

                <div className="input-group">
                    <h2>Contraseña</h2>
                    <input 
                        type="password" 
                        value={contrasenna} 
                        onChange={(e) => setContrasenna(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={loading}
                    />
                </div>
                
                <br />
                {error && <p className="error-message">{error}</p>}
                
                <button 
                    className="boton" 
                    onClick={Entrar} 
                    disabled={loading} // El botón se deshabilita durante la carga
                >
                    {loading ? 'Cargando...' : 'Entrar'}
                </button>
            </div>
        </div>
    );
}
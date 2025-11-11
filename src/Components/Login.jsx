import { useState } from "react";
import './Login.css';
import { useNavigate } from "react-router-dom"; 
// 🚨 CORRECCIÓN: Importar la imagen de forma modular
import logo from '../assets/Logo-Mecaofi.jpg'; 

// ==========================================================
// ** CONFIGURACIÓN **
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
            // ... (Lógica de obtención de CSRF y Login sin cambios)
            const csrfResponse = await fetch(`${API_URL}/sanctum/csrf-cookie`, {
                method: 'GET',
                credentials: 'include', 
            });

            if (!csrfResponse.ok) {
                throw new Error("Fallo al obtener la cookie CSRF. Revisa el CORS en el backend.");
            }

            const loginResponse = await fetch(`${API_URL}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    Comercial: comercial, 
                    Pass: contrasenna,    
                }),
                credentials: 'include', 
            });
            
            if (!loginResponse.ok) {
                if (loginResponse.status === 419) {
                    throw new Error("ERROR 419: Sesión expirada o token CSRF inválido. Revisa tu archivo cors.php.");
                }
                
                let errorData;
                const contentType = loginResponse.headers.get("content-type");

                if (contentType && contentType.includes("application/json")) {
                    errorData = await loginResponse.json();
                } else {
                    const errorText = await loginResponse.text();
                    console.error("Respuesta no-JSON del servidor:", errorText);
                    throw new Error(`Error ${loginResponse.status}. El servidor no devolvió un JSON válido.`);
                }

                const errorMessage = errorData.message || `Error del servidor (Código ${loginResponse.status}).`;
                throw new Error(errorMessage);
            }

            const data = await loginResponse.json(); 

            localStorage.setItem('token', data.token);
            localStorage.setItem('comercialId', data.comercialId);
            localStorage.setItem('comercialName', comercial); 
            
            // Asumiendo que /Home es la ruta correcta definida en App.js
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
                {/* 🚨 CORRECCIÓN: Usar la variable 'logo' importada */}
                <img src={logo} className="imagen" alt="Logo MecaOfi"/>
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
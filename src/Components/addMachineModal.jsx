// addMachineModal.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";
// Asegúrate de que este archivo CSS exista y contenga los estilos necesarios
import "./addClientModal.css"; 
// Podrías necesitar un archivo CSS específico para este modal si quieres separarlo
// import "./addMachineModal.css"; 

const AddMachineModal = ({ isOpen, onClose, fetchMachines, machineToEdit, currentIdCliente }) => {
  
  // Define el estado inicial de los campos del formulario
  const initialState = {
    Nombre: '',
    Marca: '',
    Modelo: '',
    
    Velocidad: '',
    
    Imagen: '', // Esta será la URL de la imagen
    Tipo: 1, // 1=Color (o 0=Negro)
  };
  
  const [formData, setFormData] = useState(initialState);
  const [selectedFile, setSelectedFile] = useState(null); // Estado para el archivo seleccionado
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false); 

  useEffect(() => {
    if (isOpen) {
      if (machineToEdit) {
        setFormData({
          Nombre: machineToEdit.Nombre || '',
          Marca: machineToEdit.Marca || '',
          Modelo: machineToEdit.Modelo || '',
          
          Velocidad: machineToEdit.Velocidad || '',
          
          Imagen: machineToEdit.Imagen || '', // Carga la URL de imagen existente
          Tipo: machineToEdit.Tipo !== undefined ? machineToEdit.Tipo : 1, 
        });
      } else {
        setFormData(initialState);
      }
      
      setSelectedFile(null); // Resetea el archivo seleccionado al abrir
      setError(null);
      setSuccessMessage(null);
      setSubmitting(false);
    }
  }, [isOpen, machineToEdit, currentIdCliente]); 
  
  // Handler para campos de texto y select
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handler para el select de Tipo
  const handleTipoChange = (e) => {
    const value = parseInt(e.target.value, 10);
    setFormData((prev) => ({ ...prev, Tipo: value }));
  };

  // 🚨 NUEVO HANDLER: Maneja la selección del archivo de imagen
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  // 🚨 FUNCIÓN DE ENVÍO ACTUALIZADA
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setSubmitting(true);

    if (!currentIdCliente && !machineToEdit) {
        setError("Error: El ID del cliente no está disponible.");
        setSubmitting(false);
        return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token de autenticación no encontrado.");
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          // No necesitamos 'Content-Type': 'application/json' si vamos a subir FormData, 
          // el navegador lo maneja automáticamente
        },
      };
      
      let imageUrl = formData.Imagen; // URL de imagen existente por defecto

      // PASO 1: Subir la imagen si se seleccionó una nueva
      if (selectedFile) {
        setSuccessMessage("Subiendo imagen, por favor espere...");
        const uploadData = new FormData();
        // 'file' debe coincidir con el campo que espera tu API de subida
        uploadData.append('file', selectedFile); 
        
        // El endpoint de subida debe estar configurado en tu backend (ej: Express/Multer)
        const uploadResponse = await axios.post(
          "http://localhost:8000/api/upload", 
          uploadData,
          config 
        );
        
        // **Ajusta esta línea** a la estructura de respuesta real de tu API de subida
        // Asume que la URL está en uploadResponse.data.url o similar
        imageUrl = uploadResponse.data.url; 
        setSuccessMessage("Imagen subida con éxito. Guardando máquina...");
      }
      
      // PASO 2: Enviar los datos de la máquina
      const dataToSend = {
          ...formData,
          PrecioMaquina: parseFloat(formData.PrecioMaquina) || 0,
          IdCliente: machineToEdit ? machineToEdit.IdCliente : currentIdCliente,
          Imagen: imageUrl // Usar la nueva URL o la URL existente
      };

      if (machineToEdit) {
        // PATCH/POST para actualizar
        await axios.post( 
          `http://localhost:8000/api/maquinas/${machineToEdit.Id}`,
          dataToSend, 
          config
        );
        setSuccessMessage("Máquina actualizada con éxito.");
      } else {
        // POST para crear
        await axios.post(
          "http://localhost:8000/api/maquinas",
          dataToSend, 
          config
        );
        setSuccessMessage("Máquina creada con éxito.");
      }

      fetchMachines(); 
      setTimeout(() => {
        onClose(); 
      }, 1500);
    } catch (err) {
      console.error("Error al guardar la máquina:", err);
      // Muestra un mensaje más útil si falla la subida o el guardado
      let errMsg = 'Error desconocido al guardar la máquina.';
      if (err.response?.data?.message) {
        errMsg = err.response.data.message;
      } else if (err.message) {
        errMsg = err.message;
      }
      
      // Si la subida falla, muestra un mensaje específico
      if (selectedFile && !machineToEdit) {
          errMsg = `Error en la subida de la imagen o al guardar la máquina: ${errMsg}`;
      }
      
      setError(errMsg);
      setSuccessMessage(null); // Limpia el mensaje de éxito de subida si hay error final
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2 className="modal-title">
          {machineToEdit ? "Editar Máquina" : "Añadir Nueva Máquina"}
        </h2>
        
        {/* Usamos el formulario para contener los botones de acción para que el type="submit" funcione */}
        <form onSubmit={handleSubmit} className="form-container">
            
            {successMessage && <p className="success-message-modal">{successMessage}</p>}
            {error && <p className="error-message-modal">{error}</p>}

            <div className="modal-actions-header">
                <button
                        type="button"
                        onClick={onClose} 
                        className="boton2"
                        disabled={submitting}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="submit-button"
                        disabled={submitting}
                    >
                        {submitting 
                        ? (machineToEdit ? 'Guardando...' : 'Añadiendo...') 
                        : (machineToEdit ? 'Guardar Cambios' : 'Añadir Máquina')}
                    </button>
            </div>
            
            <div className="modal-body">
                {/* Fila 1: Nombre y Marca */}
                <div className="form-group-row">
                    <div className="form-group">
                        <label htmlFor="Marca">Marca</label>
                        <input type="text" id="Marca" name="Marca" value={formData.Marca} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="Modelo">Modelo</label>
                        <input type="text" id="Modelo" name="Modelo" value={formData.Modelo} onChange={handleChange} required />
                    </div>
                </div>
                
                {/* Fila 2: Velocidad y PrecioMaquina */}
                <div className="form-group-row">
                    <div className="form-group">
                        <label htmlFor="Velocidad">Velocidad</label>
                        <input type="text" id="Velocidad" name="Velocidad" value={formData.Velocidad} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="Tipo">Tipo de Impresión</label>
                        <select
                        name="Tipo"
                        id="Tipo"
                        value={formData.Tipo} 
                        onChange={handleTipoChange}
                        required
                        className="select-field" 
                        >
                        <option value={1}>Color</option>
                        <option value={0}>Negro</option> 
                        </select>
                    </div>
                </div>
                {/* Fila 4: Tipo (0/1) y Imagen (Explorador de Archivos) */}
                <div className="form-group-row">
                    {/* 🚨 INPUT DE ARCHIVO (Explorador de Archivos) */}
                    <div className="form-group">
                        <label htmlFor="ImagenFile">Imagen de la Máquina</label>
                        <input 
                            type="file" 
                            id="ImagenFile" 
                            name="ImagenFile" // Nombre del campo para el archivo
                            onChange={handleFileChange} // Handler para capturar el archivo
                            accept="image/*" // Solo permite imágenes
                        />
                        {/* Indicador de archivo seleccionado */}
                        {selectedFile ? (
                            <p className="file-name-info">✅ Archivo listo: **{selectedFile.name}**</p>
                        ) : (
                            formData.Imagen && (
                                <p className="file-name-info">
                                    🖼️ URL actual: {formData.Imagen.substring(0, 40)}... 
                                    (Selecciona otro archivo para reemplazar)
                                </p>
                            )
                        )}
                    </div>
                </div>
            </div>
        </form>
      </div>
    </div>
  );
};

export default AddMachineModal;
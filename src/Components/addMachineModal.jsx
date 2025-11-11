// addMachineModal.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";
import "./addClientModal.css"; 

const AddMachineModal = ({ isOpen, onClose, fetchMachines, machineToEdit, currentIdCliente }) => {
  const initialState = {
    Nombre: '',
    Marca: '',
    Modelo: '',
    Nserie: '',
    // Campos Añadidos:
    Velocidad: '',
    PrecioMaquina: '',
    Imagen: '',
    Tipo: 1, // 1=Color (o 0=Negro)
  };
  const [formData, setFormData] = useState(initialState);
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
          Nserie: machineToEdit.Nserie || '',
          // Carga de campos añadidos
          Velocidad: machineToEdit.Velocidad || '',
          PrecioMaquina: machineToEdit.PrecioMaquina || '',
          Imagen: machineToEdit.Imagen || '',
          Tipo: machineToEdit.Tipo !== undefined ? machineToEdit.Tipo : 1, 
        });
      } else {
        setFormData(initialState);
      }
      
      setError(null);
      setSuccessMessage(null);
      setSubmitting(false);
    }
  }, [isOpen, machineToEdit, currentIdCliente]); 
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTipoChange = (e) => {
    // Asegura que Tipo se guarde como un número entero (0 o 1)
    const value = parseInt(e.target.value, 10);
    setFormData((prev) => ({ ...prev, Tipo: value }));
  };

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
        },
      };
      
      const dataToSend = {
          ...formData,
          // Convertir PrecioMaquina a float (opcional, pero buena práctica)
          PrecioMaquina: parseFloat(formData.PrecioMaquina) || 0,
          // Añadir el IdCliente que se pasa por prop
          IdCliente: machineToEdit ? machineToEdit.IdCliente : currentIdCliente
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
      const errMsg = err.response?.data?.message || err.message || 'Error desconocido al guardar la máquina.';
      setError(errMsg);
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
        
        {successMessage && <p className="success-message-modal">{successMessage}</p>}
        {error && <p className="error-message-modal">{error}</p>}

        <div className="modal-body">
            <h1>Añadir Maquina</h1>
            <form onSubmit={handleSubmit} className="form-container">
            
            {/* Fila 1: Nombre y Marca */}
            <div className="form-group-row">
                <div className="form-group">
                    <label htmlFor="Nombre">Nombre/Alias</label>
                    <input type="text" id="Nombre" name="Nombre" value={formData.Nombre} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="Marca">Marca</label>
                    <input type="text" id="Marca" name="Marca" value={formData.Marca} onChange={handleChange} required />
                </div>
            </div>

            {/* Fila 2: Modelo y Nserie */}
            <div className="form-group-row">
                <div className="form-group">
                    <label htmlFor="Modelo">Modelo</label>
                    <input type="text" id="Modelo" name="Modelo" value={formData.Modelo} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="Nserie">N° de Serie</label>
                    <input type="text" id="Nserie" name="Nserie" value={formData.Nserie} onChange={handleChange} required />
                </div>
            </div>
            
            {/* 🚨 Fila 3: Velocidad y PrecioMaquina (Nuevos campos) */}
            <div className="form-group-row">
                <div className="form-group">
                    <label htmlFor="Velocidad">Velocidad</label>
                    <input type="text" id="Velocidad" name="Velocidad" value={formData.Velocidad} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="PrecioMaquina">Precio Máquina (€)</label>
                    {/* Usamos type="number" para mejor validación en el cliente */}
                    <input type="number" step="0.01" id="PrecioMaquina" name="PrecioMaquina" value={formData.PrecioMaquina} onChange={handleChange} required />
                </div>
            </div>

            {/* Fila 4: Tipo (0/1) e Imagen */}
            <div className="form-group-row">
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
                <div className="form-group">
                    <label htmlFor="Imagen">URL Imagen (Opcional)</label>
                    <input type="text" id="Imagen" name="Imagen" value={formData.Imagen} onChange={handleChange} />
                </div>
            </div>

            {/* Botones de acción */}
            <div className="button-group-modal">
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
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddMachineModal;
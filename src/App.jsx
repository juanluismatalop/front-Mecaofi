import './App.css';
import HomePage from './Components/HomePage';
import Login from './Components/Login';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    // 🚨 CORRECCIÓN CLAVE: Añadir basename="/LibroVisitas"
    // Esto resuelve el error de URL que te mostraba el servidor.
    <Router basename="/LibroVisitas">
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="*" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
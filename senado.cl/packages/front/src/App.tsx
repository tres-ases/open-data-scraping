import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import {
    Home,
    SenadoresList,
    SenadorDetail,
    PartidosList,
    PartidoDetail,
    ProyectosList,
    ProyectoDetail
  } from './pages';

function App() {
  return (
    <div className="content">
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/senadores" element={<SenadoresList />} />
        <Route path="/senadores/:slug" element={<SenadorDetail />} />
        <Route path="/partidos" element={<PartidosList />} />
        <Route path="/partidos/:id" element={<PartidoDetail />} />
        <Route path="/proyectos" element={<ProyectosList />} />
        <Route path="/proyectos/:boletin" element={<ProyectoDetail />} />
      </Routes>
    </Router>
    </div>
  );
}

export default App; 

import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Home from './pages/Home';
import CreateEvent from './pages/CreateEvent';
import MyEvents from './pages/MyEvents';
import Checkout from './pages/Checkout';
import MyTickets from './pages/MyTickets';
import SharedTicket from './pages/SharedTicket';
import Portaria from './pages/Portaria';
import './App.css';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/entrar" element={<Login />} />
        {/* Pública, sem login — navegação e busca pelos eventos publicados
            é um requisito de Front-End do enunciado, não uma tela de cliente.
            Login só é exigido na hora de reservar de verdade. */}
        <Route path="/" element={<Home />} />
        <Route
          path="/eventos/novo"
          element={
            <ProtectedRoute papeisPermitidos={['organizador']}>
              <CreateEvent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/eventos/meus"
          element={
            <ProtectedRoute papeisPermitidos={['organizador']}>
              <MyEvents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reservas/:id/pagamento"
          element={
            <ProtectedRoute papeisPermitidos={['cliente']}>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ingressos"
          element={
            <ProtectedRoute papeisPermitidos={['cliente']}>
              <MyTickets />
            </ProtectedRoute>
          }
        />
        <Route path="/ingressos/compartilhar/:slugCompartilhamento" element={<SharedTicket />} />
        <Route
          path="/portaria"
          element={
            <ProtectedRoute papeisPermitidos={['portaria']}>
              <Portaria />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

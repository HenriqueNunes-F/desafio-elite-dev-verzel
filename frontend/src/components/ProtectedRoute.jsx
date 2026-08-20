import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Bloqueia uma rota por autenticação e, opcionalmente, por papel.
// papeisPermitidos vazio/ausente = qualquer usuário autenticado passa.
export default function ProtectedRoute({ children, papeisPermitidos }) {
  const { estaAutenticado, usuario } = useAuth();

  if (!estaAutenticado) {
    return <Navigate to="/entrar" replace />;
  }

  if (papeisPermitidos && !papeisPermitidos.includes(usuario.papel)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// All the routes (pages) in the app.
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import GamesPage from './pages/GamesPage';
import GamePage from './pages/GamePage';
import AdminPage from './pages/AdminPage';
import AdminGamePage from './pages/AdminGamePage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Navbar />
            <GamesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/game/:gameId"
        element={
          <ProtectedRoute>
            <Navbar />
            <GamePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <Navbar />
            <AdminPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/game/:gameId"
        element={
          <AdminRoute>
            <Navbar />
            <AdminGamePage />
          </AdminRoute>
        }
      />

      {/* Unknown address -> start page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

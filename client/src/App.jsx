import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ThemeProvider } from './theme/ThemeContext';
import { ToastProvider } from './toast/ToastContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { Layout } from './components/Layout';
import { AppShell } from './components/AppShell';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminTaxYearsPage } from './pages/AdminTaxYearsPage';
import { AdminTaxYearFormPage } from './pages/AdminTaxYearFormPage';
import { ChatPage } from './pages/ChatPage';
import { ReportPage } from './pages/ReportPage';
import './App.css';

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route
                  path="/admin/tax-years"
                  element={
                    <ProtectedRoute adminOnly>
                      <AdminTaxYearsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/tax-years/new"
                  element={
                    <ProtectedRoute adminOnly>
                      <AdminTaxYearFormPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/tax-years/:year"
                  element={
                    <ProtectedRoute adminOnly>
                      <AdminTaxYearFormPage />
                    </ProtectedRoute>
                  }
                />
              </Route>

              <Route
                element={
                  <ProtectedRoute>
                    <AppShell />
                  </ProtectedRoute>
                }
              >
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/chat/:id" element={<ChatPage />} />
                <Route path="/reports/:id" element={<ReportPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import { AuthProvider } from './context/AuthContext';
import LoadingScreen from './components/common/LoadingScreen';
import ProtectedRoute from './components/ProtectedRoute';

const Login = lazy(() => import('./pages/Login'));
const Home = lazy(() => import('./pages/Home'));
const CompanyList = lazy(() => import('./pages/CompanyList'));
const IndividualList = lazy(() => import('./pages/IndividualList'));
const Notifications = lazy(() => import('./pages/Notifications'));
const ExpiredIds = lazy(() => import('./pages/ExpiredIds'));
const ExpiringSoonIds = lazy(() => import('./pages/ExpiringSoonIds'));

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              
              <Route path="/" element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              } />
              
              <Route path="/main-person/:id/companies" element={
                <ProtectedRoute>
                  <CompanyList />
                </ProtectedRoute>
              } />
              
              <Route path="/company/:id/individuals" element={
                <ProtectedRoute>
                  <IndividualList />
                </ProtectedRoute>
              } />
              
              <Route path="/notifications" element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              } />
              
              <Route path="/expired-ids/:mainPersonId" element={
                <ProtectedRoute>
                  <ExpiredIds />
                </ProtectedRoute>
              } />
              
              <Route path="/expiring-soon/:mainPersonId" element={
                <ProtectedRoute>
                  <ExpiringSoonIds />
                </ProtectedRoute>
              } />

              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

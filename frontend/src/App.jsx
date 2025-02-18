import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import { AuthProvider } from './context/AuthContext';
import LoadingScreen from './components/common/LoadingScreen';
import ProtectedRoute from './components/ProtectedRoute';

const Home = lazy(() => import('./pages/Home'));
const CompanyList = lazy(() => import('./pages/CompanyList'));
const IndividualList = lazy(() => import('./pages/IndividualList'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
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
              <Route path="/" element={<Home />} />
              <Route path="/main-person/:id/companies" element={<CompanyList />} />
              <Route path="/company/:id/individuals" element={<IndividualList />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/notifications" element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              } />
              <Route path="/expired-ids/:mainPersonId" element={<ExpiredIds />} />
              <Route path="/expiring-soon/:mainPersonId" element={<ExpiringSoonIds />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

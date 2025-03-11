import { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { createTheme } from '@mui/material/styles';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import theme from './theme';
import { AuthProvider } from './context/AuthContext';
import LoadingScreen from './components/common/LoadingScreen';
import ProtectedRoute from './components/ProtectedRoute';
import UserManagement from './pages/UserManagement';
import { Toaster } from 'react-hot-toast';
import AppLayout from './components/layout/AppLayout';

const Login = lazy(() => import('./pages/Login'));
const Home = lazy(() => import('./pages/Home'));
const CompanyList = lazy(() => import('./pages/CompanyList'));
const IndividualList = lazy(() => import('./pages/IndividualList'));
const Notifications = lazy(() => import('./pages/Notifications'));
const ExpiredIds = lazy(() => import('./pages/ExpiredIds'));
const ExpiringSoonIds = lazy(() => import('./pages/ExpiringSoonIds'));
const IncomeExpense = lazy(() => import('./pages/IncomeExpense'));
const AdminNotifications = lazy(() => import('./pages/AdminNotifications'));
const NasserIncomeExpense = lazy(() => import('./pages/NasserIncomeExpense'));
const BulkMigration = lazy(() => import('./pages/BulkMigration'));

function App() {
  const { i18n } = useTranslation();
  const [rtlCache, setRtlCache] = useState(null);

  useEffect(() => {
    const direction = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.dir = direction;
    
    const cache = createCache({
      key: direction === 'rtl' ? 'muirtl' : 'muiltr',
      stylisPlugins: direction === 'rtl' ? [prefixer, rtlPlugin] : [prefixer],
    });
    
    setRtlCache(cache);
  }, [i18n.language]);

  const currentTheme = createTheme({
    ...theme,
    direction: i18n.language === 'ar' ? 'rtl' : 'ltr',
  });

  if (!rtlCache) {
    return <LoadingScreen />;
  }

  return (
    <CacheProvider value={rtlCache}>
      <ThemeProvider theme={currentTheme}>
        <CssBaseline />
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<LoadingScreen />}>
              <Toaster position="top-right" />
              <Routes>
                <Route path="/login" element={<Login />} />
                
                <Route path="/" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Home />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/main-person/:id/companies" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <CompanyList />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/company/:id/individuals" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <IndividualList />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/notifications" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Notifications />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/expired-ids/:mainPersonId" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <ExpiredIds />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/expiring-soon/:mainPersonId" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <ExpiringSoonIds />
                    </AppLayout>
                  </ProtectedRoute>
                } />

                <Route path="/income-expense" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <IncomeExpense />
                    </AppLayout>
                  </ProtectedRoute>
                } />

                <Route path="/users" element={
                  <ProtectedRoute adminOnly={true}>
                    <AppLayout>
                      <UserManagement />
                    </AppLayout>
                  </ProtectedRoute>
                } />

                <Route path="/admin-notifications" element={
                  <ProtectedRoute adminOnly={true}>
                    <AppLayout>
                      <AdminNotifications />
                    </AppLayout>
                  </ProtectedRoute>
                } />

                <Route path="/nasser-income-expense" element={
                  <ProtectedRoute adminOnly={true}>
                    <AppLayout>
                      <NasserIncomeExpense />
                    </AppLayout>
                  </ProtectedRoute>
                } />

                <Route path="/bulk-migration" element={
                  <ProtectedRoute adminOnly={true}>
                    <AppLayout>
                      <BulkMigration />
                    </AppLayout>
                  </ProtectedRoute>
                } />

                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </CacheProvider>
  );
}

export default App;

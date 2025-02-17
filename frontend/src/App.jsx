import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import { AuthProvider } from './context/AuthContext';
import LoadingScreen from './components/common/LoadingScreen';

const Home = lazy(() => import('./pages/Home'));
const CompanyList = lazy(() => import('./pages/CompanyList'));
const IndividualList = lazy(() => import('./pages/IndividualList'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));

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
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

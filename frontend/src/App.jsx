import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import Home from './pages/Home';
import CompanyList from './pages/CompanyList';
import IndividualList from './pages/IndividualList';
import AdminLogin from './pages/AdminLogin';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/main-person/:id/companies" element={<CompanyList />} />
            <Route path="/company/:id/individuals" element={<IndividualList />} />
            <Route path="/admin/login" element={<AdminLogin />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

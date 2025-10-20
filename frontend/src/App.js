import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import WriteComplaint from './pages/WriteComplaint';
import ConsultComplaints from './pages/ConsultComplaints';
import ComplaintsList from './pages/ComplaintsList';
import Reports from './pages/Reports';

function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/escribir-queja" element={<WriteComplaint />} />
          <Route path="/consultar-quejas" element={<ConsultComplaints />} />
          <Route path="/quejas/:entityId" element={<ComplaintsList />} />
          <Route path="/reportes" element={<Reports />} />
        </Routes>
      </Layout>
    </AuthProvider>
  );
}

export default App;

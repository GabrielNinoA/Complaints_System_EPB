import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import WriteComplaint from './pages/WriteComplaint';
import ConsultComplaints from './pages/ConsultComplaints';
import ComplaintsList from './pages/ComplaintsList';
import Reports from './pages/Reports';
import AuditHistory from './pages/AuditHistory';

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
          <Route path="/historial" element={<AuditHistory />} />
        </Routes>
      </Layout>
    </AuthProvider>
  );
}

export default App;

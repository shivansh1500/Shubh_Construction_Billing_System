import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import CreateBill from './pages/CreateBill';
import EditBill from './pages/EditBill';
import BillHistory from './pages/BillHistory';
import BillPreview from './pages/BillPreview';
import Templates from './pages/Templates';
import CreateTemplate from './pages/CreateTemplate';
import EditTemplate from './pages/EditTemplate';
import Settings from './pages/Settings';
import Backup from './pages/Backup';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create-bill" element={<CreateBill />} />
            <Route path="/edit-bill/:id" element={<EditBill />} />
            <Route path="/bill-history" element={<BillHistory />} />
            <Route path="/bill-preview/:id" element={<BillPreview />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/templates/create" element={<CreateTemplate />} />
            <Route path="/templates/edit/:id" element={<EditTemplate />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/backup" element={<Backup />} />
          </Routes>
        </MainLayout>
      </ToastProvider>
    </BrowserRouter>
  );
}

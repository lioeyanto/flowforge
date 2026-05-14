import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext.jsx';
import Layout from './components/Layout.jsx';
import Dashboard from './components/dashboard/Dashboard.jsx';
import WorkflowBuilder from './components/builder/WorkflowBuilder.jsx';
import InstancesList from './components/approvals/InstancesList.jsx';
import InstanceDetail from './components/approvals/InstanceDetail.jsx';
import APIReference from './components/api/APIReference.jsx';
import ToastContainer from './components/ToastContainer.jsx';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="gradient-bg"/>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace/>}/>
            <Route path="/dashboard" element={<Dashboard/>}/>
            <Route path="/builder/new" element={<WorkflowBuilder/>}/>
            <Route path="/builder/:id" element={<WorkflowBuilder/>}/>
            <Route path="/approvals" element={<InstancesList/>}/>
            <Route path="/approvals/:id" element={<InstanceDetail/>}/>
            <Route path="/api-reference" element={<APIReference/>}/>
          </Routes>
        </Layout>
        <ToastContainer/>
      </BrowserRouter>
    </AppProvider>
  );
}

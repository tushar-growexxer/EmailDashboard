import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import DashboardLayout from "./components/layout/DashboardLayout";
import Home from "./pages/Home";
import EmailAnalytics from "./pages/EmailAnalytics";
import SentimentDashboard from "./pages/SentimentDashboard";
import ProfileSettings from "./pages/ProfileSettings";
import Settings from "./pages/Settings";
import SessionWarning from "./components/SessionWarning";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

function App() {
  return (
    <Router>
      <SessionWarning />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        <Route element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route path="/dashboard" element={<Home />} />
          <Route path="/email-analytics" element={<EmailAnalytics />} />
          <Route path="/sentiment" element={<SentimentDashboard />} />
          <Route path="/profile" element={<ProfileSettings />} />
          <Route path="/settings" element={
            <AdminRoute>
              <Settings />
            </AdminRoute>
          } />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

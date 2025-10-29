import React, { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import SessionWarning from "./components/SessionWarning";
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";
import CatchAllRoute from "./routes/CatchAllRoute";

// Lazy load heavy components
const DashboardLayout = lazy(() => import("./components/layout/DashboardLayout"));
const EmailAnalytics = lazy(() => import("./pages/EmailAnalytics"));
const SentimentDashboard = lazy(() => import("./pages/SentimentDashboard"));
const Settings = lazy(() => import("./pages/Settings"));

// Loading fallback component
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <div>Loading...</div>
  </div>
);

function App() {
  return (
    <Router>
      <SessionWarning />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          <Route element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            {/* <Route path="/dashboard" element={<Home />} /> */}
            <Route path="/email-analytics" element={<EmailAnalytics />} />
            <Route path="/sentiment" element={<SentimentDashboard />} />
            <Route path="/settings" element={
              <AdminRoute>
                <Settings />
              </AdminRoute>
            } />
          </Route>

          {/* Catch-all route for undefined endpoints */}
          <Route path="*" element={<CatchAllRoute />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;

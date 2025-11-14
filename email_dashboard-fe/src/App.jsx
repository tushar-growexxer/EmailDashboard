import React, { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import ModernLogin from "./pages/ModernLogin";
import GoogleAuthSuccess from "./pages/GoogleAuthSuccess";
import EmailOnboarding from "./pages/EmailOnboarding";
import SessionWarning from "./components/SessionWarning";
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";
import CatchAllRoute from "./routes/CatchAllRoute";

// Lazy load heavy components
const DashboardLayout = lazy(() => import("./components/layout/DashboardLayout"));
const EmailAnalytics = lazy(() => import("./pages/EmailAnalytics"));
const SentimentDashboard = lazy(() => import("./pages/SentimentDashboard"));
const Settings = lazy(() => import("./pages/Settings"));

// Optimized loading fallback component for better LCP
const PageLoader = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    backgroundColor: 'var(--background, #ffffff)',
    color: 'var(--foreground, #000000)'
  }}>
    <div style={{ 
      fontSize: '14px',
      fontWeight: 500
    }}>Loading...</div>
  </div>
);

function App() {
  return (
    <Router>
      <SessionWarning />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<ModernLogin />} />
          <Route path="/login-old" element={<Login />} />
          <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />
          
          {/* Onboarding route - protected but doesn't require onboarding completion */}
          <Route path="/onboarding" element={
            <ProtectedRoute skipOnboardingCheck={true}>
              <EmailOnboarding />
            </ProtectedRoute>
          } />

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

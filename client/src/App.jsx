import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useState, useEffect } from 'react';

import { AuthProvider } from './contexts/AuthContext';
import { ComponentsProvider } from './contexts/ComponentsContext';
import { initResponsive } from './utils/responsive';

import Login from './pages/Login';
import Inventory from './pages/Inventory';
import AddComponent from './pages/AddComponent';
import EditComponent from './pages/EditComponent';
import EnhancedDashboard from './pages/EnhancedDashboard';
import Logs from './pages/Logs';
import Users from './pages/Users';
import ImportExport from './pages/ImportExport';
import Reservations from './pages/Reservations';
import MaintenanceTracking from './pages/MaintenanceTracking';
import AdvancedReports from './pages/AdvancedReports';
import ApprovalWorkflow from './pages/ApprovalWorkflow';
import UserProfile from './pages/UserProfile';
import RoleManagement from './pages/RoleManagement';
import StockMovement from './pages/StockMovement';
import WasteTracking from './pages/WasteTracking';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isTabletOrMobile, setIsTabletOrMobile] = useState(false);

  // Check screen size on mount and when window resizes
  useEffect(() => {
    const checkScreenSize = () => {
      setIsTabletOrMobile(window.innerWidth < 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 px-4 md:px-6 py-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function App() {
  // Initialize responsive utilities when app loads
  useEffect(() => {
    // Use requestIdleCallback for non-critical initialization to improve initial rendering
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        initResponsive();
      }, { timeout: 1000 });
    } else {
      // Fallback for browsers that don't support requestIdleCallback
      setTimeout(() => {
        initResponsive();
      }, 100);
    }
  }, []);

  return (
    <AuthProvider>
      <ComponentsProvider>
        <Router>
          <div className="App">
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              className="toast-container"
              toastClassName="toast"
              bodyClassName="toast-body"
            />
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <EnhancedDashboard />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inventory"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Inventory />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/add-component"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <AddComponent />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/edit-component/:id"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <EditComponent />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/stock-movement"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <StockMovement />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/logs"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Logs />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reservations"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Reservations />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/maintenance"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <MaintenanceTracking />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <AdvancedReports />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/import-export"
                element={
                  <ProtectedRoute requiredRole="Admin">
                    <Layout>
                      <ImportExport />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute requiredRole="Admin">
                    <Layout>
                      <Users />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/role-management"
                element={
                  <ProtectedRoute requiredRole="Admin">
                    <Layout>
                      <RoleManagement />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/approval-workflow"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ApprovalWorkflow />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <UserProfile />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/waste-tracking"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <WasteTracking />
                    </Layout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </Router>
      </ComponentsProvider>
    </AuthProvider>
  );
}

export default App;

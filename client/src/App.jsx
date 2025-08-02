import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './contexts/AuthContext';
import { ComponentsProvider } from './contexts/ComponentsContext';

import Login from './pages/Login';
import Inventory from './pages/Inventory';
import AddComponent from './pages/AddComponent';
import Dashboard from './pages/Dashboard';
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
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ComponentsProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
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
                  <ProtectedRoute role="Admin">
                    <Layout>
                      <ImportExport />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute role="Admin">
                    <Layout>
                      <Users />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/role-management"
                element={
                  <ProtectedRoute role="Admin">
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
                path="/user-profile"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <UserProfile />
                    </Layout>
                  </ProtectedRoute>
                }
              />
            </Routes>

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
              theme="light"
            />
          </div>
        </Router>
      </ComponentsProvider>
    </AuthProvider>
  );
}

export default App;

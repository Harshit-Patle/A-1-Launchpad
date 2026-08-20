import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, role = null, requiredRole = null }) {
    const { isAuthenticated, user, isLoading } = useAuth();

    // Show loading spinner while checking authentication
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Check role-based access
    const targetRole = requiredRole || role;
    if (targetRole) {
        const allowedRoles = Array.isArray(targetRole) ? targetRole : [targetRole];
        const normalizedAllowed = allowedRoles.map(r => String(r).toLowerCase());
        const userRole = String(user?.role || '').toLowerCase();

        if (!normalizedAllowed.includes(userRole)) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h1>
                        <p className="text-gray-600 mb-4">
                            You don't have permission to access this page.
                        </p>
                        <p className="text-sm text-gray-500">
                            Required role: {Array.isArray(targetRole) ? targetRole.join(', ') : targetRole} | Your role: {user?.role || 'None'}
                        </p>
                    </div>
                </div>
            );
        }
    }

    return children;
}

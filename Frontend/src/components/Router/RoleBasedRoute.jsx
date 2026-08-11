import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const RoleBasedRoute = ({ allowedRole, mustHaveProfile }) => {
    const isAuthenticated = localStorage.getItem('accessToken');

    const userRole = (localStorage.getItem('userRole') || '').toLowerCase();

    const hasProfile = localStorage.getItem('hasProfile') === 'true'; 

    if (!isAuthenticated) {
        console.warn("RoleBasedRoute: User not authenticated. Redirecting to login.");
        return <Navigate to="/login" replace />;
    }

    if (mustHaveProfile && !hasProfile) {
         console.warn("RoleBasedRoute: Profile not completed. Redirecting to setup.");
         return <Navigate to="/setup-profile" replace />;
    }

    if (allowedRole !== 'any') {
        if (userRole !== allowedRole.toLowerCase()) {
            console.warn(`RoleBasedRoute: Access denied. Required: ${allowedRole}, Current: ${userRole}`);
            return <Navigate to="/" replace />;
        }
    }

    return <Outlet />;
};

export default RoleBasedRoute;
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const DashboardRouter: React.FC = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  switch (currentUser.role) {
    case 'ADMIN':
      return <Navigate to="/admin" replace />;
    case 'GVCN':
      return <Navigate to="/gvcn" replace />;
    case 'TO_TRUONG':
      return <Navigate to="/to-truong" replace />;
    case 'HIEU_TRUONG':
    case 'PHO_HIEU_TRUONG':
    case 'TONG_PHU_TRACH':
    case 'GIAM_THI':
      return <Navigate to="/school" replace />;
    default:
      return <Navigate to="/gvcn" replace />;
  }
};

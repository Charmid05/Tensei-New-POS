import { createFileRoute, Navigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import apiClient from '@/api/client';
import { NewEnhancedKitchenLayout } from '@/components/kitchen/NewEnhancedKitchenLayout';
import type { User } from '@/types';

export const Route = createFileRoute('/kitchen')({
  component: KitchenPage,
});

function KitchenPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    const loadAuthState = async () => {
      const token = localStorage.getItem('pos_token');
      const storedUser = localStorage.getItem('pos_user');
      
      console.log('🔍 Loading kitchen auth - token:', token ? 'exists' : 'missing');
      console.log('🔍 Loading kitchen auth - user:', storedUser ? 'exists' : 'missing');
      
      if (storedUser && token) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          console.log('✅ Kitchen auth loaded - user role:', parsedUser.role);
        } catch (error) {
          console.error('❌ Invalid stored auth data, clearing');
          apiClient.clearAuth();
        }
      }
      
      setIsLoadingAuth(false);
    };
    
    loadAuthState();
  }, []);

  // Loading state
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading kitchen...</p>
        </div>
      </div>
    );
  }

  // Check authentication
  if (!apiClient.isAuthenticated() || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has kitchen access (kitchen, admin, or manager roles)
  const hasKitchenAccess = user.role === 'kitchen' || user.role === 'admin' || user.role === 'manager';
  
  if (!hasKitchenAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access the kitchen display.</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Return to Main POS
          </button>
        </div>
      </div>
    );
  }

  return <NewEnhancedKitchenLayout user={user} />;
}

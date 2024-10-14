"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const router = useRouter();
    let isAuthenticated = false;

    useEffect(() => {
        const token = localStorage.getItem('token');
        
        if (token) {
            isAuthenticated = true;
        }

        if (!isAuthenticated) {
            router.replace('/login');
        }
    }, [router]);

    if (isAuthenticated) {
        return <>{children}</>;
    }
    return null;
};

export default ProtectedRoute;

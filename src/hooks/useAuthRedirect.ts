import { usePathname, useRouter } from 'expo-router';
import { useEffect } from 'react';

import { useAuthStore } from '@/src/stores/authStore';

export function useAuthRedirect(): 'login_required' | 'reentry' | null {
  const router = useRouter();
  const pathname = usePathname();
  const authStatus = useAuthStore((state) => state.status);

  useEffect(() => {
    if (authStatus === 'unauthenticated' && pathname !== '/login') {
      router.replace('/login');
      return;
    }

    if (authStatus === 'authenticated' && pathname === '/login') {
      router.replace('/');
    }
  }, [authStatus, pathname, router]);

  if (authStatus === 'unauthenticated' && pathname !== '/login') {
    return 'login_required';
  }

  if (authStatus === 'authenticated' && pathname === '/login') {
    return 'reentry';
  }

  return null;
}

import { usePathname, useRouter } from 'expo-router';
import { useEffect } from 'react';

import { useAuthStore } from '@/src/stores/authStore';

const PUBLIC_PATHS = ['/', '/me', '/privacy', '/login'] as const;

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.includes(pathname as (typeof PUBLIC_PATHS)[number]);
}

export function useAuthRedirect(): 'login_required' | 'reentry' | null {
  const router = useRouter();
  const pathname = usePathname();
  const authStatus = useAuthStore((state) => state.status);

  useEffect(() => {
    if (authStatus === 'unauthenticated' && !isPublicPath(pathname)) {
      router.replace('/login');
      return;
    }

    if (authStatus === 'authenticated' && pathname === '/login') {
      router.replace('/');
    }
  }, [authStatus, pathname, router]);

  if (authStatus === 'unauthenticated' && !isPublicPath(pathname)) {
    return 'login_required';
  }

  if (authStatus === 'authenticated' && pathname === '/login') {
    return 'reentry';
  }

  return null;
}

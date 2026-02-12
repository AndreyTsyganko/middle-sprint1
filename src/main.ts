import './styles/main.scss';
import { Router } from './utils/router';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import ChatsPage from './pages/ChatsPage/ChatsPage';
import { api } from './Api/Client';

console.log('App starting...');

const router = new Router();

console.log('Registering routes...');
router
  .use('/', LoginPage)
  .use('/sign-up', RegisterPage)
  .use('/settings', ProfilePage)
  .use('/messenger', ChatsPage)
  .start();

declare global {
  interface Window {
    appRouter: Router;
    api: typeof api;
    handleLoginSuccess: () => void;
    handleLogout: () => Promise<void>;
    isAuthenticated: () => boolean;
    getCurrentUser: () => any;
  }
}

window.appRouter = router;
window.api = api;

console.log('App initialized');

async function checkAuth(): Promise<boolean> {
  console.log('Checking authentication...');

  try {
    const user = await api.getUser();
    console.log('User authenticated:', user);

    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('authChecked', 'true');

    return true;
  } catch (error: any) {
    console.log('User not authenticated:', error.message);

    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    localStorage.setItem('authChecked', 'true');

    return false;
  }
}

export function handleLoginSuccess(): void {
  console.log('Login successful, updating auth state...');

  localStorage.setItem('authChecked', 'true');

  checkAuth().then((isAuthenticated) => {
    if (isAuthenticated) {
      const redirectPath = sessionStorage.getItem('redirectAfterLogin');

      if (redirectPath) {
        sessionStorage.removeItem('redirectAfterLogin');
        router.go(redirectPath);
      } else {
        router.go('/messenger');
      }
    }
  });
}

export async function handleLogout(): Promise<void> {
  console.log('Logging out...');

  try {
    await api.logout();
  } catch (error) {
    console.error('Logout API error:', error);
  } finally {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    localStorage.setItem('authChecked', 'true');

    router.go('/');
  }
}

async function initApp(): Promise<void> {
  console.log('initApp called');

  const currentPath = window.location.pathname;
  const publicRoutes = ['/', '/sign-up'];
  const protectedRoutes = ['/settings', '/messenger'];

  console.log('Current path:', currentPath);

  const isAuthenticated = await checkAuth();

  if (isAuthenticated) {
    console.log('User is authenticated');

    if (publicRoutes.includes(currentPath)) {
      console.log(`Authenticated user on public page ${currentPath}, redirecting to /messenger`);
      router.go('/messenger');
      return;
    }

    if (protectedRoutes.includes(currentPath)) {
      console.log(`Authenticated user accessing protected route ${currentPath}`);
    }
  } else {
    console.log('User is not authenticated');

    if (protectedRoutes.includes(currentPath)) {
      console.log(`Unauthorized access to ${currentPath}, redirecting to login`);

      sessionStorage.setItem('redirectAfterLogin', currentPath);

      router.go('/');
      return;
    }

    if (publicRoutes.includes(currentPath)) {
      console.log(`Unauthenticated user accessing public route ${currentPath}`);
      return;
    }

    console.log(`Unknown route ${currentPath}, redirecting to login`);
    router.go('/');
  }
}

export function isAuthenticated(): boolean {
  const user = localStorage.getItem('user');
  const authChecked = localStorage.getItem('authChecked') === 'true';

  return authChecked && !!user;
}

export function getCurrentUser(): any {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  return null;
}

export { router, api };

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing app...');
  initApp();
});

window.handleLoginSuccess = handleLoginSuccess;
window.handleLogout = handleLogout;
window.isAuthenticated = isAuthenticated;
window.getCurrentUser = getCurrentUser;

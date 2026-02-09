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
  }
}

window.appRouter = router;
window.api = api;

console.log('App initialized');
console.log('Auth status:', api.isAuthenticated() ? 'Authenticated' : 'Not authenticated');

async function initApp() {
  console.log('initApp called');
  
  if (api.isAuthenticated()) {
    console.log('User is authenticated');
    
    try {
      const user = await api.getUser();
      console.log('User loaded successfully:', user);
      
      localStorage.setItem('user', JSON.stringify(user));
      
      const currentPath = window.location.pathname;
      const publicRoutes = ['/', '/sign-up'];
      
      if (publicRoutes.includes(currentPath)) {
        console.log(`Authenticated user on public page ${currentPath}, redirecting to /messenger`);
        router.go('/messenger');
      }
      
    } catch (error: any) {
      console.error('Failed to load user:', error);
      
      if (error.message.includes('401') || error.message.includes('Не авторизован')) {
        console.log('Invalid token, logging out...');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        
        if (window.location.pathname !== '/') {
          router.go('/');
        }
      }
    }
  } else {
    console.log('User is not authenticated');
    
    const currentPath = window.location.pathname;
    const protectedRoutes = ['/settings', '/messenger'];
    
    if (protectedRoutes.includes(currentPath)) {
      console.log(`Unauthorized access to ${currentPath}, redirecting to login`);
      
      sessionStorage.setItem('redirectAfterLogin', currentPath);
      
      router.go('/');
    }
  }
}

export function handleLoginSuccess(token: string, userData?: any) {
  console.log('Login successful');
  
  localStorage.setItem('authToken', token);
  if (userData) {
    localStorage.setItem('user', JSON.stringify(userData));
  }
  
  const redirectPath = sessionStorage.getItem('redirectAfterLogin');
  
  if (redirectPath) {
    sessionStorage.removeItem('redirectAfterLogin');
    router.go(redirectPath);
  } else {
    router.go('/messenger');
  }
}

export function handleLogout() {
  console.log('Logging out...');
  
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  
  api.logout().catch(err => console.error('Logout API error:', err));
  
  router.go('/');
}

export function checkAuth() {
  return api.isAuthenticated();
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing app...');
  initApp();
});

export { router, api };

import Block from '../Core/Block';
import Route from './route';

export class Router {
  private static __instance: Router;

  private routes: Route<Block>[] = [];

  private currentRoute: Route<Block> | null = null;

  private history = window.history;

  constructor(private rootQuery: string = '#app') {
    if (Router.__instance) {
      return Router.__instance;
    }

    Router.__instance = this;
  }

  static getInstance(): Router {
    if (!Router.__instance) {
      Router.__instance = new Router();
    }
    return Router.__instance;
  }

  use<T extends Block>(pathname: string, component: new (props: any) => T): Router {
    const route = new Route(pathname, component, { rootQuery: this.rootQuery });
    this.routes.push(route);
    return this;
  }

  start(): void {
    console.log('Router started');

    window.addEventListener('click', (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a');

      if (link && link.getAttribute('href')) {
        event.preventDefault();
        const href = link.getAttribute('href');
        if (href) {
          this.go(href);
        }
      }
    });

    window.addEventListener('popstate', () => {
      const { pathname } = window.location;
      console.log('Browser navigation to:', pathname);
      this._onRoute(pathname);
    });

    const initialPath = window.location.pathname;
    console.log('Initial path:', initialPath);
    this._onRoute(initialPath);
  }

  private _onRoute(pathname: string): void {
    console.log(`Router._onRoute: ${pathname}`);

    const protectedRoutes = ['/settings', '/messenger'];
    const publicRoutes = ['/', '/sign-up'];
    const isAuthenticated = !!localStorage.getItem('authToken');

    console.log(`Auth check: route=${pathname}, authenticated=${isAuthenticated}`);

    if (protectedRoutes.includes(pathname) && !isAuthenticated) {
      console.log('No access to protected route, redirecting to login');
      alert('Для доступа к этой странице необходимо войти в систему');
      this.history.replaceState({}, '', '/');
      this._onRoute('/');
      return;
    }

    if (publicRoutes.includes(pathname) && isAuthenticated) {
      console.log('Already authenticated, redirecting to messenger');
      this.history.replaceState({}, '', '/messenger');
      this._onRoute('/messenger');
      return;
    }

    const route = this.getRoute(pathname);

    if (!route) {
      console.log('Route not found:', pathname);

      const messengerRoute = this.getRoute('/messenger');
      if (messengerRoute && isAuthenticated) {
        console.log('Redirecting authenticated user to messenger');
        this.history.replaceState({}, '', '/messenger');
        this._onRoute('/messenger');
        return;
      }

      const homeRoute = this.getRoute('/');
      if (homeRoute) {
        console.log('Redirecting to home page');
        this.history.replaceState({}, '', '/');
        this._onRoute('/');
        return;
      }
    }

    if (this.currentRoute) {
      console.log(`Leaving current route: ${this.currentRoute.pathname}`);
      this.currentRoute.leave();
    }

    if (route) {
      console.log(`Rendering route: ${route.pathname}`);
      this.currentRoute = route;
      route.render();
    } else {
      console.error('No route found, even / is missing!');
    }
  }

  go(pathname: string): void {
    console.log(`Router.go called: ${pathname}`);

    const protectedRoutes = ['/settings', '/messenger'];
    const publicRoutes = ['/', '/sign-up'];
    const isAuthenticated = !!localStorage.getItem('authToken');

    console.log(`Go auth check: route=${pathname}, authenticated=${isAuthenticated}`);

    if (protectedRoutes.includes(pathname) && !isAuthenticated) {
      console.log('Cannot navigate to protected route without auth');
      alert('Пожалуйста, войдите в систему');
      this.history.replaceState({}, '', '/');
      this._onRoute('/');
      return;
    }

    if (publicRoutes.includes(pathname) && isAuthenticated) {
      console.log('Already logged in, redirecting to messenger');
      this.history.replaceState({}, '', '/messenger');
      this._onRoute('/messenger');
      return;
    }

    this.history.pushState({}, '', pathname);
    this._onRoute(pathname);
  }

  back(): void {
    console.log('Router.back');
    this.history.back();
  }

  forward(): void {
    console.log('Router.forward');
    this.history.forward();
  }

  private getRoute(pathname: string): Route<Block> | undefined {
    const foundRoute = this.routes.find((r) => r.match(pathname));
    console.log(`Looking for route "${pathname}": ${foundRoute ? 'found' : 'not found'}`);
    return foundRoute;
  }
}

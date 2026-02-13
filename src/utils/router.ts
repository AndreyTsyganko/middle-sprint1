import Block from '../Core/Block';

export interface RouteProps {
  rootQuery: string;
}
interface RouteConstructor<T extends Block> {
  new (props: any): T;
}
class Route<T extends Block> {
  private _pathname: string;

  private _componentClass: RouteConstructor<T>;

  private _component: T | null;

  private _props: RouteProps;

  constructor(pathname: string, component: RouteConstructor<T>, props: RouteProps) {
    this._pathname = pathname;
    this._componentClass = component;
    this._component = null;
    this._props = props;
  }

  navigate(pathname: string): void {
    if (this.match(pathname)) {
      this._pathname = pathname;
      this.render();
    }
  }

  leave(): void {
    if (this._component) {
      this._component.hide();
      this._component = null;
    }
  }

  match(pathname: string): boolean {
    return pathname === this._pathname;
  }

  render(): void {
    if (!this._component) {
      this._component = new this._componentClass({});
    }

    const root = document.querySelector(this._props.rootQuery);
    if (root) {
      root.innerHTML = '';
      const content = this._component.getContent();
      if (content) {
        root.appendChild(content);
        this._component.dispatchComponentDidMount();
      }
    }
  }

  get pathname(): string {
    return this._pathname;
  }
}
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

  use<T extends Block>(pathname: string, component: RouteConstructor<T>): Router {
    const route = new Route(pathname, component, { rootQuery: this.rootQuery });
    this.routes.push(route as Route<Block>);
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

    const publicRoutes = ['/', '/signup'];

    const isProtectedRoute = protectedRoutes.includes(pathname);
    const isPublicRoute = publicRoutes.includes(pathname);
    const isAuthenticated = !!localStorage.getItem('authToken');

    console.log(`Auth check: route=${pathname}, protected=${isProtectedRoute}, public=${isPublicRoute}, authenticated=${isAuthenticated}`);

    if (isProtectedRoute && !isAuthenticated) {
      console.log('No access to protected route, redirecting to login');
      alert('Для доступа к этой странице необходимо войти в систему');
      this.history.replaceState({}, '', '/');
      this._onRoute('/');
      return;
    }

    if (isPublicRoute && isAuthenticated) {
      console.log('Already authenticated, redirecting to messenger');
      this.history.replaceState({}, '', '/messenger');
      this._onRoute('/messenger');
      return;
    }

    let route = this.getRoute(pathname);

    if (!route) {
      console.log('Route not found:', pathname);

      if (isAuthenticated) {
        route = this.getRoute('/messenger');
        if (route) {
          console.log('Redirecting authenticated user to messenger');
          this.history.replaceState({}, '', '/messenger');
          this._onRoute('/messenger');
          return;
        }
      }

      route = this.getRoute('/');
      if (route) {
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
    const publicRoutes = ['/', '/signup'];

    const isProtectedRoute = protectedRoutes.includes(pathname);
    const isPublicRoute = publicRoutes.includes(pathname);
    const isAuthenticated = !!localStorage.getItem('authToken');

    console.log(`Go auth check: route=${pathname}, protected=${isProtectedRoute}, public=${isPublicRoute}, authenticated=${isAuthenticated}`);

    if (isProtectedRoute && !isAuthenticated) {
      console.log('Cannot navigate to protected route without auth');
      alert('Пожалуйста, войдите в систему');
      this.history.replaceState({}, '', '/');
      this._onRoute('/');
      return;
    }

    if (isPublicRoute && isAuthenticated) {
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
    const route = this.routes.find((route) => route.match(pathname));
    console.log(`Looking for route "${pathname}": ${route ? 'found' : 'not found'}`);
    return route;
  }
}

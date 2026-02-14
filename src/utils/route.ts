import Block from '../Core/Block';

export interface RouteProps {
  rootQuery: string;
}

interface RouteConstructor<T extends Block> {
  new (props: any): T;
}

export default class Route<T extends Block> {
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

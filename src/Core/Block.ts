import EventBus from './EventBus';

export type Props = Record<string, unknown>;
export default class Block {
  static EVENTS = {
    INIT: 'init',
    FLOW_CDM: 'flow:component-did-mount',
    FLOW_CDU: 'flow:component-did-update',
    FLOW_RENDER: 'flow:render',
  };

  private _element: HTMLElement | null = null;

  private _meta: { tagName: string; props: Props };

  private eventBus: () => EventBus;

  props: Props;

  private _events: Record<string, EventListener> = {};

  constructor(tagName = 'div', props: Props = {}) {
    const eventBus = new EventBus();
    this._meta = { tagName, props };
    this.props = this._makePropsProxy(props);
    this.eventBus = () => eventBus;
    this._registerEvents(eventBus);
    eventBus.emit(Block.EVENTS.INIT);
  }

  private _registerEvents(eventBus: EventBus): void {
    eventBus.on(Block.EVENTS.INIT, () => {
      this.init();
    });

    eventBus.on(Block.EVENTS.FLOW_CDM, () => {
      this._componentDidMount();
    });

    eventBus.on(Block.EVENTS.FLOW_CDU, (...args: unknown[]) => {
      const oldProps = args[0] as Props;
      const newProps = args[1] as Props;
      this._componentDidUpdate(oldProps, newProps);
    });

    eventBus.on(Block.EVENTS.FLOW_RENDER, () => {
      this._render();
    });
  }

  private _createResources(): void {
    const { tagName } = this._meta;
    this._element = this._createDocumentElement(tagName);
  }

  init(): void {
    this._createResources();
    this.eventBus().emit(Block.EVENTS.FLOW_RENDER);
  }

  private _componentDidMount(): void {
    this.componentDidMount();
  }

  componentDidMount(): void {}

  dispatchComponentDidMount(): void {
    this.eventBus().emit(Block.EVENTS.FLOW_CDM);
  }

  private _componentDidUpdate(oldProps: Props, newProps: Props): void {
    const response = this.componentDidUpdate(oldProps, newProps);
    if (response) {
      this.eventBus().emit(Block.EVENTS.FLOW_RENDER);
    }
  }

  componentDidUpdate(oldProps: Props, newProps: Props): boolean {
    return JSON.stringify(oldProps) !== JSON.stringify(newProps);
  }

  setProps = (nextProps: Props): void => {
    if (!nextProps) {
      return;
    }
    Object.assign(this.props, nextProps);
  };

  get element(): HTMLElement | null {
    return this._element;
  }

  private _render(): void {
    const block = this.render();
    if (this._element && typeof block === 'string') {
      this._unbindEvents();
      this._element.innerHTML = block;
      this._bindEvents();
    }
  }

  render(): string {
    return '';
  }

  getContent(): HTMLElement | null {
    return this.element;
  }

  private _makePropsProxy(props: Props): Props {
    const self = this;

    return new Proxy(props, {
      get(target: Props, prop: string) {
        const value = target[prop];
        return typeof value === 'function' ? value.bind(target) : value;
      },
      set(target: Props, prop: string, value: unknown) {
        const oldTarget = { ...target };
        target[prop] = value;
        self.eventBus().emit(Block.EVENTS.FLOW_CDU, oldTarget, target);
        return true;
      },
      deleteProperty() {
        throw new Error('Нет доступа');
      },
    });
  }

  private _createDocumentElement(tagName: string): HTMLElement {
    return document.createElement(tagName);
  }

  private _bindEvents(): void {
    const events = this.props.events as Record<string, (e: Event) => void> | undefined;
    
    if (events && this._element) {
      Object.entries(events).forEach(([eventName, listener]) => {
        if (listener && typeof listener === 'function') {
          this._events[eventName] = listener as EventListener;
          this._element!.addEventListener(eventName, listener as EventListener);
        }
      });
    }
  }

  private _unbindEvents(): void {
    if (this._element) {
      Object.entries(this._events).forEach(([eventName, listener]) => {
        this._element!.removeEventListener(eventName, listener);
      });
      this._events = {};
    }
  }

  show(): void {
    if (this._element) {
      this._element.style.display = 'block';
    }
  }

  hide(): void {
    if (this._element) {
      this._element.style.display = 'none';
    }
  }
}

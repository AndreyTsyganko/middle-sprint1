import { expect } from 'chai';
import sinon from 'sinon';
import { JSDOM } from 'jsdom';
import { Router } from './router.js';
import Block from '../Core/Block.js';

describe('Router', () => {
  let router: Router;
  let dom: JSDOM;
  
  class MockBlock extends Block {
    constructor() {
      super('div', {});
    }
    render() {
      return '<div>Mock Component</div>';
    }
  }

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><div id="app"></div>', {
      url: 'http://localhost:3000/',
    });

    (global as any).window = dom.window;
    (global as any).document = dom.window.document;
    (global as any).history = dom.window.history;
    (global as any).location = dom.window.location;
    
    (global as any).localStorage = {
      getItem: sinon.stub().returns(null),
      setItem: sinon.stub(),
      removeItem: sinon.stub(),
      clear: sinon.stub(),
    };

    (global as any).alert = sinon.stub();

    (Router as any).__instance = undefined;
    
    router = new Router('#app');
  });

  afterEach(() => {
    sinon.restore();
    dom.window.close();
  });

  describe('Синглтон паттерн', () => {
    it('должен возвращать один и тот же экземпляр при множественных вызовах конструктора', () => {
      const router1 = new Router('#app');
      const router2 = new Router('#app');
      
      expect(router1).to.equal(router2);
    });

    it('getInstance должен создавать экземпляр если его нет', () => {
      (Router as any).__instance = undefined;
      const instance = Router.getInstance();
      expect(instance).to.be.instanceOf(Router);
    });

    it('getInstance должен возвращать существующий экземпляр', () => {
      const instance1 = Router.getInstance();
      const instance2 = Router.getInstance();
      expect(instance1).to.equal(instance2);
    });
  });

  describe('Регистрация маршрутов', () => {
    it('use должен добавлять маршрут и возвращать инстанс роутера', () => {
      const result = router.use('/test', MockBlock);
      
      expect(result).to.equal(router);
      expect((router as any).routes.length).to.equal(1);
      expect((router as any).routes[0].pathname).to.equal('/test');
    });

    it('должен поддерживать множественную регистрацию маршрутов', () => {
      router
        .use('/', MockBlock)
        .use('/test', MockBlock)
        .use('/settings', MockBlock);
      
      expect((router as any).routes.length).to.equal(3);
    });
  });

  describe('Навигация', () => {
    beforeEach(() => {
      router.use('/', MockBlock).use('/test', MockBlock);
    });

    it('go должен менять pathname в истории', () => {
      router.go('/test');
      expect(dom.window.location.pathname).to.equal('/test');
    });

    it('back должен вызывать history.back', () => {
      const backSpy = sinon.spy(dom.window.history, 'back');
      router.back();
      expect(backSpy.calledOnce).to.be.true;
    });

    it('forward должен вызывать history.forward', () => {
      const forwardSpy = sinon.spy(dom.window.history, 'forward');
      router.forward();
      expect(forwardSpy.calledOnce).to.be.true;
    });

    it('должен обрабатывать переходы по ссылкам', () => {
      const handler = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const link = target.closest('a');
        if (link && link.getAttribute('href')) {
          e.preventDefault();
          const href = link.getAttribute('href');
          if (href) {
            router.go(href);
          }
        }
      };
      
      dom.window.addEventListener('click', handler);
      
      const link = dom.window.document.createElement('a');
      link.href = '/test';
      link.textContent = 'Test Link';
      dom.window.document.body.appendChild(link);
      
      const event = new dom.window.MouseEvent('click', { 
        bubbles: true,
        cancelable: true 
      });
      
      link.dispatchEvent(event);
      
      expect(dom.window.location.pathname).to.equal('/test');
      
      dom.window.removeEventListener('click', handler);
    });
  });

  describe('Защита маршрутов', () => {
    let getItemStub: sinon.SinonStub;

    beforeEach(() => {
      getItemStub = (global as any).localStorage.getItem as sinon.SinonStub;
      
      router
        .use('/', MockBlock)
        .use('/sign-up', MockBlock)
        .use('/messenger', MockBlock)
        .use('/settings', MockBlock);
    });

    it('должен перенаправлять неавторизованного пользователя с /messenger на /', () => {
      getItemStub.returns(null);
      
      router.go('/messenger');
      
      expect(dom.window.location.pathname).to.equal('/');
    });

    it('должен перенаправлять неавторизованного пользователя с /settings на /', () => {
      getItemStub.returns(null);
      
      router.go('/settings');
      
      expect(dom.window.location.pathname).to.equal('/');
    });

    it('должен перенаправлять авторизованного пользователя с / на /messenger', () => {
      getItemStub.returns('fake-token');
      
      router.go('/');
      
      expect(dom.window.location.pathname).to.equal('/messenger');
    });

    it('должен перенаправлять авторизованного пользователя с /sign-up на /messenger', () => {
      getItemStub.returns('fake-token');
      
      router.go('/sign-up');
      
      expect(dom.window.location.pathname).to.equal('/messenger');
    });

    it('должен разрешать доступ авторизованному пользователю к /messenger', () => {
      getItemStub.returns('fake-token');
      
      router.go('/messenger');
      
      expect(dom.window.location.pathname).to.equal('/messenger');
    });

    it('должен разрешать доступ неавторизованному пользователю к /', () => {
      getItemStub.returns(null);
      
      router.go('/');
      
      expect(dom.window.location.pathname).to.equal('/');
    });
  });

  describe('Обработка несуществующих маршрутов', () => {
    let getItemStub: sinon.SinonStub;

    beforeEach(() => {
      getItemStub = (global as any).localStorage.getItem as sinon.SinonStub;
      
      router
        .use('/', MockBlock)
        .use('/messenger', MockBlock);
    });

    it('для авторизованного пользователя должен перенаправлять на /messenger', () => {
      getItemStub.returns('fake-token');
      
      router.go('/non-existent');
      
      expect(dom.window.location.pathname).to.equal('/messenger');
    });

    it('для неавторизованного пользователя должен перенаправлять на /', () => {
      getItemStub.returns(null);
      
      router.go('/non-existent');
      
      expect(dom.window.location.pathname).to.equal('/');
    });
  });

  describe('Приватные методы', () => {
    beforeEach(() => {
      router.use('/', MockBlock).use('/test', MockBlock);
    });

    it('_onRoute должен корректно обрабатывать смену маршрута', () => {
      const routeSpy = sinon.spy(router as any, '_onRoute');
      
      router.go('/test');
      
      expect(routeSpy.calledWith('/test')).to.be.true;
    });

    it('getRoute должен находить существующий маршрут', () => {
      const route = (router as any).getRoute('/test');
      
      expect(route).to.not.be.undefined;
      expect(route.pathname).to.equal('/test');
    });

    it('getRoute должен возвращать undefined для несуществующего маршрута', () => {
      const route = (router as any).getRoute('/non-existent');
      
      expect(route).to.be.undefined;
    });
  });
});

import { expect } from 'chai';
import { JSDOM } from 'jsdom';
import Block from './Block.js';

describe('Block', () => {
  let dom: JSDOM;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><body></body>');
    (global as any).window = dom.window;
    (global as any).document = dom.window.document;
  });

  class TestBlock extends Block {
    constructor(props: any = {}) {
      super('div', props);
    }

    render(): string {
      return '<div class="test">Test Content</div>';
    }
  }

  describe('Инициализация', () => {
    it('должен создавать экземпляр с переданными пропсами', () => {
      const props = { title: 'Test', value: 123 };
      const block = new TestBlock(props);
      
      expect(block.props).to.include(props);
    });

    it('должен создавать DOM элемент с правильным тегом', () => {
      const block = new TestBlock();
      
      expect(block.element?.tagName.toLowerCase()).to.equal('div');
    });

    it('должен рендерить содержимое при инициализации', () => {
      const block = new TestBlock();
      
      expect(block.element?.innerHTML).to.equal('<div class="test">Test Content</div>');
    });
  });

  describe('Управление пропсами', () => {
    it('setProps должен обновлять пропсы', () => {
      const block = new TestBlock({ initial: 'value' });
      
      block.setProps({ newProp: 'new value' });
      
      expect(block.props.initial).to.equal('value');
      expect(block.props.newProp).to.equal('new value');
    });

    it('изменение пропсов через прокси должно вызывать перерендер', (done) => {
      let renderCount = 0;
      
      class TrackingBlock extends TestBlock {
        render(): string {
          renderCount++;
          return super.render();
        }
      }
      
      const block = new TrackingBlock({ text: 'initial' });
      
      setTimeout(() => {
        block.props.text = 'updated';
        
        setTimeout(() => {
          expect(renderCount).to.equal(2);
          done();
        }, 0);
      }, 0);
    });

    it('не должен позволять удалять пропсы', () => {
      const block = new TestBlock({ deletable: 'value' });
      
      expect(() => {
        delete (block.props as any).deletable;
      }).to.throw('Нет доступа');
    });

    it('должен корректно обрабатывать функции в пропсах', () => {
      const testFunction = () => 'test result';
      const block = new TestBlock({ fn: testFunction });
      
      const result = (block.props.fn as Function)();
      expect(result).to.equal('test result');
    });
  });

  describe('Жизненный цикл', () => {
    it('componentDidMount должен вызываться после монтирования', (done) => {
      let mounted = false;
      
      class LifecycleBlock extends TestBlock {
        componentDidMount(): void {
          mounted = true;
        }
      }
      
      const block = new LifecycleBlock();
      block.dispatchComponentDidMount();
      
      setTimeout(() => {
        expect(mounted).to.be.true;
        done();
      }, 0);
    });

    it('componentDidUpdate должен вызываться при изменении пропсов', (done) => {
      let updated = false;
      
      class LifecycleBlock extends TestBlock {
        componentDidUpdate(oldProps: any, newProps: any): boolean {
          updated = true;
          return super.componentDidUpdate(oldProps, newProps);
        }
      }
      
      const block = new LifecycleBlock({ test: 'old' });
      
      setTimeout(() => {
        block.setProps({ test: 'new' });
        
        setTimeout(() => {
          expect(updated).to.be.true;
          done();
        }, 0);
      }, 0);
    });

    it('componentDidUpdate должен возвращать true при разных пропсах', () => {
      const block = new TestBlock({ value: 1 });
      const result = block.componentDidUpdate({ value: 1 }, { value: 2 });
      
      expect(result).to.be.true;
    });

    it('componentDidUpdate должен возвращать false при одинаковых пропсах', () => {
      const block = new TestBlock({ value: 1 });
      const result = block.componentDidUpdate({ value: 1 }, { value: 1 });
      
      expect(result).to.be.false;
    });
  });

  describe('Работа с событиями', () => {
    it('должен биндить события из пропсов', (done) => {
      let clicked = false;
      
      const block = new TestBlock({
        events: {
          click: () => {
            clicked = true;
          },
        },
      });
      
      setTimeout(() => {
        block.element?.dispatchEvent(new dom.window.Event('click'));
        
        expect(clicked).to.be.true;
        done();
      }, 0);
    });

    it('должен отписываться от событий при перерендере', (done) => {
      let clickCount = 0;
      
      const clickHandler = () => {
        clickCount++;
      };
      
      const block = new TestBlock({
        events: {
          click: clickHandler,
        },
      });
      
      setTimeout(() => {
        block.setProps({ newProp: 'value' });
        
        setTimeout(() => {
          block.element?.dispatchEvent(new dom.window.Event('click'));
          
          expect(clickCount).to.equal(1);
          done();
        }, 0);
      }, 0);
    });
  });

  describe('Управление видимостью', () => {
    it('show должен устанавливать display: block', () => {
      const block = new TestBlock();
      block.show();
      
      expect(block.element?.style.display).to.equal('block');
    });

    it('hide должен устанавливать display: none', () => {
      const block = new TestBlock();
      block.hide();
      
      expect(block.element?.style.display).to.equal('none');
    });
  });

  describe('Рендеринг', () => {
    it('getContent должен возвращать элемент', () => {
      const block = new TestBlock();
      
      expect(block.getContent()).to.equal(block.element);
    });

    it('должен обновлять содержимое при рендере', () => {
      class DynamicBlock extends TestBlock {
        render(): string {
          return `<div>${this.props.text || 'default'}</div>`;
        }
      }
      
      const block = new DynamicBlock({ text: 'hello' });
      
      expect(block.element?.innerHTML).to.equal('<div>hello</div>');
      
      block.setProps({ text: 'world' });
      
      expect(block.element?.innerHTML).to.equal('<div>world</div>');
    });
  });
});

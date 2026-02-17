import { expect } from 'chai';
import sinon from 'sinon';
import HTTPTransport, { queryStringify } from './HTTPTransport.js';

describe('HTTPTransport', () => {
  let http: HTTPTransport;
  let requests: any[] = [];
  let originalXHR: any;

  before(() => {
    originalXHR = global.XMLHttpRequest;
  });

  after(() => {
    global.XMLHttpRequest = originalXHR;
  });

  beforeEach(() => {
    http = new HTTPTransport('https://api.example.com');
    requests = [];
    
    class FakeXMLHttpRequest {
      public method: string = '';
      public url: string = '';
      public requestHeaders: Record<string, string> = {};
      public requestBody: any = null;
      public withCredentials: boolean = false;
      public timeout: number = 0;
      public status: number = 0;
      public responseText: string = '';
      public onload: (() => void) | null = null;
      public onerror: ((e: any) => void) | null = null;
      public ontimeout: (() => void) | null = null;
      public readyState: number = 4;
      
      open(method: string, url: string) {
        this.method = method;
        this.url = url;
      }
      
      setRequestHeader(key: string, value: string) {
        this.requestHeaders[key] = value;
      }
      
      send(data: any) {
        this.requestBody = data;
        requests.push(this);
      }
      
      getAllResponseHeaders() {
        return 'Content-Type: application/json\r\n';
      }
      
      abort() {}
    }
    
    global.XMLHttpRequest = FakeXMLHttpRequest as any;
    
    global.FormData = class FormData {
      private data: Record<string, string> = {};
      append(key: string, value: string) {
        this.data[key] = value;
      }
    } as any;
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Базовые методы', () => {
    it('get должен отправлять GET запрос', () => {
      http.get('/test');
      
      expect(requests.length).to.equal(1);
      expect(requests[0].method).to.equal('GET');
      expect(requests[0].url).to.equal('https://api.example.com/test');
    });

    it('post должен отправлять POST запрос', () => {
      http.post('/test', { data: { key: 'value' } });
      
      expect(requests.length).to.equal(1);
      expect(requests[0].method).to.equal('POST');
      expect(requests[0].url).to.equal('https://api.example.com/test');
    });

    it('put должен отправлять PUT запрос', () => {
      http.put('/test', { data: { key: 'value' } });
      
      expect(requests.length).to.equal(1);
      expect(requests[0].method).to.equal('PUT');
    });

    it('delete должен отправлять DELETE запрос', () => {
      http.delete('/test');
      
      expect(requests.length).to.equal(1);
      expect(requests[0].method).to.equal('DELETE');
    });
  });

  describe('Формирование URL', () => {
    it('должен формировать полный URL с базовым адресом', () => {
      http.get('/users/123');
      
      expect(requests[0].url).to.equal('https://api.example.com/users/123');
    });

    it('должен добавлять query параметры к GET запросам', () => {
      http.get('/search', {
        data: {
          q: 'test',
          page: 1,
          limit: 10,
        },
      });
      
      expect(requests[0].url).to.include('/search?');
      expect(requests[0].url).to.include('q=test');
      expect(requests[0].url).to.include('page=1');
      expect(requests[0].url).to.include('limit=10');
    });

    it('должен корректно кодировать специальные символы в query параметрах', () => {
      http.get('/search', {
        data: {
          q: 'test & query',
          special: '?=',
        },
      });
      
      expect(requests[0].url).to.include('q=test%20%26%20query');
      expect(requests[0].url).to.include('special=%3F%3D');
    });

    it('не должен добавлять query параметры к POST запросам', () => {
      http.post('/users', {
        data: { name: 'John' },
      });
      
      expect(requests[0].url).to.equal('https://api.example.com/users');
    });
  });

  describe('Заголовки и авторизация', () => {
    it('должен устанавливать переданные заголовки', () => {
      http.get('/test', {
        headers: {
          'X-Custom-Header': 'custom value',
          'Authorization': 'Bearer token123',
        },
      });
      
      expect(requests[0].requestHeaders['X-Custom-Header']).to.equal('custom value');
      expect(requests[0].requestHeaders['Authorization']).to.equal('Bearer token123');
    });

    it('по умолчанию должен отправлять withCredentials = true', () => {
      http.get('/test');
      
      expect(requests[0].withCredentials).to.be.true;
    });

    it('может отключать withCredentials', () => {
      http.get('/test', { withCredentials: false });
      
      expect(requests[0].withCredentials).to.be.false;
    });
  });

  describe('Отправка данных', () => {
    it('должен отправлять JSON данные', () => {
      const data = { name: 'John', age: 30 };
      
      http.post('/users', { data });
      
      expect(requests[0].requestBody).to.equal(JSON.stringify(data));
    });

    it('должен отправлять FormData', () => {
      const formData = new FormData();
      formData.append('file', 'test content');
      
      const postSpy = sinon.spy(http, 'post');
      http.post('/upload', { data: formData });
      
      expect(postSpy.calledWith('/upload', { data: formData })).to.be.true;
      expect(requests[0].requestBody).to.equal(formData);
    });

    it('должен отправлять строковые данные', () => {
      const data = 'plain text';
      
      http.post('/text', { data });
      
      expect(requests[0].requestBody).to.equal(data);
    });

    it('не должен отправлять тело для GET запросов', () => {
      http.get('/test', { data: { should: 'be ignored' } });
      
      expect(requests[0].requestBody).to.be.undefined;
    });
  });

  describe('Обработка ответов', () => {
    it('должен резолвить промис при успешном запросе', (done) => {
      const responseData = { id: 1, name: 'John' };
      
      http.get('/users/1')
        .then((response: XMLHttpRequest) => {
          expect(response.status).to.equal(200);
          expect(JSON.parse(response.responseText)).to.deep.equal(responseData);
          done();
        })
        .catch((error: Error) => done(error));
      
      setTimeout(() => {
        const request = requests[0];
        request.status = 200;
        request.responseText = JSON.stringify(responseData);
        if (request.onload) {
          request.onload();
        }
      }, 10);
    });

it('должен резолвить промис с ошибкой при статусе 401', (done) => {
  http.get('/protected')
    .then(() => {
      done(new Error('Должен был выбросить ошибку'));
    })
    .catch((error: any) => {
      try {
        expect(error).to.have.property('status', 401);
        done();
      } catch (e) {
        done(e);
      }
    });
  
  setTimeout(() => {
    const request = requests[0];
    request.status = 401;
    request.responseText = JSON.stringify({ error: 'Unauthorized' });
    if (request.onload) {
      request.onload();
    }
  }, 10);
});

    it('должен отклонять промис при сетевой ошибке', (done) => {
      http.get('/test')
        .then(() => {
          done(new Error('Должен был выбросить ошибку'));
        })
        .catch((error: Error) => {
          try {
            expect(error.message).to.equal('Network error');
            done();
          } catch (e) {
            done(e);
          }
        });
      
      setTimeout(() => {
        const request = requests[0];
        if (request.onerror) {
          request.onerror({ type: 'error' });
        }
      }, 10);
    });

    it('должен отклонять промис при таймауте', (done) => {
      http.get('/slow', { timeout: 100 })
        .then(() => {
          done(new Error('Должен был выбросить ошибку'));
        })
        .catch((error: Error) => {
          try {
            expect(error.message).to.equal('Request timeout');
            done();
          } catch (e) {
            done(e);
          }
        });
      
      setTimeout(() => {
        const request = requests[0];
        if (request.ontimeout) {
          request.ontimeout();
        }
      }, 10);
    });
  });

  describe('Таймауты', () => {
    it('должен использовать таймаут из опций', () => {
      http.get('/test', { timeout: 3000 });
      
      expect(requests[0].timeout).to.equal(3000);
    });

    it('должен использовать таймаут по умолчанию 5000', () => {
      http.get('/test');
      
      expect(requests[0].timeout).to.equal(5000);
    });

    it('может отключать таймаут', () => {
      http.get('/test', { timeout: 0 });
      
      expect(requests[0].timeout).to.equal(0);
    });
  });

describe('queryStringify функция', () => {
  it('должна возвращать пустую строку для null/undefined', () => {
    expect(queryStringify(null as any)).to.equal('');
    expect(queryStringify(undefined as any)).to.equal('');
  });

  it('должна возвращать пустую строку для не-объектов', () => {
    expect(queryStringify('string' as any)).to.equal('');
    expect(queryStringify(123 as any)).to.equal('');
    expect(queryStringify(true as any)).to.equal('');
  });

  it('должна корректно преобразовывать объект в query строку', () => {
    const result = queryStringify({
      a: 1,
      b: 2,
      c: 'test',
    });
    
    expect(result).to.include('a=1');
    expect(result).to.include('b=2');
    expect(result).to.include('c=test');
    expect(result.split('&')).to.have.length(3);
    expect(result.startsWith('?')).to.be.true;
  });

  it('должна добавлять ? в начало строки', () => {
    const result = queryStringify({ a: 1 });
    expect(result).to.equal('?a=1');
  });

  it('должна обрабатывать вложенные объекты', () => {
    const result = queryStringify({
      user: { name: 'John', age: 30 }
    });
    
    const expectedValue = encodeURIComponent(JSON.stringify({ name: 'John', age: 30 }));
    expect(result).to.equal(`?user=${expectedValue}`);
  });

  it('должна обрабатывать массивы', () => {
    const result = queryStringify({
      ids: [1, 2, 3]
    });
    
    const expectedValue = encodeURIComponent(JSON.stringify([1, 2, 3]));
    expect(result).to.equal(`?ids=${expectedValue}`);
  
    });
  });
});

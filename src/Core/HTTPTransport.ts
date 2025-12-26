const METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
};

function queryStringify(data: Record<string, any>): string {
  if (!data || typeof data !== 'object') {
    return '';
  }

  const params = Object.keys(data).map((key) => `${key}=${data[key]}`).join('&');

  return params ? `?${params}` : '';
}

export default class HTTPTransport {
  get = (url: string, options: Record<string, any> = {}) => this.request(url, { ...options, method: METHODS.GET }, options.timeout);

  post = (url: string, options: Record<string, any> = {}) => this.request(url, { ...options, method: METHODS.POST }, options.timeout);

  put = (url: string, options: Record<string, any> = {}) => this.request(url, { ...options, method: METHODS.PUT }, options.timeout);

  delete = (url: string, options: Record<string, any> = {}) => this.request(url, { ...options, method: METHODS.DELETE }, options.timeout);

  request = (url: string, options: Record<string, any> = {}, timeout = 5000) => {
    const { method = METHODS.GET, data, headers = {} } = options;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      let requestUrl = url;
      if (method === METHODS.GET && data) {
        const query = queryStringify(data);
        if (query) {
          requestUrl += query;
        }
      }

      xhr.open(method, requestUrl);

      if (timeout) {
        xhr.timeout = timeout;
        xhr.ontimeout = () => reject(new Error(`Request timeout after ${timeout}ms`));
      }

      Object.keys(headers).forEach((key) => {
        if (typeof key === 'string' && typeof headers[key] === 'string') {
          xhr.setRequestHeader(key, headers[key]);
        }
      });

      xhr.onload = () => resolve(xhr);
      xhr.onerror = () => reject(new Error('Network error'));

      if (method === METHODS.GET || !data) {
        xhr.send();
      } else if (!headers['Content-Type'] && !headers['content-type']) {
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify(data));
      } else {
        xhr.send(data);
      }
    });
  };
}

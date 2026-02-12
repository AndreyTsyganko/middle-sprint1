const METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
};

function queryStringify(data: Record<string, unknown>): string {
  if (!data || typeof data !== 'object') {
    return '';
  }

  const params = Object.keys(data)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(String(data[key]))}`)
    .join('&');

  return params ? `?${params}` : '';
}
interface RequestOptions {
  data?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
  method?: string;
}
export default class HTTPTransport {
  get = (url: string, options: RequestOptions = {}): Promise<XMLHttpRequest> => 
    this.request(url, { ...options, method: METHODS.GET }, options.timeout);

  post = (url: string, options: RequestOptions = {}): Promise<XMLHttpRequest> => 
    this.request(url, { ...options, method: METHODS.POST }, options.timeout);

  put = (url: string, options: RequestOptions = {}): Promise<XMLHttpRequest> => 
    this.request(url, { ...options, method: METHODS.PUT }, options.timeout);

  delete = (url: string, options: RequestOptions = {}): Promise<XMLHttpRequest> => 
    this.request(url, { ...options, method: METHODS.DELETE }, options.timeout);

  request = (
    url: string, 
    options: RequestOptions = {}, 
    timeout = 5000
  ): Promise<XMLHttpRequest> => {
    const { method = METHODS.GET, data, headers = {} } = options;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      let requestUrl = url;
      if (method === METHODS.GET && data && typeof data === 'object') {
        const query = queryStringify(data as Record<string, unknown>);
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
        xhr.send(data as XMLHttpRequestBodyInit);
      }
    });
  };
}

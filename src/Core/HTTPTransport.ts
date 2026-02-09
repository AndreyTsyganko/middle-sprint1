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

type Options = {
  method?: string;
  data?: any;
  headers?: Record<string, string>;
  timeout?: number;
};

export default class HTTPTransport {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  private getFullUrl(url: string): string {
    return `${this.baseUrl}${url}`;
  }

  get = (url: string, options: Options = {}): Promise<XMLHttpRequest> => 
    this.request(url, { ...options, method: METHODS.GET }, options.timeout);

  post = (url: string, options: Options = {}): Promise<XMLHttpRequest> => 
    this.request(url, { ...options, method: METHODS.POST }, options.timeout);

  put = (url: string, options: Options = {}): Promise<XMLHttpRequest> => 
    this.request(url, { ...options, method: METHODS.PUT }, options.timeout);

  delete = (url: string, options: Options = {}): Promise<XMLHttpRequest> => 
    this.request(url, { ...options, method: METHODS.DELETE }, options.timeout);

  request = (url: string, options: Options = {}, timeout = 5000): Promise<XMLHttpRequest> => {
    const { method = METHODS.GET, data, headers = {} } = options;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const fullUrl = this.getFullUrl(url);

      let requestUrl = fullUrl;
      if (method === METHODS.GET && data) {
        const query = queryStringify(data);
        if (query) {
          requestUrl += query;
        }
      }

      xhr.open(method, requestUrl);

      xhr.withCredentials = true; 
      
      if (timeout) {
        xhr.timeout = timeout;
        xhr.ontimeout = () => reject(new Error(`Request timeout after ${timeout}ms`));
      }

      Object.keys(headers).forEach((key) => {
        xhr.setRequestHeader(key, headers[key]);
      });

      xhr.onload = () => {
        console.log(`HTTP ${method} ${url}: ${xhr.status}`);
        resolve(xhr);
      };
      
      xhr.onerror = () => {
        console.error(`HTTP ${method} ${url}: Network error`);
        reject(new Error('Network error'));
      };

      if (method === METHODS.GET || !data) {
        xhr.send();
      } else if (data instanceof FormData) {
        xhr.send(data);
      } else {
        if (!headers['Content-Type'] && !headers['content-type']) {
          xhr.setRequestHeader('Content-Type', 'application/json');
        }
        
        let dataToSend = data;
        if (typeof data !== 'string' && !(data instanceof FormData)) {
          dataToSend = JSON.stringify(data);
        }
        console.log('Sending:', dataToSend);
        xhr.send(dataToSend);
      }
    });
  };
}

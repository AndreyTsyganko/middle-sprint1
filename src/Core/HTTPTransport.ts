const METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
};

export function queryStringify(data: Record<string, unknown>): string {
  if (!data || typeof data !== 'object') {
    return '';
  }

  const params = Object.keys(data)
    .map((key) => {
      const value = data[key];
      
      if (value && typeof value === 'object') {
        return `${key}=${encodeURIComponent(JSON.stringify(value))}`;
      }
      
      return `${key}=${encodeURIComponent(String(value))}`;
    })
    .join('&');

  return params ? `?${params}` : '';
}

type Options = {
  method?: string;
  data?: any;
  headers?: Record<string, string>;
  timeout?: number;
  withCredentials?: boolean;
};

class HTTPTransport {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
    console.log('HTTPTransport initialized with baseUrl:', baseUrl);
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
    const {
      method = METHODS.GET,
      data,
      headers = {},
      withCredentials = true,
    } = options;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const fullUrl = this.getFullUrl(url);

      let requestUrl = fullUrl;
      if (method === METHODS.GET && data) {
        const query = queryStringify(data as Record<string, unknown>);
        if (query) {
          requestUrl += query;
        }
      }

      xhr.open(method, requestUrl);
      xhr.withCredentials = withCredentials;

      console.log(`HTTPTransport: ${method} ${fullUrl}`, {
        withCredentials: xhr.withCredentials,
        hasData: !!data,
      });

      if (timeout) {
        xhr.timeout = timeout;
        xhr.ontimeout = () => {
          console.error(`HTTPTransport: Timeout for ${method} ${url}`);
          reject(new Error('Request timeout'));
        };
      }

      Object.keys(headers).forEach((key) => {
        xhr.setRequestHeader(key, headers[key]);
      });

      xhr.onload = () => {
        console.log(`HTTPTransport: ${method} ${url} - Status: ${xhr.status}`);

        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr);
        } else {
          console.error(`HTTPTransport: HTTP error ${xhr.status}`);
          
          if (xhr.status === 401) {
            console.error('HTTP 401 Unauthorized - Cookie issue');
            console.log('Response headers:', xhr.getAllResponseHeaders());
            reject({ 
              status: xhr.status, 
              response: xhr.responseText,
              headers: xhr.getAllResponseHeaders()
            });
          } else {
            reject({ 
              status: xhr.status, 
              response: xhr.responseText 
            });
          }
        }
      };

      xhr.onerror = () => {
        console.error(`HTTPTransport: Network error for ${method} ${url}`);
        reject(new Error('Network error'));
      };

      if (method === METHODS.GET || !data) {
        xhr.send();
      } else if (data instanceof FormData) {
        xhr.send(data);
      } else {
        const dataToSend = typeof data === 'string' ? data : JSON.stringify(data);
        console.log('HTTPTransport: Sending data:', dataToSend);
        xhr.send(dataToSend);
      }
    });
  };
}

export default HTTPTransport;

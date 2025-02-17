import * as http from 'node:http';
import * as http2 from 'node:http2';

import { HttpMini } from './application';

export const Request = {
  context: null,
  raw: null,
  params: null,
  searchParams: null,
  headersMap: Object.create(null),

  get method() {
    return this.raw.method!;
  },

  headers(header: string): string | string[] | undefined {
    return this.headersMap[header.toLowerCase()];
  },

  param(paramName: string): string | undefined {
    return this.params[paramName];
  },
};

export default (
  context: HttpMini,
  raw: http.IncomingMessage | http2.Http2ServerRequest,
  params: Record<string, string>,
  searchParams: Record<string, string>,
) => {
  const newRequest = Object.create(Request);
  newRequest.context = context;
  newRequest.raw = raw;
  newRequest.params = params;
  newRequest.searchParams = searchParams;

  for (const key in raw.headers) {
    if (Object.prototype.hasOwnProperty.call(raw.headers, key))
      newRequest.headersMap[key.toLowerCase()] = raw.headers[key];
  }

  return newRequest;
};

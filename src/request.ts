import * as http from 'node:http';
import * as http2 from 'node:http2';

import { HttpMini } from './application';

export const Request = {
  context: null,
  raw: null,
  params: {},
  searchParams: {},
  headersMap: {},

  get method() {
    return this.raw.method!;
  },

  flush() {
    this.context = null;
    this.raw = null;
    this.params = {};
    this.searchParams = {};
    this.headersMap = {};
  },

  headers(header: string): string | string[] | undefined {
    return this.raw.headers[header.toLowerCase()];
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
  return newRequest;
};

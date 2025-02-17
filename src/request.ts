import * as http from 'node:http';
import * as http2 from 'node:http2';

import { HttpMini } from './application';

interface IRequest {
    params?: Record<string, string>;
    searchParams?: Record<string, string>;
}

export class Request implements IRequest {
  constructor(
    private readonly context: HttpMini,
    public readonly raw: http.IncomingMessage | http2.Http2ServerRequest,
    public readonly params: Record<string, string>,
    public readonly searchParams: Record<string, string>,
  ) {}

  public static Pack(
    request: http.IncomingMessage | http2.Http2ServerRequest,
    params: Record<string, string>,
    searchParams: Record<string, string>,
    app: HttpMini,
  ): Request {
    return new Request(app, request, params, searchParams);
  }

  get method(): string {
    return this.raw.method;
  }

  public headers(header: string) : string | string[] | null | undefined {
    return this.raw.headers[header] || undefined;
  }

  public param(paramName: string) {
    return this.params[paramName] || undefined;
  }
}

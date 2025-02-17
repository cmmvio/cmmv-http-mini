import * as http from 'node:http';
import * as http2 from 'node:http2';
import Request from './request';
import Response from './response';
import { HttpMini } from './application';

export class Pooling {
  public static size: number;
  public static index: number;
  public static stack: Uint8Array;
  public static requestPool: any[];
  public static responsePool: any[];

  static init(poolSize: number = 100) {
    Pooling.size = poolSize;
    Pooling.index = poolSize;
    Pooling.stack = new Uint8Array(poolSize);
    Pooling.requestPool = new Array(poolSize);
    Pooling.responsePool = new Array(poolSize);

    for (let i = 0; i < poolSize; i++) {
      Pooling.stack[i] = i;
      Pooling.requestPool[i] = Request(null, null, {}, {});
      Pooling.responsePool[i] = Response(null, null, null);
    }
  }

  static create(): number {
    const idx = Pooling.size++;

    Pooling.requestPool[idx] = Request(null, null, {}, {});
    Pooling.responsePool[idx] = Response(null, null, null);

    return idx;
  }

  static acquire(
    context: HttpMini,
    rawReq: http.IncomingMessage | http2.Http2ServerRequest,
    rawRes: http.ServerResponse | http2.Http2ServerResponse,
    params: object,
    searchParams: object,
  ) {
    let idx =
      Pooling.index > 0 ? Pooling.stack[--Pooling.index] : Pooling.create();

    const request = Pooling.requestPool[idx];
    const response = Pooling.responsePool[idx];

    request.flush();
    response.flush();

    request.context = context;
    request.raw = rawReq;
    request.params = params;
    request.searchParams = searchParams;

    response.context = context;
    response.raw = rawRes;
    response.sent = false;
    response.req = request;

    return { request, response, index: idx };
  }

  static release(index: number) {
    if (index < 0 || index >= Pooling.size) return;
    Pooling.stack[Pooling.index++] = index;
  }
}

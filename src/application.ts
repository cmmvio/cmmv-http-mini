import { Logger, Config } from '@cmmv/core';
import { EventEmitter } from 'node:events';

import * as http from 'node:http';
import * as https from 'node:https';
import * as http2 from 'node:http2';
import FindMyWay from 'find-my-way';

import { Pooling } from './pooling';
import Request from './request';
import Response from './response';

const Router: typeof import('find-my-way') =
  process.env.NODE_ENV === 'test' ? FindMyWay : require('find-my-way');

export type ServerOptions = http.ServerOptions | http2.SecureServerOptions;

type ServerType =
  | http.Server
  | https.Server
  | http2.Http2Server
  | http2.Http2SecureServer;
type ServerRequest = http.IncomingMessage | http2.Http2ServerRequest;
type ServerResponse = http.ServerResponse | http2.Http2ServerResponse;
type RouteHandler = (req: Request, res: Response) => void;

export interface ApplicationOptions {
  debug?: boolean;
  etag?: boolean;
  lastModified?: boolean;
}

export class HttpMini extends EventEmitter {
  private readonly logger = new Logger('HTTP');
  private options?: ApplicationOptions;
  private server: ServerType;

  private readonly router = Router({
    caseSensitive: false,
    ignoreTrailingSlash: true,
    ignoreDuplicateSlashes: true,
    allowUnsafeRegex: true,
  });

  constructor(
    applicationOptions?: ApplicationOptions,
    serverOptions?: ServerOptions,
  ) {
    super();

    this.options = {
      debug: applicationOptions?.debug === true || false,
      etag: applicationOptions?.etag === true || false,
      lastModified: applicationOptions?.etag === true || true,
    };

    this.createServer(serverOptions);
    Pooling.init();
  }

  public option(name: string): any {
    return this.options[name];
  }

  public createServer(options?: ServerOptions) {
    if (options && 'allowHTTP1' in options) {
      this.server =
        options && 'key' in options
          ? http2.createSecureServer(options, this.handler.bind(this))
          : http2.createServer(options, this.handler.bind(this));
    } else {
      this.server =
        options && 'key' in options
          ? https.createServer(
              options as http.ServerOptions,
              this.handler.bind(this),
            )
          : http.createServer(
              options as http.ServerOptions,
              this.handler.bind(this),
            );
    }
  }

  public async handler(req: ServerRequest, res: ServerResponse) {
    const httpMethod = req.method?.toUpperCase() as FindMyWay.HTTPMethod;
    const route = this.router.find(httpMethod, req.url);
    const startRequest = Date.now();

    if (route && route.handler) {
      const { request, response, index } = Pooling.acquire(
        this,
        req,
        res,
        route.params,
        route.searchParams,
      );

      try {
        const content = await route.handler.call(this, request, response);

        if (!response.sent) response.send(content);

        const endRequest = Date.now();
        Pooling.release(index);

        this.printLog(
          'verbose',
          httpMethod,
          req.url,
          endRequest - startRequest,
          response.statusCode,
        );
      } catch (error) {
        const endRequest = Date.now();
        Pooling.release(index);

        this.printLog(
          'error',
          httpMethod,
          req.url,
          endRequest - startRequest,
          500,
        );

        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('Internal Server Error');
      }
    } else {
      const endRequest = Date.now();

      this.printLog(
        'verbose',
        httpMethod,
        req.url,
        endRequest - startRequest,
        404,
      );

      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('Not Found');
    }
  }

  public get(path: string, handler: RouteHandler): void {
    this.router.on('GET', path, (req, res) => handler.call(this, req, res));
  }

  public post(path: string, handler: RouteHandler): void {
    this.router.on('POST', path, (req, res) => handler.call(this, req, res));
  }

  public listen(address: { host: string; port: number }) {
    return new Promise((resolve, reject) => {
      this.server.once('error', reject);
      this.server.listen(address.port, address.host, () => {
        this.server.off('error', reject);
        resolve(address);
      });
    });
  }

  public close() {
    this.server.close();
  }

  public printLog(
    type: string,
    method: string,
    path: string,
    timer: number,
    status: number,
  ) {
    if (this.option('debug')) {
      const logContent = `${method.toUpperCase()} ${path} (${timer}ms) ${status}`;

      switch (type) {
        case 'error':
          this.logger.error(logContent);
          break;
        case 'warning':
          this.logger.warning(logContent);
          break;
        case 'verbose':
          this.logger.verbose(logContent);
          break;
        default:
          this.logger.log(logContent);
          break;
      }
    }
  }
}

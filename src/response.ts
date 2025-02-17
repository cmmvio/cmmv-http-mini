import * as http from 'node:http';
import * as http2 from 'node:http2';
import { createHash } from 'node:crypto';
import { Request } from './request';

import { HttpMini } from './application';

export class Response {
  public contentType: string = null;
  public headers: http.OutgoingHttpHeaders = {};
  public lastModified: string = new Date().toUTCString();
  public statusCode: number;
  public body: string;
  public sent: boolean = false;

  constructor(
    private readonly context: HttpMini,
    private readonly raw: http.ServerResponse | http2.Http2ServerResponse,
    private readonly req: Request,
  ) {}

  public static Pack(
    response: http.ServerResponse | http2.Http2ServerResponse,
    request: Request,
    app: HttpMini,
  ): Response {
    return new Response(app, response, request);
  }

  public status(statusCode: number): Response {
    this.statusCode = statusCode;
    return this;
  }

  public set(key: string, value: string) {}

  public setContentType(value: string): Response {
    this.contentType = value;
    return this;
  }

  public setLastModified(date: Date): Response {
    this.lastModified = date.toUTCString();
    return this;
  }

  public json(objectJson: object): void {
    this.setContentType('application/json').send(JSON.stringify(objectJson));
  }

  public send(content?: string, statusCode: number = 200): void {
    this.contentType = this.contentType ?? 'text/html';
    this.statusCode = statusCode
      ? statusCode
      : this.body.length > 0
        ? 200
        : 204;
    this.end(content);
  }

  public etag(content: string): string {
    return `"${this.fnv1a(content)}"`;
  }

  private fnv1a(str: string): string {
    let hash = 2166136261;

    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash +=
        (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }

    return (hash >>> 0).toString(16);
  }

  public end(content?: string): void {
    if (this.raw.headersSent === true || this.sent) return;

    this.contentType = this.contentType ?? 'text/plain';
    this.statusCode = this.statusCode > 0 ? this.statusCode : 200;

    const contentSent =
      content ??
      (typeof this.body == 'object' ? JSON.stringify(this.body) : this.body);
    const etag = this.etag(contentSent);

    if (this.req.headers('if-none-match') === etag) {
      this.raw.writeHead(304).end();
      this.sent = true;
      return;
    }

    const ifModifiedSince = this.req.headers('if-modified-since');
    if (ifModifiedSince && typeof ifModifiedSince === "string") {
        const sinceDate = new Date(ifModifiedSince);
        const lastModifiedDate = new Date(this.lastModified);

        if (sinceDate >= lastModifiedDate) {
            this.raw.writeHead(304).end();
            this.sent = true;
            return;
        }
    }

    const headers = {
      'content-type': this.contentType,
      ...this.headers,
    } as http.OutgoingHttpHeaders;

    if(this.context.option("etag"))
        headers["etag"] = etag;

    if(this.context.option("lastModified"))
        headers["last-modified"] = this.lastModified;

    this.raw.writeHead(this.statusCode, headers);

    if (this.req.method.toLowerCase() === 'head') {
      this.raw.end();
    } else {
      headers['content-length'] = contentSent.length;
      this.raw.end(contentSent);
    }

    this.sent = true;
  }
}

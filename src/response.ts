export const Response = {
  statusCode: 200,
  contentType: null,
  lastModified: new Date().toUTCString(),
  sent: false,
  context: null,
  raw: null,
  req: null,
  headers: {},

  status(code: number) {
    this.statusCode = code;
    return this;
  },

  set(key: string, value: string) {
    this.headers[key.toLowerCase()] = value;
  },

  setContentType(value: string) {
    this.contentType = value;
    return this;
  },

  setLastModified(date: Date) {
    this.lastModified = date.toUTCString();
    return this;
  },

  json(objectJson: object) {
    this.setContentType('application/json');
    this.send(JSON.stringify(objectJson));
  },

  fnv1a(str: string): string {
    let hash = new Uint32Array([2166136261]);

    for (let i = 0; i < str.length; i++) {
      hash[0] ^= str.charCodeAt(i);
      hash[0] +=
        (hash[0] << 1) +
        (hash[0] << 4) +
        (hash[0] << 7) +
        (hash[0] << 8) +
        (hash[0] << 24);
    }

    return hash[0].toString(16);
  },

  etag(content: string): string {
    return `"${this.fnv1a(content)}"`;
  },

  send(content?: string, status: number = 200) {
    if (this.sent || this.raw.headersSent) return;

    this.statusCode = status;
    this.contentType ||= 'text/html';
    this.end(content);
  },

  end(content?: string) {
    if (this.sent || this.raw.headersSent) return;

    const contentSent =
      content ??
      (typeof this.req.body === 'object'
        ? JSON.stringify(this.req.body)
        : this.req.body || '');

    const computedEtag = this.etag(contentSent);

    if (this.req.headers('if-none-match') === computedEtag) {
      this.raw.writeHead(304).end();
      this.sent = true;
      return;
    }

    const ifModifiedSince = this.req.headers('if-modified-since');
    if (ifModifiedSince && typeof ifModifiedSince === 'string') {
      const sinceDate = new Date(ifModifiedSince);
      if (sinceDate >= new Date(this.lastModified)) {
        this.raw.writeHead(304).end();
        this.sent = true;
        return;
      }
    }

    this.headers['content-type'] = this.contentType;

    if (this.context.option('etag')) this.headers['etag'] = computedEtag;

    if (this.context.option('lastModified'))
      this.headers['last-modified'] = this.lastModified;

    const contentBuffer = Buffer.from(contentSent);
    this.headers['content-length'] = contentBuffer.byteLength;

    this.raw.writeHead(this.statusCode, this.headers);

    if (this.req.method.toLowerCase() === 'head') {
      this.raw.end();
    } else {
      this.raw.end(contentBuffer);
    }

    this.sent = true;
  },
};

export default (context, raw, req) => {
  const newResponse = Object.create(Response);
  newResponse.context = context;
  newResponse.raw = raw;
  newResponse.req = req;
  return newResponse;
};

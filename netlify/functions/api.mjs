import { Readable } from "node:stream";
import { requestHandler } from "../../server/index.mjs";

function createNodeRequest(request) {
  const url = new URL(request.url);
  const headers = Object.fromEntries(request.headers.entries());
  const stream = new Readable({
    read() {},
  });

  request
    .arrayBuffer()
    .then((buffer) => {
      stream.push(Buffer.from(buffer));
      stream.push(null);
    })
    .catch((error) => stream.destroy(error));

  stream.method = request.method;
  stream.url = `${url.pathname}${url.search}`;
  stream.headers = headers;
  return stream;
}

function createNodeResponse(resolve) {
  const chunks = [];
  const response = {
    statusCode: 200,
    headers: {},
    writeHead(statusCode, headers = {}) {
      this.statusCode = statusCode;
      for (const [key, value] of Object.entries(headers)) {
        this.setHeader(key, value);
      }
    },
    setHeader(key, value) {
      const normalized = key.toLowerCase();
      if (normalized === "set-cookie") {
        const existing = this.headers["set-cookie"];
        this.headers["set-cookie"] = existing
          ? [...(Array.isArray(existing) ? existing : [existing]), value]
          : value;
        return;
      }
      this.headers[key] = value;
    },
    getHeader(key) {
      return this.headers[key] || this.headers[key.toLowerCase()];
    },
    write(chunk) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
    },
    end(chunk) {
      if (chunk) this.write(chunk);
      resolve(
        new Response(Buffer.concat(chunks), {
          status: this.statusCode,
          headers: this.headers,
        }),
      );
    },
  };
  return response;
}

export default async (request) => {
  return new Promise((resolve) => {
    const req = createNodeRequest(request);
    const res = createNodeResponse(resolve);
    requestHandler(req, res).catch((error) => {
      console.error(error);
      resolve(
        Response.json(
          { error: "Internal server error." },
          { status: 500, headers: { "Cache-Control": "no-store" } },
        ),
      );
    });
  });
};

export const config = {
  path: "/api/*",
};

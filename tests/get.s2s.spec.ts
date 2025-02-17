import { describe, it, expect } from "vitest";
import request from "supertest";
import { serverAddress } from "./serverMock";

describe("Get Tests", () => {
    let etag: string;
    let lastModified: string;

    it("should return Hello World", async () => {
        const response = await request(serverAddress).get("/");
        expect(response.status).toBe(200);
        expect(response.text).toBe("Hello World");
    });

    it("should return JSON response", async () => {
        const response = await request(serverAddress).get("/json");
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ Hello: "World" });
    });

    it("should return 404 for unknown route", async () => {
        const response = await request(serverAddress).get("/unknown");
        expect(response.status).toBe(404);
    });

    it("should return ETag and Last-Modified headers", async () => {
        const response = await request(serverAddress).get("/json");

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ Hello: "World" });

        etag = response.headers["etag"];
        lastModified = response.headers["last-modified"];

        expect(etag).toBeDefined();
        expect(lastModified).toBeDefined();
    });

    it("should return 304 Not Modified when ETag matches", async () => {
        const response = await request(serverAddress)
            .get("/json")
            .set("If-None-Match", etag);

        expect(response.status).toBe(304);
        expect(response.body).toEqual({});
    });

    it("should return 304 Not Modified when Last-Modified matches", async () => {
        const response = await request(serverAddress)
            .get("/json")
            .set("If-Modified-Since", lastModified);

        expect(response.status).toBe(304);
        expect(response.body).toEqual({});
    });

    it("should return 200 OK when ETag is different", async () => {
        const response = await request(serverAddress)
            .get("/json")
            .set("If-None-Match", "wrong-etag");

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ Hello: "World" });
    });

    it("should return 200 OK when Last-Modified is older", async () => {
        const oldDate = new Date(Date.now() - 100000).toUTCString();
        const response = await request(serverAddress)
            .get("/json")
            .set("If-Modified-Since", oldDate);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ Hello: "World" });
    });
});

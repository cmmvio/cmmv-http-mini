import { describe, it, expect } from "vitest";
import request from "supertest";
import { serverAddress } from "./serverMock";

describe("Parameter Tests", () => {
    it("should return a response with a dynamic route parameter", async () => {
        const response = await request(serverAddress).get("/user/123");

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ userId: "123" });
    });

    it("should return 404 for missing required parameter", async () => {
        const response = await request(serverAddress).get("/user/");

        expect(response.status).toBe(404);
    });

    it("should handle multiple route parameters", async () => {
        const response = await request(serverAddress).get("/user/123/post/456");

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ userId: "123", postId: "456" });
    });

    it("should return 404 when accessing an unknown dynamic route", async () => {
        const response = await request(serverAddress).get("/unknown/999");

        expect(response.status).toBe(404);
    });

    it("should return a response with a numeric parameter", async () => {
        const response = await request(serverAddress).get("/product/98765");

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ productId: "98765" });
    });

    it("should handle alphanumeric route parameters", async () => {
        const response = await request(serverAddress).get("/category/electronics");

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ category: "electronics" });
    });

    it("should return 404 for an empty dynamic route", async () => {
        const response = await request(serverAddress).get("/category/");

        expect(response.status).toBe(404);
    });

    it("should return a response with a UUID parameter", async () => {
        const uuid = "550e8400-e29b-41d4-a716-446655440000";
        const response = await request(serverAddress).get(`/session/${uuid}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ sessionId: uuid });
    });

    it("should return a response with a complex nested route", async () => {
        const response = await request(serverAddress).get("/store/45/section/12/product/789");

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ storeId: "45", sectionId: "12", productId: "789" });
    });

    it("should return a response with a complex nested route", async () => {
        const response = await request(serverAddress).get("/product/45/12/789");

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ storeId: "45", sectionId: "12", productId: "789" });
    });
})

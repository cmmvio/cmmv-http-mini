import { beforeAll, afterAll } from "vitest";
import httpmini from "../src/main";

export let app: any;
export let server: any;
export const host = "127.0.0.1";
export const port = 55995;
export const serverAddress = `http://${host}:${port}`

beforeAll(async () => {
    app = httpmini({
        debug: false,
        etag: true,
        lastModified: true
    });

    app.get("/", (req, res) => {
        return "Hello World";
    });

    app.get('/user/:id', (req, res) => {
        res.json({ userId: req.params["id"]});
    });

    app.get('/user/:userId/post/:postId', (req, res) => {
        res.json(req.params);
    });

    app.get('/product/:productId', (req, res) => {
        res.json(req.params);
    });

    app.get('/product/:storeId/:sectionId/:productId', (req, res) => {
        res.json(req.params);
    });

    app.get('/category/:category', (req, res) => {
        res.json(req.params);
    });

    app.get('/session/:sessionId', (req, res) => {
        res.json(req.params);
    });

    app.get('/store/:storeId/section/:sectionId/product/:productId', (req, res) => {
        res.json(req.params);
    });

    app.get("/json", (req, res) => {
        res.json({ Hello: "World" });
    });

    server = await app.listen({ host, port });
});

afterAll(async () => {
    await app.close();
})

import { Hono } from "hono";

export const createRouter = () => {
	const router = new Hono();

	router.get("/_health", (c) => {
		return c.json({ ok: true });
	});

	return router;
};

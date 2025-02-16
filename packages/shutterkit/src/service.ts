import { prometheus } from "@hono/prometheus";
import type { Integration } from "@sentry/core";
import { type Env, Hono } from "hono";
import { requestId } from "hono/request-id";
import type { BlankEnv } from "hono/types";
import { Registry } from "prom-client";
import { Gauge } from "prom-client";
import { version as kitVersion } from "../package.json";
import { logMiddleware, newLogger } from "./logging";
import { setupHonoSentry } from "./sentry";
import type { Server } from "bun";

export class Service<E extends Env = BlankEnv> {
  public app = new Hono<E>();
  public metricsPrefix = "shutter_";
  public prometheus!: ReturnType<typeof prometheus>;
  public registry = new Registry();
  public logger = newLogger("service");
  public sentryIntegrations: Integration[] = [];

  constructor() {
    this.setupSentry();
    this.setupPrometheus();
    this.setup();
  }

  private setupSentry() {
    if (process.env.SENTRY_DSN) {
      setupHonoSentry(this.app, this.sentryIntegrations);
    }
  }

  private setupPrometheus() {
    const versionGauge = new Gauge({
      name: "shutterkit_version",
      help: "The installed version of @shutter/shutterkit.",
      labelNames: ["version"],
      registers: [this.registry],
    });
    versionGauge.labels({ version: kitVersion }).set(1);

    this.prometheus = prometheus({
      registry: this.registry,
      collectDefaultMetrics: true,
      prefix: this.metricsPrefix,
    });
  }

  protected setup() {
    this.app.use("*", requestId());
    this.app.use("*", this.prometheus.registerMetrics);
    this.app.get("/metrics", this.prometheus.printMetrics);
    this.app.use("*", logMiddleware(this.logger));
  }

  public start(
    port = 3000,
    hostname = "0.0.0.0",
  ): StartReturn | Promise<StartReturn> {
    const server = Bun.serve({
      development: process.env.ENV === "development",
      port,
      hostname,
      fetch: this.app.fetch,
    });
    this.logger.info(
      {
        port: server.port,
        host: server.hostname,
      },
      "server started",
    );

    process.on("exit", async () => {
      await server.stop();
      process.exit(0);
    });

    return server;
  }
}

// biome-ignore lint/suspicious/noConfusingVoidType: This is intentional.
type StartReturn = Server | void;

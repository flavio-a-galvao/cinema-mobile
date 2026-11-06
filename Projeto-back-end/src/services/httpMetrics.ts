const limits = [50, 100, 250, 500, 1000, 2000, 5000];
const empty = () => ({
  completedRequests: 0, serverErrors: 0, clientErrors: 0, abortedRequests: 0,
  statusCodes: {} as Record<string, number>,
  latencyMs: { sum: 0, buckets: [...limits.map(le => ({ le: String(le), count: 0 })), { le: '+Inf', count: 0 }] },
});
type Stats = ReturnType<typeof empty>;
type Sample = { method: string; route: string; status: number; durationMs: number; aborted: boolean; business: boolean };

export class HttpMetrics {
  private readonly startedAt = new Date().toISOString();
  private readonly started = performance.now();
  private readonly http = empty();
  private readonly business = empty();
  private readonly routes = new Map<string, { method: string; route: string; business: boolean; stats: Stats }>();

  record(sample: Sample): void {
    const key = sample.method + ' ' + sample.route;
    let route = this.routes.get(key);
    // Defesa adicional: nunca criar séries sem limite por entrada do cliente.
    if (!route && this.routes.size < 256) {
      route = { method: sample.method, route: sample.route, business: sample.business, stats: empty() };
      this.routes.set(key, route);
    }
    const groups = [this.http, ...(sample.business ? [this.business] : []), ...(route ? [route.stats] : [])];
    for (const stats of groups) {
      if (sample.aborted) { stats.abortedRequests++; continue; }
      stats.completedRequests++;
      if (sample.status >= 500) stats.serverErrors++;
      else if (sample.status >= 400) stats.clientErrors++;
      stats.statusCodes[sample.status] = (stats.statusCodes[sample.status] ?? 0) + 1;
      const duration = Math.max(0, sample.durationMs);
      stats.latencyMs.sum += duration;
      for (const bucket of stats.latencyMs.buckets) {
        if (bucket.le === '+Inf' || duration <= Number(bucket.le)) bucket.count++;
      }
    }
  }

  snapshot() {
    // Cópia: quem consulta não altera contadores; não há IDs ou payloads armazenados.
    return structuredClone({
      startedAt: this.startedAt, uptimeSeconds: (performance.now() - this.started) / 1000,
      http: this.http, business: this.business, routes: [...this.routes.values()],
    });
  }
}

export const httpMetrics = new HttpMetrics();

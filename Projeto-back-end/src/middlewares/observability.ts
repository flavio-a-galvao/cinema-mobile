import type { ErrorRequestHandler, RequestHandler, Response, Request } from 'express';
import { correlationId, errorMetadata, log, requestContext } from '../services/logger';
import { HttpMetrics, httpMetrics } from '../services/httpMetrics';

const methods = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']);
function labels(req: Request, res: Response) {
  const route = res.locals.observationRoute
    ?? (typeof req.route?.path === 'string' ? req.route.path : '<unmatched>');
  return {
    method: methods.has(req.method) ? req.method : 'OTHER', route,
    business: !res.locals.observationRoute && !['/', '/metrics', '<unmatched>'].includes(route),
  };
}

export const observationScope = (route: '/api-docs/*' | '/posters/*'): RequestHandler => (_req, res, next) => {
  res.locals.observationRoute = route;
  next();
};

export function observeHttp(metrics: HttpMetrics = httpMetrics): RequestHandler {
  return (req, res, next) => {
    const requestId = correlationId(req.headers['x-request-id']);
    res.setHeader('X-Request-Id', requestId);
    const start = performance.now();
    let recorded = false;
    const record = (aborted: boolean) => {
      if (recorded) return;
      recorded = true;
      const metadata = labels(req, res);
      const durationMs = Math.max(0, performance.now() - start);
      metrics.record({ ...metadata, status: res.statusCode, durationMs, aborted });
      if (metadata.business || aborted || res.statusCode >= 500) {
        const critical = req.method === 'POST' && ['/ingressos', '/ingressos/lote', '/pagamentos'].includes(metadata.route)
          || req.method === 'PATCH' && metadata.route === '/ingressos/:id/cancelar';
        const action = aborted ? 'request_aborted' : critical ? 'critical_operation_completed' : 'request_completed';
        log(aborted || res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info', 'http', action, {
          requestId, method: metadata.method, route: metadata.route,
          ...(aborted ? {} : { status: res.statusCode }), durationMs, aborted,
        });
      }
    };
    res.once('finish', () => record(false));
    res.once('close', () => { if (!res.writableFinished) record(true); });
    requestContext.run({ requestId }, next);
  };
}

export const handleError: ErrorRequestHandler = (error, req, res, _next) => {
  log('error', 'http', 'request_error', { ...labels(req, res), ...errorMetadata(error) });
  if (res.headersSent) {
    // Não há resposta substituível; fechar como o handler final, sem imprimir erro bruto.
    res.destroy();
    return;
  }
  return res.status(500).json({ message: 'Erro interno do servidor.' });
};

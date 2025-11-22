import { context, diag, DiagConsoleLogger, DiagLogLevel, Span, SpanStatusCode, trace } from '@opentelemetry/api'

if (process.env.NODE_ENV !== 'production') {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR)
}

const tracerVersion = process.env.npm_package_version ?? '0.0.0'
const tracerName = 'tribalmingle-web'
const tracer = trace.getTracer(`${tracerName}-services`, tracerVersion)

type SpanAttributes = Record<string, string | number | boolean>

export async function withSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  attrs?: SpanAttributes,
): Promise<T> {
  const span = tracer.startSpan(name, attrs ? { attributes: attrs } : undefined)
  try {
    return await context.with(trace.setSpan(context.active(), span), () => fn(span))
  } catch (error) {
    recordSpanError(span, error)
    throw error
  } finally {
    span.end()
  }
}

export function recordSpanError(span: Span, error: unknown) {
  if (!error) {
    span.setStatus({ code: SpanStatusCode.UNSET })
    return
  }

  const message = error instanceof Error ? error.message : 'Unknown error'
  span.recordException(error as Error)
  span.setStatus({ code: SpanStatusCode.ERROR, message })
}

export function spanAttributes(attrs: SpanAttributes): SpanAttributes {
  return attrs
}

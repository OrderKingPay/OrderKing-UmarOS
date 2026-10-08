export class APMTelemetryEngine {
    constructor(private readonly serviceName: string) {}

    public startSpan(name: string): APMSpan {
        return new APMSpan(name, this);
    }

    public async recordException(error: Error, span: APMSpan): Promise<void> {
        console.error(`[APM ERROR] ${this.serviceName} | Span: ${span.name} | Error: ${error.message}\n${error.stack}`);
        await this.routeAlertPayload(error, span);
    }

    private async routeAlertPayload(error: Error, span: APMSpan): Promise<void> {
        // High-severity alert routing (e.g. to PagerDuty or OpsGenie)
        const payload = {
            routing_key: process.env.PAGERDUTY_ROUTING_KEY || 'default_key',
            event_action: 'trigger',
            payload: {
                summary: `[CRITICAL] Error in ${this.serviceName} - ${error.message}`,
                severity: 'critical',
                source: 'APMTelemetryEngine',
                custom_details: {
                    span_name: span.name,
                    stack_trace: error.stack,
                    timestamp: new Date().toISOString()
                }
            }
        };

        try {
            // Mocking the PagerDuty API call
            console.log(`[ALERT ROUTED] High-severity alert sent to on-call engineer for error: ${error.message}`);
            // In a real scenario, this would use fetch or an HTTP client to POST the payload
            // await fetch('https://events.pagerduty.com/v2/enqueue', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(payload)
            // });
        } catch (alertError) {
            console.error('[FATAL] Failed to route alert payload:', alertError);
        }
    }
}

export class APMSpan {
    private startTime: number;
    private endTime?: number;
    public name: string;
    private engine: APMTelemetryEngine;

    constructor(name: string, engine: APMTelemetryEngine) {
        this.name = name;
        this.engine = engine;
        this.startTime = Date.now();
    }

    public end(): void {
        this.endTime = Date.now();
        console.log(`[APM INFO] Span ${this.name} completed in ${this.endTime - this.startTime}ms`);
    }

    public async recordException(error: Error): Promise<void> {
        await this.engine.recordException(error, this);
    }
}

const { NodeSDK } = require("@opentelemetry/sdk-node");
const {
  getNodeAutoInstrumentations,
} = require("@opentelemetry/auto-instrumentations-node");
const { OTLPTraceExporter } = require("@opentelemetry/exporter-otlp-grpc");

const sdk = new NodeSDK({
  serviceName: "api-gateway",
  traceExporter: new OTLPTraceExporter({
    url:
      process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
      "http://otel-collector-opentelemetry-collector.observabilite.svc.cluster.local:4317",
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

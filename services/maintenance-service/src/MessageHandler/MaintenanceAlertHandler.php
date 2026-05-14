<?php

namespace App\MessageHandler;

use App\Message\MaintenanceAlert;
use App\Service\KafkaService;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
use Psr\Log\LoggerInterface;

#[AsMessageHandler]
class MaintenanceAlertHandler
{
    public function __construct(
        private KafkaService $kafkaService,
        private LoggerInterface $logger,
    ) {}

    public function __invoke(MaintenanceAlert $event): void
    {
        $payload = [
            'event' => 'MAINTENANCE_REQUIRED',
            'timestamp' => $event->timestamp,
            'payload' => [
                'vehicle_id' => $event->vehicleId,
                'priority' => $event->priority,
                'reason' => $event->alertType,
                'description' => $event->description,
            ],
        ];

        $this->kafkaService->publishEvent('maintenance.alert', $payload);

        $this->logger->info('Maintenance alert published to Kafka', [
            'vehicle_id' => $event->vehicleId,
            'alert_type' => $event->alertType,
            'priority' => $event->priority,
        ]);
    }
}

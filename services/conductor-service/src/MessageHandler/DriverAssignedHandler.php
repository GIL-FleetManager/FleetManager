<?php

namespace App\MessageHandler;

use App\Message\DriverAssigned;
use App\Service\KafkaService;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
use Psr\Log\LoggerInterface;

#[AsMessageHandler]
class DriverAssignedHandler
{
    public function __construct(
        private KafkaService $kafkaService,
        private LoggerInterface $logger,
    ) {}

    public function __invoke(DriverAssigned $event): void
    {
        $payload = [
            'event' => 'DRIVER_ASSIGNED',
            'timestamp' => $event->timestamp,
            'payload' => [
                'vehicle_id' => $event->vehicleId,
                'driver_id' => $event->driverId,
                'assigned_by' => $event->assignedBy,
            ],
        ];

        $this->kafkaService->publishEvent('driver.assigned', $payload);

        $this->logger->info('Driver assignment published to Kafka', [
            'vehicle_id' => $event->vehicleId,
            'driver_id' => $event->driverId,
        ]);
    }
}

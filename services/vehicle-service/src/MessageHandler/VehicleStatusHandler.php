<?php

namespace App\MessageHandler;

use App\Message\VehicleStatusChanged;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
class VehicleStatusHandler
{
    public function __invoke(VehicleStatusChanged $event)
    {
        $log = sprintf(
            " KAFKA RECEIVED: Vehicle %s moved from %s to %s at %s\n",
            $event->vehicleId,
            $event->oldStatus,
            $event->newStatus,
            $event->timestamp
        );
        
        file_put_contents('php://stdout', $log);
    }
}
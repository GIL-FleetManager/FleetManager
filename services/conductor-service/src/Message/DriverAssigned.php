<?php

namespace App\Message;

class DriverAssigned
{
    public function __construct(
        public string $vehicleId,
        public string $driverId,
        public ?string $assignedBy = null,
        public ?string $timestamp = null,
    ) {
        $this->timestamp ??= (new \DateTime())->format('c');
    }
}

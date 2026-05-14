<?php

namespace App\Message;

class MaintenanceAlert
{
    public function __construct(
        public string $vehicleId,
        public string $alertType,
        public string $priority,
        public string $description,
        public ?string $timestamp = null,
    ) {
        $this->timestamp ??= (new \DateTime())->format('c');
    }
}

<?php
namespace App\Message;

class VehicleStatusChanged
{
    public function __construct(
        public string $vehicleId,
        public string $oldStatus,
        public string $newStatus,
        public string $timestamp
    ) {}
}

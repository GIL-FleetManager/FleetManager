<?php

namespace App\Message;

class MissionRequested {
    public function __construct(
        public string $missionId,
        public string $vehicleId,
        public array $destination
    ) {}
}
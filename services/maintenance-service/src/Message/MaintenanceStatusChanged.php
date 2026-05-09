<?php

namespace App\Message;

class MaintenanceStatusChanged
{
    public function __construct(
        public readonly string $interventionId,
        public readonly string $vehiculeId,
        public readonly string $statut
    ) {
    }
}
<?php
namespace App\Command;

use App\Service\KafkaService;
use App\Repository\VehicleRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Command\Command;

class ConsumeDriverAssignedCommand extends Command
{
    protected static $defaultName = 'app:kafka-consume-driver';

    public function __construct(
        private KafkaService $kafka,
        private VehicleRepository $vehicleRepo,
        private EntityManagerInterface $em
    ) { parent::__construct(); }

    protected function execute($input, $output): int
    {
        $this->kafka->consume('driver.assigned', function($payload) {
            file_put_contents('php://stdout', "Payload reçu: " . json_encode($payload) . PHP_EOL);
            $vehicle = $this->vehicleRepo->find($payload['vehicle_id']);
            if ($vehicle) {
                $vehicle->setStatut('en_mission');
                $this->em->flush();
                $this->em->clear();
            }
        });
        return Command::SUCCESS;
    }
}
<?php
namespace App\Controller;

use Doctrine\DBAL\Connection;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Contracts\Cache\CacheInterface;

class HealthCheckController extends AbstractController
{
    #[Route('/health', name: 'app_health', methods: ['GET'])]
    public function check(Connection $connection, CacheInterface $cache): JsonResponse
    {
        $status = [
            'status' => 'ok',
            'timestamp' => time(),
            'services' => []
        ];

        $allGood = true;

        // 1. Check Database (Postgres)
        try {
            $connection->executeQuery('SELECT 1');
            $status['services']['database'] = 'up';
        } catch (\Exception $e) {
            $status['services']['database'] = 'down';
            $allGood = false;
        }

        // 2. Check Cache (Redis)
        try {
            $cache->get('health_check_ping', function () { return true; });
            $status['services']['redis'] = 'up';
        } catch (\Exception $e) {
            $status['services']['redis'] = 'down';
            $allGood = false;
        }

        // Return 503 if any dependency is down so K8s knows we aren't "Ready"
        return new JsonResponse($status, $allGood ? 200 : 503);
    }
}
<?php

namespace App\Repository;

use App\Entity\ConductorVehicleAssignment;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ConductorVehicleAssignment>
 */
class ConductorVehicleAssignmentRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ConductorVehicleAssignment::class);
    }

    /**
     * Find active assignment for a conductor and vehicle
     */
    public function findActiveAssignment(string $conductorId, string $vehicleId): ?ConductorVehicleAssignment
    {
        return $this->createQueryBuilder('a')
            ->where('a.conductorId = :conductorId')
            ->andWhere('a.vehicleId = :vehicleId')
            ->andWhere('a.status = :status')
            ->setParameter('conductorId', $conductorId)
            ->setParameter('vehicleId', $vehicleId)
            ->setParameter('status', 'active')
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Find current vehicle for a conductor
     */
    public function findCurrentVehicle(string $conductorId): ?ConductorVehicleAssignment
    {
        return $this->createQueryBuilder('a')
            ->where('a.conductorId = :conductorId')
            ->andWhere('a.status = :status')
            ->orderBy('a.assignedAt', 'DESC')
            ->setParameter('conductorId', $conductorId)
            ->setParameter('status', 'active')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Find all active assignments for a vehicle
     */
    public function findActiveAssignmentsForVehicle(string $vehicleId): array
    {
        return $this->createQueryBuilder('a')
            ->where('a.vehicleId = :vehicleId')
            ->andWhere('a.status = :status')
            ->setParameter('vehicleId', $vehicleId)
            ->setParameter('status', 'active')
            ->getQuery()
            ->getResult();
    }
}

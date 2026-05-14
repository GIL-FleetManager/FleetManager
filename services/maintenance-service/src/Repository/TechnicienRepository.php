<?php

namespace App\Repository;

use App\Entity\Technicien;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class TechnicienRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Technicien::class);
    }

    public function findByKeycloakId(string $keycloakId): ?Technicien
    {
        return $this->findOneBy(['keycloakId' => $keycloakId]);
    }

    /** @return Technicien[] */
    public function findDisponibles(): array
    {
        return $this->findBy(['disponible' => true]);
    }
}
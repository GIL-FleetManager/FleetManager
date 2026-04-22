<?php

namespace App\Entity;

use App\Repository\InterventionRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: InterventionRepository::class)]
#[ORM\Table(name: 'interventions')]
#[ORM\HasLifecycleCallbacks]
class Intervention
{
    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 36, unique: true)]
    private ?string $id = null;

    #[ORM\Column(type: 'string', length: 36)]
    private ?string $vehiculeId = null;

    #[ORM\ManyToOne(targetEntity: Technician::class)]
    #[ORM\JoinColumn(name: 'technicien_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?Technician $technicien = null;

    #[ORM\Column(type: 'string', length: 100)]
    private ?string $typeIntervention = null;

    #[ORM\Column(type: 'date_immutable')]
    private ?\DateTimeImmutable $datePlanifiee = null;

    #[ORM\Column(type: 'date_immutable', nullable: true)]
    private ?\DateTimeImmutable $dateRealisation = null;

    #[ORM\Column(type: 'string', length: 20)]
    private string $statut = 'planifie';

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $description = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private ?\DateTimeImmutable $updatedAt = null;

    public function __construct()
    {
        $this->id = self::generateUuidV4();
    }

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $now = new \DateTimeImmutable();
        $this->createdAt = $this->createdAt ?? $now;
        $this->updatedAt = $this->updatedAt ?? $now;
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    private static function generateUuidV4(): string
    {
        $data = random_bytes(16);
        $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
        $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);

        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }

    public function getId(): ?string
    {
        return $this->id;
    }

    public function getVehiculeId(): ?string
    {
        return $this->vehiculeId;
    }

    public function setVehiculeId(string $vehiculeId): self
    {
        $this->vehiculeId = $vehiculeId;

        return $this;
    }

    public function getTechnicien(): ?Technician
    {
        return $this->technicien;
    }

    public function setTechnicien(?Technician $technicien): self
    {
        $this->technicien = $technicien;

        return $this;
    }

    public function getTypeIntervention(): ?string
    {
        return $this->typeIntervention;
    }

    public function setTypeIntervention(string $typeIntervention): self
    {
        $this->typeIntervention = $typeIntervention;

        return $this;
    }

    public function getDatePlanifiee(): ?\DateTimeImmutable
    {
        return $this->datePlanifiee;
    }

    public function setDatePlanifiee(\DateTimeImmutable $datePlanifiee): self
    {
        $this->datePlanifiee = $datePlanifiee;

        return $this;
    }

    public function getDateRealisation(): ?\DateTimeImmutable
    {
        return $this->dateRealisation;
    }

    public function setDateRealisation(?\DateTimeImmutable $dateRealisation): self
    {
        $this->dateRealisation = $dateRealisation;

        return $this;
    }

    public function getStatut(): string
    {
        return $this->statut;
    }

    public function setStatut(string $statut): self
    {
        $this->statut = $statut;

        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): self
    {
        $this->description = $description;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updatedAt;
    }
}

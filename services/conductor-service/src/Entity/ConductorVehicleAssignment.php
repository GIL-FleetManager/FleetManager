<?php

namespace App\Entity;

use App\Repository\ConductorVehicleAssignmentRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ConductorVehicleAssignmentRepository::class)]
#[ORM\Table(name: 'conductor_vehicle_assignments')]
#[ORM\HasLifecycleCallbacks]
class ConductorVehicleAssignment
{
    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 36, unique: true)]
    private ?string $id = null;

    #[ORM\Column(type: 'string', length: 36)]
    private ?string $conductorId = null;

    #[ORM\Column(type: 'string', length: 36)]
    private ?string $vehicleId = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private ?\DateTimeImmutable $assignedAt = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $unassignedAt = null;

    #[ORM\Column(type: 'string', length: 20)]
    private string $status = 'active';

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
        $this->assignedAt = $this->assignedAt ?? $now;
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

    public function getConductorId(): ?string
    {
        return $this->conductorId;
    }

    public function setConductorId(string $conductorId): self
    {
        $this->conductorId = $conductorId;
        return $this;
    }

    public function getVehicleId(): ?string
    {
        return $this->vehicleId;
    }

    public function setVehicleId(string $vehicleId): self
    {
        $this->vehicleId = $vehicleId;
        return $this;
    }

    public function getAssignedAt(): ?\DateTimeImmutable
    {
        return $this->assignedAt;
    }

    public function setAssignedAt(\DateTimeImmutable $assignedAt): self
    {
        $this->assignedAt = $assignedAt;
        return $this;
    }

    public function getUnassignedAt(): ?\DateTimeImmutable
    {
        return $this->unassignedAt;
    }

    public function setUnassignedAt(?\DateTimeImmutable $unassignedAt): self
    {
        $this->unassignedAt = $unassignedAt;
        return $this;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function setStatus(string $status): self
    {
        $this->status = $status;
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

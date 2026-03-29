<?php

namespace App\Entity;

use App\Repository\VehicleRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: VehicleRepository::class)]
#[ORM\Table(name: 'vehicules')]
class Vehicle
{
#[ORM\Id]
#[ORM\Column(type: 'string', length: 36, unique: true)]
private ?string $id = null;

    #[ORM\Column(length: 20, unique: true)]
    #[Assert\NotBlank]
    private $immatriculation;

    #[ORM\Column(length: 50)]
    #[Assert\NotBlank]
    private $marque;

    #[ORM\Column(length: 50)]
    #[Assert\NotBlank]
    private $modele;

    #[ORM\Column(type: 'string')]
    private $statut = 'disponible';

    public function __construct()
    {
         $this->id = Uuid::v4()->toRfc4122();
    }

public function getId(): ?string { return $this->id; }
    public function getImmatriculation(): ?string { return $this->immatriculation; }
    public function setImmatriculation(string $immatriculation): self { $this->immatriculation = $immatriculation; return $this; }
    public function getMarque(): ?string { return $this->marque; }
    public function setMarque(string $marque): self { $this->marque = $marque; return $this; }
    public function getModele(): ?string { return $this->modele; }
    public function setModele(string $modele): self { $this->modele = $modele; return $this; }
    public function getStatut(): ?string { return $this->statut; }
    public function setStatut(string $statut): self { $this->statut = $statut; return $this; }
}
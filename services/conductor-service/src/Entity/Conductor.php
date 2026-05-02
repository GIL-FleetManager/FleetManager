<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Repository\ConductorRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Serializer\Attribute\SerializedName;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\ApiProperty;

#[ORM\Entity(repositoryClass: ConductorRepository::class)]
#[ORM\Table(name: 'conducteurs')]
#[ORM\HasLifecycleCallbacks]
#[ApiResource(
    shortName: 'Conductor',
    operations: [
        new GetCollection(),
        new Get(uriTemplate: '/conductors/{id}'),
        new Post(),
        new Put(uriTemplate: '/conductors/{id}'),
        new Patch(uriTemplate: '/conductors/{id}'),
        new Delete(uriTemplate: '/conductors/{id}'),
    ]
)]
class Conductor
{
    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 36, unique: true)]
    #[ApiProperty(identifier: true)]
    private ?string $id = null;

    #[ORM\Column(length: 50)]
    #[Assert\NotBlank]
    private ?string $nom = null;

    #[ORM\Column(length: 50)]
    #[Assert\NotBlank]
    private ?string $prenom = null;

    #[ORM\Column(length: 100, unique: true)]
    #[Assert\NotBlank]
    #[Assert\Email]
    private ?string $email = null;

    #[ORM\Column(length: 20, nullable: true)]
    private ?string $telephone = null;

    #[ORM\Column(length: 30, unique: true)]
    #[Assert\NotBlank]
    #[SerializedName("numero_permis")]
    private ?string $numeroPermis = null;

    #[ORM\Column(type: 'date_immutable')]
    #[SerializedName("date_expiration_permis")]
    private ?\DateTimeImmutable $dateExpirationPermis = null;

    #[ORM\Column(length: 20)]
    private string $statut = 'actif';

    #[ORM\Column(type: 'datetime_immutable')]
    #[SerializedName("created_at")]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(type: 'datetime_immutable')]
    #[SerializedName("updated_at")]
    private ?\DateTimeImmutable $updatedAt = null;

    public function __construct()
    {
        $data = random_bytes(16);
        $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
        $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);
        $this->id = vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getId(): ?string { return $this->id; }

    public function getNom(): ?string { return $this->nom; }
    public function setNom(string $nom): self { $this->nom = $nom; return $this; }

    public function getPrenom(): ?string { return $this->prenom; }
    public function setPrenom(string $prenom): self { $this->prenom = $prenom; return $this; }

    public function getEmail(): ?string { return $this->email; }
    public function setEmail(string $email): self { $this->email = $email; return $this; }

    public function getTelephone(): ?string { return $this->telephone; }
    public function setTelephone(?string $telephone): self { $this->telephone = $telephone; return $this; }

    public function getNumeroPermis(): ?string { return $this->numeroPermis; }
    public function setNumeroPermis(string $numeroPermis): self { $this->numeroPermis = $numeroPermis; return $this; }

    public function getDateExpirationPermis(): ?\DateTimeImmutable { return $this->dateExpirationPermis; }
    public function setDateExpirationPermis(\DateTimeImmutable $date): self { $this->dateExpirationPermis = $date; return $this; }

    public function getStatut(): string { return $this->statut; }
    public function setStatut(string $statut): self { $this->statut = $statut; return $this; }

    public function getCreatedAt(): ?\DateTimeImmutable { return $this->createdAt; }
    public function getUpdatedAt(): ?\DateTimeImmutable { return $this->updatedAt; }
}
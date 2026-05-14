<?php

namespace App\Controller;

use App\Entity\Technicien;
use App\Repository\TechnicienRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/techniciens')]
class TechnicienController extends AbstractController
{
    public function __construct(
        private readonly TechnicienRepository $repository,
        private readonly EntityManagerInterface $em,
    ) {}

    #[Route('', methods: ['GET'])]
    public function index(): JsonResponse
    {
        $techniciens = $this->repository->findAll();

        return $this->json(array_map(
            fn(Technicien $t) => $this->serialize($t),
            $techniciens
        ));
    }

    #[Route('/disponibles', methods: ['GET'])]
    public function disponibles(): JsonResponse
    {
        return $this->json(array_map(
            fn(Technicien $t) => $this->serialize($t),
            $this->repository->findDisponibles()
        ));
    }

    #[Route('/{id}', methods: ['GET'])]
    public function show(string $id): JsonResponse
    {
        $technicien = $this->repository->find($id);
        if (!$technicien) {
            return $this->json(['error' => 'Technicien non trouvé'], Response::HTTP_NOT_FOUND);
        }

        return $this->json($this->serialize($technicien));
    }

    /**
     * Appelé au premier login du technicien pour s'enregistrer dans le service.
     * Le frontend envoie les infos du token Keycloak.
     */
    #[Route('/register', methods: ['POST'])]
    public function register(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $keycloakId = $data['keycloakId'] ?? null;
        if (!$keycloakId) {
            return $this->json(['error' => 'keycloakId requis'], Response::HTTP_BAD_REQUEST);
        }

        // Idempotent : si déjà enregistré, on retourne le profil existant
        $existing = $this->repository->findByKeycloakId($keycloakId);
        if ($existing) {
            return $this->json($this->serialize($existing));
        }

        $technicien = (new Technicien())
            ->setKeycloakId($keycloakId)
            ->setNom($data['nom'] ?? 'Inconnu')
            ->setPrenom($data['prenom'] ?? '')
            ->setEmail($data['email'] ?? null)
            ->setSpecialite($data['specialite'] ?? null);

        $this->em->persist($technicien);
        $this->em->flush();

        return $this->json($this->serialize($technicien), Response::HTTP_CREATED);
    }

    #[Route('/{id}', methods: ['PATCH'])]
    public function update(string $id, Request $request): JsonResponse
    {
        $technicien = $this->repository->find($id);
        if (!$technicien) {
            return $this->json(['error' => 'Technicien non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['nom']))        $technicien->setNom($data['nom']);
        if (isset($data['prenom']))     $technicien->setPrenom($data['prenom']);
        if (isset($data['email']))      $technicien->setEmail($data['email']);
        if (isset($data['specialite'])) $technicien->setSpecialite($data['specialite']);
        if (isset($data['disponible'])) $technicien->setDisponible((bool) $data['disponible']);

        $this->em->flush();

        return $this->json($this->serialize($technicien));
    }

    #[Route('/{id}', methods: ['DELETE'])]
    public function delete(string $id): JsonResponse
    {
        $technicien = $this->repository->find($id);
        if (!$technicien) {
            return $this->json(['error' => 'Technicien non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $this->em->remove($technicien);
        $this->em->flush();

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }

    private function serialize(Technicien $t): array
    {
        return [
            'id'          => $t->getId(),
            'keycloakId'  => $t->getKeycloakId(),
            'nom'         => $t->getNom(),
            'prenom'      => $t->getPrenom(),
            'email'       => $t->getEmail(),
            'specialite'  => $t->getSpecialite(),
            'disponible'  => $t->isDisponible(),
            'createdAt'   => $t->getCreatedAt()?->format(\DateTimeInterface::ATOM),
            'updatedAt'   => $t->getUpdatedAt()?->format(\DateTimeInterface::ATOM),
        ];
    }
}
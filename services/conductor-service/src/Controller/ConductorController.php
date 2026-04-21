<?php

namespace App\Controller;

use App\Entity\Conductor;
use App\Repository\ConductorRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/conductors')]
class ConductorController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private ConductorRepository $conductorRepository,
    ) {
    }

    #[Route('', name: 'conductors_list', methods: ['GET'])]
    public function index(): JsonResponse
    {
        $conductors = $this->conductorRepository->findAll();
        $data = array_map(fn (Conductor $c) => $this->serialize($c), $conductors);

        return $this->json($data);
    }

    #[Route('', name: 'conductors_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $body = json_decode($request->getContent(), true);
        if (!is_array($body)) {
            return $this->json(['error' => 'Invalid JSON'], 400);
        }

        foreach (['nom', 'prenom', 'email', 'numero_permis', 'date_expiration_permis'] as $required) {
            if (!isset($body[$required]) || $body[$required] === '') {
                return $this->json(['error' => sprintf('Missing required field: %s', $required)], 400);
            }
        }

        $dateExpirationPermis = $this->parseDate($body['date_expiration_permis']);
        if ($dateExpirationPermis === null) {
            return $this->json(['error' => 'Invalid date_expiration_permis, expected format Y-m-d'], 400);
        }

        $conductor = new Conductor();
        $conductor->setNom($body['nom']);
        $conductor->setPrenom($body['prenom']);
        $conductor->setEmail($body['email']);
        $conductor->setTelephone($body['telephone'] ?? null);
        $conductor->setNumeroPermis($body['numero_permis']);
        $conductor->setDateExpirationPermis($dateExpirationPermis);
        $conductor->setStatut($body['statut'] ?? 'actif');

        $this->em->persist($conductor);
        $this->em->flush();

        return $this->json($this->serialize($conductor), 201);
    }

    #[Route('/{id}', name: 'conductors_show', methods: ['GET'])]
    public function show(string $id): JsonResponse
    {
        $conductor = $this->conductorRepository->find($id);
        if (!$conductor) {
            return $this->json(['error' => 'Conducteur non trouvé'], Response::HTTP_NOT_FOUND);
        }

        return $this->json($this->serialize($conductor));
    }

    #[Route('/{id}', name: 'conductors_update', methods: ['PUT'])]
    public function update(string $id, Request $request): JsonResponse
    {
        $conductor = $this->conductorRepository->find($id);
        if (!$conductor) {
            return $this->json(['error' => 'Conducteur non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $body = json_decode($request->getContent(), true);
        if (!is_array($body)) {
            return $this->json(['error' => 'Invalid JSON'], 400);
        }

        if (isset($body['nom'])) {
            $conductor->setNom($body['nom']);
        }
        if (isset($body['prenom'])) {
            $conductor->setPrenom($body['prenom']);
        }
        if (isset($body['email'])) {
            $conductor->setEmail($body['email']);
        }
        if (array_key_exists('telephone', $body)) {
            $conductor->setTelephone($body['telephone']);
        }
        if (isset($body['numero_permis'])) {
            $conductor->setNumeroPermis($body['numero_permis']);
        }
        if (isset($body['date_expiration_permis'])) {
            $dateExpirationPermis = $this->parseDate($body['date_expiration_permis']);
            if ($dateExpirationPermis === null) {
                return $this->json(['error' => 'Invalid date_expiration_permis, expected format Y-m-d'], 400);
            }
            $conductor->setDateExpirationPermis($dateExpirationPermis);
        }
        if (isset($body['statut'])) {
            $conductor->setStatut($body['statut']);
        }

        $this->em->flush();

        return $this->json($this->serialize($conductor));
    }

    #[Route('/{id}', name: 'conductors_delete', methods: ['DELETE'])]
    public function delete(string $id): JsonResponse
    {
        $conductor = $this->conductorRepository->find($id);
        if (!$conductor) {
            return $this->json(['error' => 'Conducteur non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $this->em->remove($conductor);
        $this->em->flush();

        return $this->json(['message' => 'Conducteur supprimé'], Response::HTTP_OK);
    }

    private function parseDate(string $value): ?\DateTimeImmutable
    {
        $date = \DateTimeImmutable::createFromFormat('Y-m-d', $value);
        if ($date instanceof \DateTimeImmutable && $date->format('Y-m-d') === $value) {
            return $date;
        }

        return null;
    }

    private function serialize(Conductor $c): array
    {
        return [
            'id' => (string) $c->getId(),
            'nom' => $c->getNom(),
            'prenom' => $c->getPrenom(),
            'email' => $c->getEmail(),
            'telephone' => $c->getTelephone(),
            'numero_permis' => $c->getNumeroPermis(),
            'date_expiration_permis' => $c->getDateExpirationPermis()?->format('Y-m-d'),
            'statut' => $c->getStatut(),
            'created_at' => $c->getCreatedAt()?->format(DATE_ATOM),
            'updated_at' => $c->getUpdatedAt()?->format(DATE_ATOM),
        ];
    }
}

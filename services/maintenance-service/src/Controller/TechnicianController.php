<?php

namespace App\Controller;

use App\Entity\Technician;
use App\Repository\TechnicianRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/technicians')]
class TechnicianController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private TechnicianRepository $technicianRepository,
    ) {
    }

    #[Route('', name: 'technicians_list', methods: ['GET'])]
    public function index(): JsonResponse
    {
        $technicians = $this->technicianRepository->findAll();
        $data = array_map(fn (Technician $t) => $this->serialize($t), $technicians);

        return $this->json($data);
    }

    #[Route('', name: 'technicians_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $body = json_decode($request->getContent(), true);
        if (!is_array($body)) {
            return $this->json(['error' => 'Invalid JSON'], 400);
        }

        foreach (['nom', 'prenom', 'email'] as $required) {
            if (!isset($body[$required]) || $body[$required] === '') {
                return $this->json(['error' => sprintf('Missing required field: %s', $required)], 400);
            }
        }

        $technician = new Technician();
        $technician->setNom($body['nom']);
        $technician->setPrenom($body['prenom']);
        $technician->setEmail($body['email']);
        $technician->setTelephone($body['telephone'] ?? null);
        $technician->setStatut($body['statut'] ?? 'actif');

        $this->em->persist($technician);
        $this->em->flush();

        return $this->json($this->serialize($technician), 201);
    }

    #[Route('/{id}', name: 'technicians_show', methods: ['GET'])]
    public function show(string $id): JsonResponse
    {
        $technician = $this->technicianRepository->find($id);
        if (!$technician) {
            return $this->json(['error' => 'Technicien non trouvé'], Response::HTTP_NOT_FOUND);
        }

        return $this->json($this->serialize($technician));
    }

    #[Route('/{id}', name: 'technicians_update', methods: ['PUT'])]
    public function update(string $id, Request $request): JsonResponse
    {
        $technician = $this->technicianRepository->find($id);
        if (!$technician) {
            return $this->json(['error' => 'Technicien non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $body = json_decode($request->getContent(), true);
        if (!is_array($body)) {
            return $this->json(['error' => 'Invalid JSON'], 400);
        }

        if (isset($body['nom'])) {
            $technician->setNom($body['nom']);
        }
        if (isset($body['prenom'])) {
            $technician->setPrenom($body['prenom']);
        }
        if (isset($body['email'])) {
            $technician->setEmail($body['email']);
        }
        if (array_key_exists('telephone', $body)) {
            $technician->setTelephone($body['telephone']);
        }
        if (isset($body['statut'])) {
            $technician->setStatut($body['statut']);
        }

        $this->em->flush();

        return $this->json($this->serialize($technician));
    }

    #[Route('/{id}', name: 'technicians_delete', methods: ['DELETE'])]
    public function delete(string $id): JsonResponse
    {
        $technician = $this->technicianRepository->find($id);
        if (!$technician) {
            return $this->json(['error' => 'Technicien non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $this->em->remove($technician);
        $this->em->flush();

        return $this->json(['message' => 'Technicien supprimé'], Response::HTTP_OK);
    }

    private function serialize(Technician $t): array
    {
        return [
            'id' => (string) $t->getId(),
            'nom' => $t->getNom(),
            'prenom' => $t->getPrenom(),
            'email' => $t->getEmail(),
            'telephone' => $t->getTelephone(),
            'statut' => $t->getStatut(),
            'created_at' => $t->getCreatedAt()?->format(DATE_ATOM),
            'updated_at' => $t->getUpdatedAt()?->format(DATE_ATOM),
        ];
    }
}

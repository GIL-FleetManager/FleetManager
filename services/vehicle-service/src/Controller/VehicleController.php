<?php

namespace App\Controller;

use App\Entity\Vehicle;
use App\Repository\VehicleRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/vehicles')]
class VehicleController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private VehicleRepository $vehicleRepository,
        private ValidatorInterface $validator
    ) {}

    // GET /api/vehicles
    #[Route('', name: 'vehicles_list', methods: ['GET'])]
    public function index(): JsonResponse
    {
        $vehicles = $this->vehicleRepository->findAll();
        $data = array_map(fn(Vehicle $v) => $this->serialize($v), $vehicles);
        return $this->json($data);
    }

    // POST /api/vehicles
    #[Route('', name: 'vehicles_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $body = json_decode($request->getContent(), true);

        if (!$body) {
            return $this->json(['error' => 'Invalid JSON'], Response::HTTP_BAD_REQUEST);
        }

        $vehicle = new Vehicle();
        $vehicle->setImmatriculation($body['immatriculation'] ?? '');
        $vehicle->setMarque($body['marque'] ?? '');
        $vehicle->setModele($body['modele'] ?? '');
        $vehicle->setStatut($body['statut'] ?? 'disponible');

        $errors = $this->validator->validate($vehicle);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[] = $error->getMessage();
            }
            return $this->json(['errors' => $errorMessages], Response::HTTP_BAD_REQUEST);
        }

        $this->em->persist($vehicle);
        $this->em->flush();

        return $this->json($this->serialize($vehicle), Response::HTTP_CREATED);
    }

    // GET /api/vehicles/{id}
    #[Route('/{id}', name: 'vehicles_show', methods: ['GET'])]
    public function show(string $id): JsonResponse
    {
        $vehicle = $this->vehicleRepository->find($id);

        if (!$vehicle) {
            return $this->json(['error' => 'Véhicule non trouvé'], Response::HTTP_NOT_FOUND);
        }

        return $this->json($this->serialize($vehicle));
    }

    // PUT /api/vehicles/{id}
    #[Route('/{id}', name: 'vehicles_update', methods: ['PUT'])]
    public function update(string $id, Request $request): JsonResponse
    {
        $vehicle = $this->vehicleRepository->find($id);

        if (!$vehicle) {
            return $this->json(['error' => 'Véhicule non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $body = json_decode($request->getContent(), true);

        if (isset($body['immatriculation'])) $vehicle->setImmatriculation($body['immatriculation']);
        if (isset($body['marque'])) $vehicle->setMarque($body['marque']);
        if (isset($body['modele'])) $vehicle->setModele($body['modele']);
        if (isset($body['statut'])) $vehicle->setStatut($body['statut']);

        $errors = $this->validator->validate($vehicle);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[] = $error->getMessage();
            }
            return $this->json(['errors' => $errorMessages], Response::HTTP_BAD_REQUEST);
        }

        $this->em->flush();

        return $this->json($this->serialize($vehicle));
    }

    // DELETE /api/vehicles/{id}
    #[Route('/{id}', name: 'vehicles_delete', methods: ['DELETE'])]
    public function delete(string $id): JsonResponse
    {
        $vehicle = $this->vehicleRepository->find($id);

        if (!$vehicle) {
            return $this->json(['error' => 'Véhicule non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $this->em->remove($vehicle);
        $this->em->flush();

        return $this->json(['message' => 'Véhicule supprimé'], Response::HTTP_OK);
    }

    private function serialize(Vehicle $v): array
    {
        return [
            'id' => (string) $v->getId(),
            'immatriculation' => $v->getImmatriculation(),
            'marque' => $v->getMarque(),
            'modele' => $v->getModele(),
            'statut' => $v->getStatut(),
        ];
    }
}
<?php

namespace App\Controller;

use App\Entity\Conductor;
use App\Entity\ConductorVehicleAssignment;
use App\Repository\ConductorRepository;
use App\Repository\ConductorVehicleAssignmentRepository;
use App\Service\KafkaService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/conductors')]
class ConductorController extends AbstractController
{
    use RoleCheckTrait;

    public function __construct(
        private EntityManagerInterface $em,
        private ConductorRepository $conductorRepository,
        private ConductorVehicleAssignmentRepository $assignmentRepository,
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
        $roleCheck = $this->canCreate($request);
        if ($roleCheck instanceof JsonResponse) {
            return $roleCheck;
        }

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
        $roleCheck = $this->canUpdate($request);
        if ($roleCheck instanceof JsonResponse) {
            return $roleCheck;
        }

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
    public function delete(string $id, Request $request): JsonResponse
    {
        $roleCheck = $this->canDelete($request);
        if ($roleCheck instanceof JsonResponse) {
            return $roleCheck;
        }

        $conductor = $this->conductorRepository->find($id);
        if (!$conductor) {
            return $this->json(['error' => 'Conducteur non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $this->em->remove($conductor);
        $this->em->flush();

        return $this->json(['message' => 'Conducteur supprimé'], Response::HTTP_OK);
    }

    #[Route('/{conductorId}/assign-vehicle', name: 'conductor_assign_vehicle', methods: ['POST'])]
    public function assignVehicle(string $conductorId, Request $request, KafkaService $kafka): JsonResponse
    {
        $roleCheck = $this->canUpdate($request);
        if ($roleCheck instanceof JsonResponse) {
            return $roleCheck;
        }

        $conductor = $this->conductorRepository->find($conductorId);
        if (!$conductor) {
            return $this->json(['error' => 'Conducteur non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $body = json_decode($request->getContent(), true);
        if (!is_array($body) || !isset($body['vehicle_id'])) {
            return $this->json(['error' => 'Missing required field: vehicle_id'], 400);
        }

        $vehicleId = $body['vehicle_id'];

        // Check if there's already an active assignment
        $existing = $this->assignmentRepository->findActiveAssignment($conductorId, $vehicleId);
        if ($existing) {
            return $this->json(['error' => 'This conductor is already assigned to this vehicle'], 400);
        }

        // Unassign from previous vehicle if needed
        if ($body['unassign_previous'] ?? false) {
            $previousAssignment = $this->assignmentRepository->findCurrentVehicle($conductorId);
            if ($previousAssignment) {
                $previousAssignment->setStatus('inactive');
                $previousAssignment->setUnassignedAt(new \DateTimeImmutable());
            }
        }

        // Create new assignment
        $assignment = new ConductorVehicleAssignment();
        $assignment->setConductorId($conductorId);
        $assignment->setVehicleId($vehicleId);
        $assignment->setStatus('active');

        $this->em->persist($assignment);
        $this->em->flush();

        $kafka->publishEvent('driver.assigned', [
            'conductor_id' => $conductorId,
            'vehicle_id' => $vehicleId,
            'event_type' => 'VEHICLE_ASSIGNED',
            'timestamp' => time()
        ]);

        return $this->json($this->serializeAssignment($assignment), 201);
    }

    #[Route('/assignments/{assignmentId}/unassign', name: 'conductor_unassign_vehicle', methods: ['POST'])]
    public function unassignVehicle(string $assignmentId, Request $request, KafkaService $kafka): JsonResponse
    {
        $roleCheck = $this->canUpdate($request);
        if ($roleCheck instanceof JsonResponse) {
            return $roleCheck;
        }

        $assignment = $this->assignmentRepository->find($assignmentId);
        if (!$assignment) {
            return $this->json(['error' => 'Assignment not found'], Response::HTTP_NOT_FOUND);
        }

        $assignment->setStatus('inactive');
        $assignment->setUnassignedAt(new \DateTimeImmutable());

        $this->em->flush();

        $kafka->publishEvent('driver.assigned', [
            'vehicle_id' => $assignment->getVehicleId(),
            'event_type' => 'VEHICLE_UNASSIGNED',
            'timestamp' => time()
        ]);

        return $this->json($this->serializeAssignment($assignment));
    }

    #[Route('/{conductorId}/current-vehicle', name: 'conductor_get_current_vehicle', methods: ['GET'])]
    public function getCurrentVehicle(string $conductorId): JsonResponse
    {
        $conductor = $this->conductorRepository->find($conductorId);
        if (!$conductor) {
            return $this->json(['error' => 'Conducteur non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $assignment = $this->assignmentRepository->findCurrentVehicle($conductorId);
        if (!$assignment) {
            return $this->json(['vehicle_id' => null, 'message' => 'No active assignment']);
        }

        return $this->json($this->serializeAssignment($assignment));
    }

    private function serializeAssignment(ConductorVehicleAssignment $assignment): array
    {
        return [
            'id' => $assignment->getId(),
            'conductor_id' => $assignment->getConductorId(),
            'vehicle_id' => $assignment->getVehicleId(),
            'assigned_at' => $assignment->getAssignedAt()?->format(DATE_ATOM),
            'unassigned_at' => $assignment->getUnassignedAt()?->format(DATE_ATOM),
            'status' => $assignment->getStatus(),
            'created_at' => $assignment->getCreatedAt()?->format(DATE_ATOM),
        ];
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

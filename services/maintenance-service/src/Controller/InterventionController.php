<?php

namespace App\Controller;

use App\Entity\Intervention;
use App\Entity\Technician;
use App\Repository\InterventionRepository;
use App\Repository\TechnicianRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/interventions')]
class InterventionController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private InterventionRepository $interventionRepository,
        private TechnicianRepository $technicianRepository,
    ) {
    }

    #[Route('', name: 'interventions_list', methods: ['GET'])]
    public function index(): JsonResponse
    {
        $interventions = $this->interventionRepository->findBy([], ['datePlanifiee' => 'ASC']);
        $data = array_map(fn (Intervention $i) => $this->serialize($i), $interventions);

        return $this->json($data);
    }

    #[Route('/history', name: 'interventions_history', methods: ['GET'])]
    public function history(): JsonResponse
    {
        $qb = $this->interventionRepository->createQueryBuilder('i')
            ->andWhere('i.dateRealisation IS NOT NULL OR i.statut IN (:statuses)')
            ->setParameter('statuses', ['termine', 'annule'])
            ->orderBy('i.updatedAt', 'DESC');

        $interventions = $qb->getQuery()->getResult();
        $data = array_map(fn (Intervention $i) => $this->serialize($i), $interventions);

        return $this->json($data);
    }

    #[Route('/alerts/preventive', name: 'interventions_alerts_preventive', methods: ['GET'])]
    public function preventiveAlerts(Request $request): JsonResponse
    {
        $days = max(1, (int) $request->query->get('days', 7));
        $today = new \DateTimeImmutable('today');
        $deadline = $today->modify(sprintf('+%d days', $days));

        $qb = $this->interventionRepository->createQueryBuilder('i')
            ->andWhere('i.statut = :status')
            ->andWhere('i.datePlanifiee BETWEEN :today AND :deadline')
            ->setParameter('status', 'planifie')
            ->setParameter('today', $today)
            ->setParameter('deadline', $deadline)
            ->orderBy('i.datePlanifiee', 'ASC');

        $interventions = $qb->getQuery()->getResult();
        $data = array_map(fn (Intervention $i) => $this->serialize($i), $interventions);

        return $this->json([
            'window_days' => $days,
            'count' => count($data),
            'alerts' => $data,
        ]);
    }

    #[Route('', name: 'interventions_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $body = json_decode($request->getContent(), true);
        if (!is_array($body)) {
            return $this->json(['error' => 'Invalid JSON'], 400);
        }

        foreach (['vehicule_id', 'type_intervention', 'date_planifiee'] as $required) {
            if (!isset($body[$required]) || $body[$required] === '') {
                return $this->json(['error' => sprintf('Missing required field: %s', $required)], 400);
            }
        }

        $datePlanifiee = $this->parseDate($body['date_planifiee']);
        if ($datePlanifiee === null) {
            return $this->json(['error' => 'Invalid date_planifiee, expected format Y-m-d'], 400);
        }

        $intervention = new Intervention();
        $intervention->setVehiculeId($body['vehicule_id']);
        $intervention->setTypeIntervention($body['type_intervention']);
        $intervention->setDatePlanifiee($datePlanifiee);
        $intervention->setDateRealisation(isset($body['date_realisation']) ? $this->parseDate($body['date_realisation']) : null);
        $intervention->setStatut($body['statut'] ?? 'planifie');
        $intervention->setDescription($body['description'] ?? null);

        if (isset($body['technicien_id']) && $body['technicien_id'] !== null) {
            $technician = $this->technicianRepository->find($body['technicien_id']);
            if (!$technician instanceof Technician) {
                return $this->json(['error' => 'Technicien non trouvé'], 400);
            }
            $intervention->setTechnicien($technician);
        }

        $this->em->persist($intervention);
        $this->em->flush();

        return $this->json($this->serialize($intervention), 201);
    }

    #[Route('/{id}', name: 'interventions_show', methods: ['GET'])]
    public function show(string $id): JsonResponse
    {
        $intervention = $this->interventionRepository->find($id);
        if (!$intervention) {
            return $this->json(['error' => 'Intervention non trouvée'], Response::HTTP_NOT_FOUND);
        }

        return $this->json($this->serialize($intervention));
    }

    #[Route('/{id}', name: 'interventions_update', methods: ['PUT'])]
    public function update(string $id, Request $request): JsonResponse
    {
        $intervention = $this->interventionRepository->find($id);
        if (!$intervention) {
            return $this->json(['error' => 'Intervention non trouvée'], Response::HTTP_NOT_FOUND);
        }

        $body = json_decode($request->getContent(), true);
        if (!is_array($body)) {
            return $this->json(['error' => 'Invalid JSON'], 400);
        }

        if (isset($body['vehicule_id'])) {
            $intervention->setVehiculeId($body['vehicule_id']);
        }
        if (isset($body['type_intervention'])) {
            $intervention->setTypeIntervention($body['type_intervention']);
        }
        if (isset($body['date_planifiee'])) {
            $datePlanifiee = $this->parseDate($body['date_planifiee']);
            if ($datePlanifiee === null) {
                return $this->json(['error' => 'Invalid date_planifiee, expected format Y-m-d'], 400);
            }
            $intervention->setDatePlanifiee($datePlanifiee);
        }
        if (array_key_exists('date_realisation', $body)) {
            if ($body['date_realisation'] === null || $body['date_realisation'] === '') {
                $intervention->setDateRealisation(null);
            } else {
                $dateRealisation = $this->parseDate($body['date_realisation']);
                if ($dateRealisation === null) {
                    return $this->json(['error' => 'Invalid date_realisation, expected format Y-m-d'], 400);
                }
                $intervention->setDateRealisation($dateRealisation);
            }
        }
        if (isset($body['statut'])) {
            $intervention->setStatut($body['statut']);
        }
        if (array_key_exists('description', $body)) {
            $intervention->setDescription($body['description']);
        }
        if (array_key_exists('technicien_id', $body)) {
            if ($body['technicien_id'] === null || $body['technicien_id'] === '') {
                $intervention->setTechnicien(null);
            } else {
                $technician = $this->technicianRepository->find($body['technicien_id']);
                if (!$technician instanceof Technician) {
                    return $this->json(['error' => 'Technicien non trouvé'], 400);
                }
                $intervention->setTechnicien($technician);
            }
        }

        $this->em->flush();

        return $this->json($this->serialize($intervention));
    }

    #[Route('/{id}', name: 'interventions_delete', methods: ['DELETE'])]
    public function delete(string $id): JsonResponse
    {
        $intervention = $this->interventionRepository->find($id);
        if (!$intervention) {
            return $this->json(['error' => 'Intervention non trouvée'], Response::HTTP_NOT_FOUND);
        }

        $this->em->remove($intervention);
        $this->em->flush();

        return $this->json(['message' => 'Intervention supprimée'], Response::HTTP_OK);
    }

    private function parseDate(string $value): ?\DateTimeImmutable
    {
        $date = \DateTimeImmutable::createFromFormat('Y-m-d', $value);
        if ($date instanceof \DateTimeImmutable && $date->format('Y-m-d') === $value) {
            return $date;
        }

        return null;
    }

    private function serialize(Intervention $i): array
    {
        return [
            'id' => (string) $i->getId(),
            'vehicule_id' => $i->getVehiculeId(),
            'technicien_id' => $i->getTechnicien()?->getId(),
            'type_intervention' => $i->getTypeIntervention(),
            'date_planifiee' => $i->getDatePlanifiee()?->format('Y-m-d'),
            'date_realisation' => $i->getDateRealisation()?->format('Y-m-d'),
            'statut' => $i->getStatut(),
            'description' => $i->getDescription(),
            'created_at' => $i->getCreatedAt()?->format(DATE_ATOM),
            'updated_at' => $i->getUpdatedAt()?->format(DATE_ATOM),
        ];
    }
}

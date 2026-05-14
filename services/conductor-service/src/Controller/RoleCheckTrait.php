<?php

namespace App\Controller;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

trait RoleCheckTrait
{
    /**
     * Extract user roles from Keycloak JWT
     */
    protected function getUserRoles(Request $request): array
    {
        $auth = $request->headers->get('Authorization');
        
        // 1. Decode Keycloak JWT
        if ($auth && str_starts_with($auth, 'Bearer ')) {
            $token = substr($auth, 7); // Remove 'Bearer '
            $parts = explode('.', $token);
            
            if (count($parts) === 3) {
                // The middle part of the JWT contains the payload
                $payload = json_decode(base64_decode($parts[1]), true);
                
                // Keycloak buries roles inside realm_access.roles
                return $payload['realm_access']['roles'] ?? [];
            }
        }

        // 2. Fallback for custom dev headers
        $role = $request->headers->get('X-User-Role');
        if ($role) {
            return [strtolower($role)];
        }

        return [];
    }

    /**
     * Check if user has at least one of the required roles
     */
    protected function hasRole(Request $request, array $allowedRoles): bool
    {
        $userRoles = $this->getUserRoles($request);
        
        // array_intersect checks if any elements match between the two arrays
        return count(array_intersect($userRoles, $allowedRoles)) > 0;
    }

    protected function canCreate(Request $request): JsonResponse|bool
    {
        if (!$this->hasRole($request, ['admin', 'manager'])) {
            return $this->json(
                ['error' => 'Unauthorized: Only admin or manager can create'],
                Response::HTTP_FORBIDDEN
            );
        }
        return true;
    }

    protected function canUpdate(Request $request): JsonResponse|bool
    {
        if (!$this->hasRole($request, ['admin', 'manager'])) {
            return $this->json(
                ['error' => 'Unauthorized: Only admin or manager can update'],
                Response::HTTP_FORBIDDEN
            );
        }
        return true;
    }

    protected function canDelete(Request $request): JsonResponse|bool
    {
        if (!$this->hasRole($request, ['admin'])) {
            return $this->json(
                ['error' => 'Unauthorized: Only admin can delete'],
                Response::HTTP_FORBIDDEN
            );
        }
        return true;
    }

    protected function canView(Request $request): JsonResponse|bool
    {
        if (empty($this->getUserRoles($request))) {
            return $this->json(
                ['error' => 'Unauthorized: Authentication required'],
                Response::HTTP_UNAUTHORIZED
            );
        }
        return true;
    }
}
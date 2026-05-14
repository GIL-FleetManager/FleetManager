<?php

namespace App\Controller;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

trait RoleCheckTrait
{
    /**
     * Extract user role from request (from Authorization header or custom header)
     * In a real app, this would use Symfony Security
     */
    protected function getUserRole(Request $request): ?string
    {
        // Check custom header first
        $role = $request->headers->get('X-User-Role');
        if ($role) {
            return strtolower($role);
        }

        // Try to extract from Authorization header if using JWT
        $auth = $request->headers->get('Authorization');
        if ($auth && str_starts_with($auth, 'Bearer ')) {
            // In production, decode JWT and extract role
            // For now, return a default role
            return 'user';
        }

        return null;
    }

    /**
     * Check if user has required role
     */
    protected function hasRole(Request $request, array $allowedRoles): bool
    {
        $userRole = $this->getUserRole($request);
        return $userRole && in_array($userRole, $allowedRoles);
    }

    /**
     * Check if user can create (admin/manager)
     */
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

    /**
     * Check if user can update (admin/manager)
     */
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

    /**
     * Check if user can delete (admin only)
     */
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

    /**
     * Check if user can view (anyone authenticated)
     */
    protected function canView(Request $request): JsonResponse|bool
    {
        if (!$this->getUserRole($request)) {
            return $this->json(
                ['error' => 'Unauthorized: Authentication required'],
                Response::HTTP_UNAUTHORIZED
            );
        }
        return true;
    }
}

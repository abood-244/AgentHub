<?php

namespace App\Services;

/**
 * Permission Service — Sprint 2 Stub
 *
 * In Sprint 2, all permissions return true (Full Access).
 * This service will be connected to the Staff & Permissions module in a future sprint.
 */
class PermissionService
{
    /**
     * Check if user can access a workspace component.
     */
    public function canAccess(int $userId, int $workspaceId, string $component): bool
    {
        // Sprint 2: Full access for all users
        return true;
    }

    /**
     * Check if user can manage agent profile.
     */
    public function canManageAgentProfile(int $userId, int $workspaceId): bool
    {
        return true;
    }

    /**
     * Check if user can manage knowledge base.
     */
    public function canManageDatabase(int $userId, int $workspaceId): bool
    {
        return true;
    }

    /**
     * Check if user can manage channels.
     */
    public function canManageChannels(int $userId, int $workspaceId): bool
    {
        return true;
    }

    /**
     * Check if user can view conversations.
     */
    public function canViewConversations(int $userId, int $workspaceId): bool
    {
        return true;
    }

    /**
     * Check if user can manage support cases.
     */
    public function canManageSupportCases(int $userId, int $workspaceId): bool
    {
        return true;
    }

    /**
     * Check if user can view insights.
     */
    public function canViewInsights(int $userId, int $workspaceId): bool
    {
        return true;
    }

    /**
     * Check if user can manage workspace settings.
     */
    public function canManageSettings(int $userId, int $workspaceId): bool
    {
        return true;
    }

    /**
     * Check if user can use test chat.
     */
    public function canUseTestChat(int $userId, int $workspaceId): bool
    {
        return true;
    }

    /**
     * Check if user can manage customers.
     */
    public function canManageCustomers(int $userId, int $workspaceId): bool
    {
        return true;
    }

    /**
     * Check if user can export reports.
     */
    public function canExportReports(int $userId, int $workspaceId): bool
    {
        return true;
    }

    /**
     * Get accessible components for a user within a workspace.
     * Returns list of component keys the user can access.
     */
    public function getAccessibleComponents(int $userId, int $workspaceId): array
    {
        // Sprint 2: All components accessible
        return [
            'overview',
            'insights_hub',
            'conversations',
            'support_cases',
            'customers',
            'agent_profile',
            'database',
            'channels',
            'test',
            'settings',
        ];
    }
}

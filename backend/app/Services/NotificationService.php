<?php

namespace App\Services;

use App\Models\Notification;

/**
 * Notification Service — handles creating and sending in-app notifications.
 */
class NotificationService
{
    /**
     * Send a notification to a specific user.
     */
    public function send(
        int $userId,
        string $type,
        string $title,
        ?string $titleEn = null,
        ?string $body = null,
        ?string $bodyEn = null,
        ?array $data = null
    ): Notification {
        return Notification::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'title_en' => $titleEn,
            'body' => $body,
            'body_en' => $bodyEn,
            'data' => $data,
            'is_read' => false,
            'created_at' => now(),
        ]);
    }

    /**
     * Send notification for support case creation.
     */
    public function notifySupportCaseCreated(int $staffUserId, array $caseData): Notification
    {
        return $this->send(
            userId: $staffUserId,
            type: 'support_case_created',
            title: 'حالة دعم جديدة: ' . ($caseData['title'] ?? ''),
            titleEn: 'New Support Case: ' . ($caseData['title'] ?? ''),
            body: 'تم إنشاء حالة دعم جديدة برقم ' . ($caseData['case_number'] ?? '') . ' وتم إسنادها إليك.',
            bodyEn: 'A new support case ' . ($caseData['case_number'] ?? '') . ' has been created and assigned to you.',
            data: [
                'workspace_id' => $caseData['workspace_id'] ?? null,
                'support_case_id' => $caseData['id'] ?? null,
                'case_number' => $caseData['case_number'] ?? null,
            ],
        );
    }

    /**
     * Send notification for support case assignment.
     */
    public function notifySupportCaseAssigned(int $staffUserId, array $caseData): Notification
    {
        return $this->send(
            userId: $staffUserId,
            type: 'support_case_assigned',
            title: 'تم إسناد حالة دعم إليك: ' . ($caseData['case_number'] ?? ''),
            titleEn: 'Support Case Assigned: ' . ($caseData['case_number'] ?? ''),
            body: 'تم إسناد حالة الدعم "' . ($caseData['title'] ?? '') . '" إليك للمتابعة.',
            bodyEn: 'Support case "' . ($caseData['title'] ?? '') . '" has been assigned to you.',
            data: [
                'workspace_id' => $caseData['workspace_id'] ?? null,
                'support_case_id' => $caseData['id'] ?? null,
                'case_number' => $caseData['case_number'] ?? null,
            ],
        );
    }

    /**
     * Get unread count for a user.
     */
    public function getUnreadCount(int $userId): int
    {
        return Notification::where('user_id', $userId)->where('is_read', false)->count();
    }
}

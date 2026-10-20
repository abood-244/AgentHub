<?php

namespace App\Enums;

enum UserRole: string
{
    case SYSTEM_ADMINISTRATOR = 'system_administrator';
    case STAFF = 'staff';
    case PLATFORM_ADMINISTRATOR = 'platform_administrator';

    /**
     * Get the human-readable label matching the approved Sprint 1 specifications.
     */
    public function label(): string
    {
        return match ($this) {
            self::SYSTEM_ADMINISTRATOR => 'System Administrator',
            self::STAFF => 'Staff',
            self::PLATFORM_ADMINISTRATOR => 'Platform Administrator',
        };
    }

    /**
     * Map approved display name or raw key to enum instance.
     */
    public static function fromValueOrLabel(?string $value): ?self
    {
        if ($value === null) {
            return null;
        }

        return match (trim($value)) {
            'system_administrator', 'System Administrator' => self::SYSTEM_ADMINISTRATOR,
            'staff', 'Staff' => self::STAFF,
            'platform_administrator', 'Platform Administrator' => self::PLATFORM_ADMINISTRATOR,
            default => null,
        };
    }
}

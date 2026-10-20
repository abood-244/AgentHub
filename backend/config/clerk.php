<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Clerk Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for Clerk authentication in AgentHub.
    | The issuer and JWKS URL can be explicitly set or derived automatically
    | from the Clerk publishable key.
    |
    */

    'publishable_key' => env('CLERK_PUBLISHABLE_KEY', env('VITE_CLERK_PUBLISHABLE_KEY')),

    'issuer' => env('CLERK_ISSUER', 'https://amazing-sunbeam-6146.clerk.accounts.dev'),

    'jwks_url' => env('CLERK_JWKS_URL', 'https://amazing-sunbeam-6146.clerk.accounts.dev/.well-known/jwks.json'),

    'jwks_cache_ttl' => (int) env('CLERK_JWKS_CACHE_TTL', 3600),

    /*
    |--------------------------------------------------------------------------
    | Test Identifiers for Local Development (Sprint 1)
    |--------------------------------------------------------------------------
    |
    | Real Clerk User IDs configured for local test accounts.
    |
    */
    'test_identities' => [
        'system_admin' => [
            'clerk_id' => env('CLERK_TEST_SYSTEM_ADMIN_USER_ID'),
            'name' => env('CLERK_TEST_SYSTEM_ADMIN_NAME', 'يوسف العتيبي'),
            'email' => env('CLERK_TEST_SYSTEM_ADMIN_EMAIL', 'admin@agenthub.test'),
        ],
        'staff' => [
            'clerk_id' => env('CLERK_TEST_STAFF_USER_ID'),
            'name' => env('CLERK_TEST_STAFF_NAME', 'أحمد المطيري'),
            'email' => env('CLERK_TEST_STAFF_EMAIL', 'staff@agenthub.test'),
        ],
        'platform_admin' => [
            'clerk_id' => env('CLERK_TEST_PLATFORM_ADMIN_USER_ID'),
            'name' => env('CLERK_TEST_PLATFORM_ADMIN_NAME', 'Platform Administrator'),
            'email' => env('CLERK_TEST_PLATFORM_ADMIN_EMAIL', 'platform@agenthub.test'),
        ],
    ],
];

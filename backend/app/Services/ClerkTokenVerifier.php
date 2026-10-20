<?php

namespace App\Services;

use Firebase\JWT\JWK;
use Firebase\JWT\JWT;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use InvalidArgumentException;
use RuntimeException;
use UnexpectedValueException;

class ClerkTokenVerifier implements ClerkTokenVerifierInterface
{
    protected string $jwksUrl;
    protected string $expectedIssuer;
    protected int $cacheTtl;

    public function __construct(
        ?string $jwksUrl = null,
        ?string $expectedIssuer = null,
        ?int $cacheTtl = null
    ) {
        $this->jwksUrl = $jwksUrl ?? config('clerk.jwks_url', 'https://amazing-sunbeam-6146.clerk.accounts.dev/.well-known/jwks.json');
        $this->expectedIssuer = $expectedIssuer ?? config('clerk.issuer', 'https://amazing-sunbeam-6146.clerk.accounts.dev');
        $this->cacheTtl = $cacheTtl ?? config('clerk.jwks_cache_ttl', 3600);
    }

    /**
     * Verify a Clerk JWT string and return the decoded token claims object.
     *
     * @param string $token
     * @return object
     *
     * @throws UnexpectedValueException|InvalidArgumentException|RuntimeException
     */
    public function verifyToken(string $token): object
    {
        if (empty(trim($token))) {
            throw new InvalidArgumentException('Token is empty');
        }

        $keys = $this->getPublicKeys();

        // Allow 60 seconds leeway for clock skew
        $previousLeeway = JWT::$leeway;
        JWT::$leeway = 60;

        try {
            $payload = JWT::decode($token, $keys);
        } finally {
            JWT::$leeway = $previousLeeway;
        }

        // Validate issuer claim
        if (isset($payload->iss)) {
            $normalizedPayloadIss = rtrim($payload->iss, '/');
            $normalizedExpectedIss = rtrim($this->expectedIssuer, '/');

            if ($normalizedPayloadIss !== $normalizedExpectedIss) {
                throw new UnexpectedValueException(
                    "Invalid token issuer. Expected '{$this->expectedIssuer}', got '{$payload->iss}'"
                );
            }
        }

        // Validate subject (Clerk user id)
        if (empty($payload->sub)) {
            throw new UnexpectedValueException('Token subject (sub) claim is missing');
        }

        return $payload;
    }

    /**
     * Retrieve and cache Clerk JWKS public keys.
     *
     * @return array
     */
    protected function getPublicKeys(): array
    {
        $jwks = Cache::remember('clerk_jwks_data', $this->cacheTtl, function () {
            $http = Http::timeout(10);

            if (! ini_get('curl.cainfo') && ! ini_get('openssl.cafile')) {
                foreach ([
                    'C:/Program Files/Git/mingw64/etc/ssl/certs/ca-bundle.crt',
                    'C:/Program Files/Git/usr/ssl/certs/ca-bundle.crt',
                ] as $ca) {
                    if (file_exists($ca)) {
                        $http = $http->withOptions(['verify' => $ca]);
                        break;
                    }
                }
            }

            $response = $http->get($this->jwksUrl);

            if (! $response->successful()) {
                throw new RuntimeException("Failed to fetch Clerk JWKS from: {$this->jwksUrl}");
            }

            $data = $response->json();
            if (empty($data['keys']) || ! is_array($data['keys'])) {
                throw new RuntimeException('Invalid JWKS structure received from Clerk');
            }

            return $data;
        });

        return JWK::parseKeySet($jwks);
    }
}

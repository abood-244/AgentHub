<?php

namespace App\Services;

interface ClerkTokenVerifierInterface
{
    /**
     * Verify a Clerk JWT string and return the decoded token claims object.
     *
     * @param string $token
     * @return object Decoded JWT payload
     *
     * @throws \Exception When token is invalid, expired, or untrusted
     */
    public function verifyToken(string $token): object;
}

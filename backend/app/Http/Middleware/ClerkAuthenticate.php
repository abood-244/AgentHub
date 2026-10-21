<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Services\ClerkTokenVerifierInterface;
use Closure;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class ClerkAuthenticate
{
    public function __construct(
        protected ClerkTokenVerifierInterface $verifier
    ) {}

    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next): Response
    {
        $header = $request->header('Authorization');

        if (! $header || ! str_starts_with($header, 'Bearer ')) {
            return response()->json([
                'message' => 'Unauthenticated: Bearer token missing',
            ], Response::HTTP_UNAUTHORIZED);
        }

        $token = trim(substr($header, 7));

        if (empty($token)) {
            return response()->json([
                'message' => 'Unauthenticated: Empty bearer token',
            ], Response::HTTP_UNAUTHORIZED);
        }

        try {
            $payload = $this->verifier->verifyToken($token);
        } catch (Exception $e) {
            return response()->json([
                'message' => 'Unauthenticated: ' . $e->getMessage(),
            ], Response::HTTP_UNAUTHORIZED);
        }

        $clerkUserId = $payload->sub ?? null;

        if (! $clerkUserId) {
            return response()->json([
                'message' => 'Unauthenticated: Missing subject in token',
            ], Response::HTTP_UNAUTHORIZED);
        }

        // Resolve internal user in PostgreSQL
        $user = User::where('clerk_user_id', $clerkUserId)->first();

        if (! $user) {
            return response()->json([
                'message' => 'Forbidden: Clerk identity not registered as an AgentHub user',
            ], Response::HTTP_FORBIDDEN);
        }

        // Validate that user has a valid internal role
        if (! $user->role) {
            return response()->json([
                'message' => 'Forbidden: User has no assigned internal role',
            ], Response::HTTP_FORBIDDEN);
        }

        // Attach user to current request and Laravel Auth guard
        Auth::setUser($user);
        $request->setUserResolver(fn () => $user);

        return $next($request);
    }
}

<?php

namespace App\Providers;

use App\Models\University;
use App\Models\Workspace;
use App\Policies\UniversityPolicy;
use App\Policies\WorkspacePolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(
            \App\Services\ClerkTokenVerifierInterface::class,
            \App\Services\ClerkTokenVerifier::class
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(University::class, UniversityPolicy::class);
        Gate::policy(Workspace::class, WorkspacePolicy::class);
    }
}

<?php

namespace Aaix\LaravelIslandsDatagrid;

use Aaix\LaravelIslandsDatagrid\Preferences\ModelPreferenceRepository;
use Aaix\LaravelIslandsDatagrid\Preferences\PreferenceRepository;
use Illuminate\Support\ServiceProvider;

class DatagridServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__.'/../config/datagrid.php', 'datagrid');

        $this->app->bindIf(PreferenceRepository::class, ModelPreferenceRepository::class);
    }

    public function boot(): void
    {
        $this->publishes([__DIR__.'/../config/datagrid.php' => config_path('datagrid.php')], 'datagrid-config');
    }
}

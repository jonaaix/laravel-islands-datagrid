<?php

namespace Aaix\LaravelIslandsDatagrid;

use Illuminate\Support\ServiceProvider;

class DatagridServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__.'/../config/datagrid.php', 'datagrid');
    }

    public function boot(): void
    {
        $this->publishes([__DIR__.'/../config/datagrid.php' => config_path('datagrid.php')], 'datagrid-config');
    }
}

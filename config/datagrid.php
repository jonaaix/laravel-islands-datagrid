<?php

declare(strict_types=1);
use App\Models\DatatableViewProfile;

return [

    /*
    |--------------------------------------------------------------------------
    | Saved views
    |--------------------------------------------------------------------------
    |
    | Where a table keeps the views people save, how many each of them may keep
    | per table, and how long the reference in a shared link is. The model needs
    | the columns `public_ref`, `user_id`, `section`, `name` and a json `payload`.
    |
    */
    'view_profiles' => [
        'model' => DatatableViewProfile::class,
        'max_per_section' => 50,
        'ref_length' => 10,
    ],

    /*
    |--------------------------------------------------------------------------
    | Preferences
    |--------------------------------------------------------------------------
    |
    | What a person chose for a table — its columns and whatever else its schema
    | declares. The model needs the columns `user_id`, `section`, `key` and a json
    | `value`. An application with settings of its own binds a
    | `PreferenceRepository` instead, and this key is never read.
    |
    */
    'preferences' => [
        'model' => 'App\\Models\\UserSetting',
    ],

];

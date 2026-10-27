<?php

use App\Models\Categoria;
use App\Models\Equipo;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    Sanctum::actingAs(User::factory()->create());
});

it('crea un equipo y responde 201 con el encabezado Location', function () {
    $categoria = Categoria::factory()->create();

    $datos = [
        'codigo' => 'EQ-9999',
        'nombre' => 'Laptop de prueba',
        'categoria_id' => $categoria->id,
        'fecha_adquisicion' => '2026-01-15',
        'costo_interno' => 1500.50,
    ];

    $response = $this->postJson('/api/equipos', $datos);

    $response->assertCreated()
             ->assertHeader('Location')
             ->assertJsonPath('data.codigo', 'EQ-9999');

    $this->assertDatabaseHas('equipos', ['codigo' => 'EQ-9999']);
});

it('rechaza un equipo con datos inválidos y responde 422 con errores por campo', function () {
    $response = $this->postJson('/api/equipos', [
        'codigo' => 'INVALIDO',
        'nombre' => 'AB',
        'categoria_id' => 99999,
        'fecha_adquisicion' => '2099-01-01',
        'costo_interno' => -10,
    ]);

    $response->assertUnprocessable()
             ->assertJsonValidationErrors([
                 'codigo',
                 'nombre',
                 'categoria_id',
                 'fecha_adquisicion',
                 'costo_interno',
             ]);
});

it('impide eliminar un equipo prestado y responde 409', function () {
    $equipo = Equipo::factory()->create(['estado' => 'prestado']);

    $response = $this->deleteJson("/api/equipos/{$equipo->id}");

    $response->assertStatus(409)
             ->assertJson([
                 'mensaje' => 'No se puede eliminar un equipo prestado.',
                 'codigo' => 'REGLA_NEGOCIO',
             ]);

    $this->assertDatabaseHas('equipos', ['id' => $equipo->id]);
});
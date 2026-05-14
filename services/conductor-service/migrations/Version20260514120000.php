<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260514120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create conductor_vehicle_assignments table';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE conductor_vehicle_assignments (id VARCHAR(36) NOT NULL, conductor_id VARCHAR(36) NOT NULL, vehicle_id VARCHAR(36) NOT NULL, assigned_at TIMESTAMP(0) WITH TIME ZONE NOT NULL, unassigned_at TIMESTAMP(0) WITH TIME ZONE DEFAULT NULL, status VARCHAR(20) NOT NULL DEFAULT \'active\', created_at TIMESTAMP(0) WITH TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITH TIME ZONE NOT NULL, PRIMARY KEY (id))');
        $this->addSql('CREATE INDEX idx_conductor_active ON conductor_vehicle_assignments (conductor_id, status)');
        $this->addSql('CREATE INDEX idx_vehicle_active ON conductor_vehicle_assignments (vehicle_id, status)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE conductor_vehicle_assignments');
    }
}

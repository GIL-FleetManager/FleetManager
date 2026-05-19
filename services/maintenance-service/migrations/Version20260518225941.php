<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260518225941 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE interventions (id VARCHAR(36) NOT NULL, vehicule_id VARCHAR(36) NOT NULL, technicien_id VARCHAR(36) DEFAULT NULL, type_intervention VARCHAR(100) NOT NULL, date_planifiee DATE NOT NULL, date_realisation DATE DEFAULT NULL, statut VARCHAR(20) NOT NULL, description TEXT DEFAULT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY (id))');
        $this->addSql('CREATE TABLE techniciens (id VARCHAR(36) NOT NULL, keycloak_id VARCHAR(36) NOT NULL, nom VARCHAR(100) NOT NULL, prenom VARCHAR(100) NOT NULL, email VARCHAR(150) DEFAULT NULL, specialite VARCHAR(100) DEFAULT NULL, disponible BOOLEAN NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY (id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_64F2EA9C491914B1 ON techniciens (keycloak_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP TABLE interventions');
        $this->addSql('DROP TABLE techniciens');
    }
}

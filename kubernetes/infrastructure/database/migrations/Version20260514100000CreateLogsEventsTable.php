<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260514100000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create logs_events table for event service';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('
            CREATE TABLE IF NOT EXISTS logs_events (
                id SERIAL PRIMARY KEY,
                event_type VARCHAR(255) NOT NULL,
                topic VARCHAR(255) NOT NULL,
                payload JSONB NOT NULL,
                timestamp TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                source_service VARCHAR(255),
                correlation_id VARCHAR(255)
            )
        ');

        $this->addSql('CREATE INDEX IF NOT EXISTS idx_logs_events_timestamp ON logs_events(timestamp)');
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_logs_events_event_type ON logs_events(event_type)');
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_logs_events_topic ON logs_events(topic)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE IF EXISTS logs_events');
    }
}

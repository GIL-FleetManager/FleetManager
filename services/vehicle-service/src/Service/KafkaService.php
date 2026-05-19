<?php

namespace App\Service;

use Enqueue\RdKafka\RdKafkaConnectionFactory;
use Interop\Queue\Context;
use Symfony\Component\Serializer\SerializerInterface;
use Psr\Log\LoggerInterface;

class KafkaService
{
    private ?Context $context = null;
    private string $brokers;

    public function __construct(
        private SerializerInterface $serializer,
        private LoggerInterface $logger,
    ) {
        $this->brokers = $_ENV['ENQUEUE_DSN'] ?? 'rdkafka://kafka:9092';
    }

    private function getContext(): Context
    {
        if ($this->context === null) {
            try {
                $factory = new \Enqueue\RdKafka\RdKafkaConnectionFactory($this->brokers);
                $this->context = $factory->createContext();
                $this->logger->info('Kafka context initialized', ['brokers' => $this->brokers]);
            } catch (\Exception $e) {
                $this->logger->error('Failed to initialize Kafka context', [
                    'error' => $e->getMessage(),
                    'brokers' => $this->brokers,
                ]);
                throw $e;
            }
        }

        return $this->context;
    }

    public function publishEvent(string $topic, array $payload): void
    {
        try {
            $context = $this->getContext();
            $topic_obj = $context->createTopic($topic);

            $message = $context->createMessage($this->serializer->serialize($payload, 'json'));

            $context->createProducer()->send($topic_obj, $message);

            $this->logger->info('Event published to Kafka', [
                'topic' => $topic,
                'payload' => $payload,
            ]);
        } catch (\Exception $e) {
            $this->logger->error('Failed to publish event to Kafka', [
                'topic' => $topic,
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function consume(string $topicName, callable $callback): void
    {
        $context = $this->getContext();
        $topic = $context->createTopic($topicName);
        
        $queue = $context->createQueue($topicName);
        $consumer = $context->createConsumer($queue);

        $this->logger->info('Starting Kafka consumer on topic: ' . $topicName);

        while (true) {
            if ($message = $consumer->receive()) {
                $payload = json_decode($message->getBody(), true);
                $callback($payload);
                $consumer->acknowledge($message);
            }
        }
    }

    public function __destruct()
    {
        if ($this->context !== null) {
            try {
                $this->context->close();
            } catch (\Exception $e) {
                $this->logger->error('Error closing Kafka context', ['error' => $e->getMessage()]);
            }
        }
    }
}

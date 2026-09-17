import json
import logging
from typing import Any, Dict, Optional
from confluent_kafka import Producer
import os

logger = logging.getLogger(__name__)

class KafkaService:
    """
    Service for Kafka messaging integration.
    Handles event publishing for cross-service communication.
    """
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(KafkaService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
            
        self.bootstrap_servers = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092')
        self.default_topic = os.getenv('KAFKA_DEFAULT_TOPIC', 'recruai_events')
        self.producer_config = {
            'bootstrap.servers': self.bootstrap_servers,
            'client.id': 'recruai-backend',
            # Add security configs if needed for production
        }
        
        try:
            self.producer = Producer(self.producer_config)
            self._initialized = True
            logger.info(f"Kafka Producer initialized with servers: {self.bootstrap_servers}")
        except Exception as e:
            logger.error(f"Failed to initialize Kafka Producer: {e}")
            self.producer = None

    def _delivery_report(self, err, msg):
        """Called once for each message produced to indicate delivery result."""
        if err is not None:
            logger.error(f"Message delivery failed: {err}")
        else:
            logger.debug(f"Message delivered to {msg.topic()} [{msg.partition()}]")

    def publish_event(self, topic: str, event_type: str, data: Dict[str, Any], key: Optional[str] = None):
        """
        Publish an event to a Kafka topic.
        
        Args:
            topic: Kafka topic name
            event_type: Type of event (e.g., 'interview_started')
            data: Event payload
            key: Optional message key for partitioning
        """
        if not self.producer:
            logger.warning(f"Kafka Producer not available. Skipping event: {event_type}")
            return False

        try:
            payload = {
                'event_type': event_type,
                'data': data,
                'timestamp': str(logging.Formatter.default_msec_format) # Placeholder for real timing
            }
            
            self.producer.produce(
                topic, 
                key=key, 
                value=json.dumps(payload).encode('utf-8'),
                callback=self._delivery_report
            )
            
            # Flush to ensure delivery for critical events or in dev
            # In high volume scenarios, we might want to skip explicit flushing
            self.producer.poll(0)
            return True
        except Exception as e:
            logger.error(f"Error publishing Kafka event: {e}")
            return False

    def flush(self, timeout=10):
        """Force flush all pending messages."""
        if self.producer:
            self.producer.flush(timeout)

    def emit_event(self, event_type: str, data: Dict[str, Any], topic: Optional[str] = None, key: Optional[str] = None):
        """Simplified event emission using default topic."""
        target_topic = topic or self.default_topic
        return self.publish_event(target_topic, event_type, data, key)

# Global helper instance
kafka_service = KafkaService()

def emit_event(topic: str, event_type: str, data: Dict[str, Any], key: Optional[str] = None):
    """Utility function to emit events without direct service handling."""
    return kafka_service.publish_event(topic, event_type, data, key)

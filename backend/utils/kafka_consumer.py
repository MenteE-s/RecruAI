import json
import logging
import threading
from confluent_kafka import Consumer, KafkaError
from flask import Flask
import os
from ..extensions import socketio

logger = logging.getLogger(__name__)

class KafkaConsumerService:
    """
    Service for Kafka consuming integration.
    Runs a background thread to process events from Kafka topics.
    """
    
    def __init__(self, bootstrap_servers: str, group_id: str, topics: list):
        self.config = {
            'bootstrap.servers': bootstrap_servers,
            'group.id': group_id,
            'auto.offset.reset': 'earliest',
            'enable.auto.commit': True
        }
        self.topics = topics
        self.consumer = None
        self.running = False
        self.thread = None

    def start(self, app: Flask, callback_map: dict):
        """
        Start the consumer thread.
        callback_map: Dict mapping topic names to handler functions.
        Each handler receives (app, message_data).
        """
        if self.running:
            return
            
        self.running = True
        self.thread = threading.Thread(
            target=self._consume_loop, 
            args=(app, callback_map),
            daemon=True
        )
        self.thread.start()
        logger.info(f"Kafka Consumer started for topics: {self.topics}")

    def stop(self):
        """Stop the consumer thread."""
        self.running = False
        if self.thread:
            self.thread.join(timeout=5)

    def _consume_loop(self, app: Flask, callback_map: dict):
        """Internal consumption loop."""
        try:
            self.consumer = Consumer(self.config)
            self.consumer.subscribe(self.topics)

            while self.running:
                msg = self.consumer.poll(1.0)

                if msg is None:
                    continue
                if msg.error():
                    if msg.error().code() == KafkaError._PARTITION_EOF:
                        continue
                    else:
                        logger.error(f"Kafka Error: {msg.error()}")
                        break

                # Process message
                topic = msg.topic()
                try:
                    data = json.loads(msg.value().decode('utf-8'))
                    
                    # Auto-broadcast to Socket.IO for real-time frontend updates
                    self._broadcast_to_socket(topic, data)
                    
                    handler = callback_map.get(topic)
                    
                    if handler:
                        with app.app_context():
                            handler(app, data)
                except Exception as e:
                    logger.error(f"Error processing Kafka message from {topic}: {e}")

        except Exception as e:
            logger.error(f"Kafka Consumer Loop Error: {e}")
        finally:
            if self.consumer:
                self.consumer.close()

    def _broadcast_to_socket(self, topic, data):
        """Bridge Kafka events to Socket.IO for real-time frontend updates."""
        try:
            # The event name is usually the event_type field we added in our emit_event calls
            event_name = data.get('event_type') or topic
            user_id = data.get('user_id')
            org_id = data.get('org_id') or data.get('organization_id')

            # Broadcast to user-specific room if available
            if user_id:
                socketio.emit(event_name, data, room=f"user_{user_id}")
            
            # Broadcast to organization-specific room if available
            if org_id:
                socketio.emit(event_name, data, room=f"org_{org_id}")

            # Also broadcast globally if no specific target, or for general updates
            if not user_id and not org_id:
                socketio.emit(event_name, data)
                
        except Exception as e:
            logger.error(f"Error broadcasting to Socket.IO: {e}")
            self.running = False

def handle_interview_event(app, data):
    """Example handler for interview events."""
    logger.info(f"Consumed interview event: {data}")
    # Perform background tasks (e.g., email notification, analytics update)
    pass

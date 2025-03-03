import { useEffect, useState, useMemo, useCallback } from 'react';
import mqtt from 'mqtt';

interface UseMqttOptions {
  ipaddress: string;
  options?: mqtt.IClientOptions;
}

export const useMqtt = ({ ipaddress, options }: UseMqttOptions) => {
  const [messages, setMessages] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const memoizedOptions = useMemo(() => options, [options]);
  const client = useMemo(() => ipaddress && mqtt.connect(`ws://${ipaddress}:9001`, memoizedOptions), [ipaddress, memoizedOptions]);
  const [subscribedTopics, setSubscribedTopics] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!client) return;
    client.on('connect', () => {
      console.log('Connected to MQTT broker');
      setIsConnected(true);
    });

    client.on('message', (topic, payload) => {
      const message = `${topic}: ${payload.toString()}`;
      setMessages((prev) => [...prev, message]);
    });
    client.on('close', () => {
      console.log('MQTT client disconnected');
      setIsConnected(false);
    });

    client.on('error', (error) => {
      console.error('MQTT error:', error.message || error);
    });
    

    return () => {

    };
  }, [client]);

  const subscribe = useCallback((topic: string) => {
    if (!client || subscribedTopics.has(topic)) return;
    
    // Add topic to the set of subscribed topics
    setSubscribedTopics((prev) => new Set(prev.add(topic)));
    client?.subscribe(topic, (err) => {
      if (err) console.error(`Failed to subscribe to topic "${topic}":`, err);
      else console.log(`Subscribed to topic: ${topic}`);
    });
  }, [client]);
  

  const publish = useCallback((topic: string, message: string) => {
    if (!client || !client.connected) {
      console.error('Failed to publish: MQTT client is not connected');
      return;
    }
    client?.publish(topic, message, {}, (err) => {
      if (err) console.error('Failed to publish message:', err);
      else console.log(`Message published to ${topic}: ${message}`);
    });
  }, [client]);

  return { messages, subscribe, publish, isConnected };
};

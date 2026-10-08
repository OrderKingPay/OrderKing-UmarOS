import { EventEmitter } from 'events';

class EventBus extends EventEmitter {}

const eventBus = new EventBus();

export function emitSystemEvent(eventName: string | symbol, data: any): boolean {
  return eventBus.emit(eventName, data);
}

export function subscribeToEvent(eventName: string | symbol, handler: (...args: any[]) => void): void {
  eventBus.on(eventName, handler);
}

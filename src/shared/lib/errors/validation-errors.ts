export class EventValidationError extends Error {
  constructor(message: string, eventId: string) {
    super(message);
    this.name = 'EventValidationError';

    console.error(`EventValidationError: the event ${eventId} is not found`);
  }
}

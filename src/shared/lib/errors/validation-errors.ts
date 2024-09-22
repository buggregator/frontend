export class EventValidationError extends Error {
  constructor(message: string, eventId: string) {
    super(message) // (1)
    this.name = "EventValidationError" // (2)

    console.error(`EventValidationError: the event ${eventId} is not found`)
  }
}

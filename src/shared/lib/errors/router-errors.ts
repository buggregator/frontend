export class RouteAvailabilityError extends Error {
  constructor(message: string, routeName: string) {
    super(message);
    this.name = "RouteAvailabilityError";

    console.error(`RouteAvailabilityError: the route ${routeName} is not available`)
  }
}

export class RouteAuthAccessError extends Error {
  constructor(message: string, routeName: string) {
    super(message);
    this.name = "RouteAuthAccessError";

    console.error(`RouteAuthAccessError: the route ${routeName} is not permitted without token`)
  }
}

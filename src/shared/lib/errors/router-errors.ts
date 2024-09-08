export class RouteAccessError extends Error {
  constructor(message: string, routeName: string) {
    super(message); // (1)
    this.name = "RouteAccessError"; // (2)

    console.error(`RouteAccessError: the route ${routeName} is not permitted`)
  }
}

export class RouteAuthAccessError extends Error {
  constructor(message: string, routeName: string) {
    super(message); // (1)
    this.name = "RouteAuthAccessError"; // (2)

    console.error(`RouteAuthAccessError: the route ${routeName} is not permitted without token`)
  }
}

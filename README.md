<a href="https://discord.gg/vDsCD3EKUB"><img src="https://img.shields.io/badge/discord-chat-magenta.svg"></a>
[![Downloads](https://img.shields.io/docker/pulls/butschster/buggregator.svg)](https://hub.docker.com/repository/docker/butschster/buggregator)
[![Twitter](https://img.shields.io/badge/twitter-Follow-blue)](https://twitter.com/buggregator)

# Buggregator Frontend

Debug everything. Install nothing.

Frontend SPA for [Buggregator Server](https://github.com/buggregator/server) — a free, open-source debugging server that
runs beside your application. One `docker run` gives you exceptions, dumps, emails, profiling, and logs in a single
real-time UI. No code changes required.

This repository contains the web interface built with Vue 3, TypeScript, and Storybook.

<img src="https://github.com/buggregator/.github/assets/773481/24981ab5-510a-453c-a3c5-8a6f5e7bf358">

![storybook](https://github.com/buggregator/frontend/assets/773481/4a7166ee-2f3e-4fda-b7c5-ede3b2601abc)

## Documentation, Installation and Usage Instructions

See the[documentation](https://docs.buggregator.dev/)for detailed installation and usage instructions.

### Install as an app

The UI can be installed as a desktop app (Chrome, Edge and other Chromium browsers: the install icon in the address
bar). The installed app opens in its own window, and its icon shows how many new events arrived while the window was
in the background; the counter resets when you switch back to it.

> **Note**
> Browsers offer installation only on `https://` or on `localhost` / `127.0.0.1`. When Buggregator is opened over plain
> `http` by a LAN address or a custom host name (e.g. `http://192.168.1.10:8000`, `http://buggregator:8000`), the
> browser does not offer to install it. The icon counter needs a browser with the Badging API (Chromium-based on
> Windows and macOS); elsewhere it is simply not shown.

---

## Contributing

We enthusiastically invite you to contribute to Buggregator Server! Whether you've uncovered a bug, have innovative
feature suggestions, or wish to contribute in any other capacity, we warmly welcome your participation. Simply open an
issue or submit a pull request on our GitHub repository to get started.

> **Note**
> Read more how to contribute [here](https://docs.buggregator.dev/contributing/frontend.html)

---

## License

Buggregator is open-sourced software licensed under the BSD-4 License.

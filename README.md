# ptchina
Website: https://ptchan.org/

API documentation: [fatchan/jschan-docs](https://gitgud.io/fatchan/jschan-docs/) - Gitgud pages link: http://fatchan.gitgud.site/jschan-docs/#introduction

## Goals
- Oldschool look, newschool features
- Work with javascript disabled
- Support using anonymizers such as Tor, Lokinet or I2P
- Be usable on mobile
- Simple static file serving

## Features
- [x] Multiple language support (en-GB, pt-PT, ru-RU included)
- [x] Optional user created boards ala [infinity](https://github.com/ctrlcctrlv/infinity)
- [x] Multiple files per post
- [x] [Tegaki](https://github.com/desuwa/tegaki) applet with drawing and replays
- [x] Antispam/Anti-flood & DNSBL
- [x] 3 customisable inbuilt captchas + 2 third party captchas (hcaptcha & recaptcha)
- [x] [API documentation](https://fatchan.gitgud.site/jschan-docs/)
- [x] Built-in webring (compatible w/ [lynxchan](https://gitlab.com/alogware/LynxChanAddon-Webring) & [infinity](https://gitlab.com/Tenicu/infinityaddon-webring))
- [x] Two factor authentication (TOTP) for accounts
- [x] Manage everything from the web panel
- [x] Granular account permissions
- [x] Works properly with anonymizer networks (Tor, Lokinet, etc)
- [x] Beautiful bundled frontend with lots of themes and options, see below:

![screenshots](collage.gif "screenshots")

## License
GNU AGPLv3, see [LICENSE](LICENSE).

## Installation & Upgrading
See [INSTALLATION.md](INSTALLATION.md) for instructions on setting up a jschan instance or upgrading to a newer version.

## Changelog
See [CHANGELOG.md](CHANGELOG.md) for changes between versions.

## Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## Related Projects

Official:
 - [fatchan/jschan-docs](https://gitgud.io/fatchan/jschan-docs/) - API Documentation for jschan ([gitgud pages](https://fatchan.gitgud.site/jschan-docs/#introduction))
 - [fatchan/jschan-api-go](https://gitgud.io/fatchan/jschan-api-go) - WIP Golang API Client for jschan ([gitgud pages](https://fatchan.gitgud.site/jschan-api-go/pkg/jschan/))

Unofficial: **Not guaranteed to work or be safe, use at your own risk.**
 - [ussaohelcim/jschan-api-sdk](https://github.com/ussaohelcim/jschan-api-sdk) - JavaScript/TypeScript SDK for jschan.
 - [ussaohelcim/jschan-api-types](https://github.com/ussaohelcim/jschan-api-types) - TypeScript typings for jschan API.
 - [myumyu/globalafk](https://gitgud.io/myumyu/globalafk/) - "A simple python script that sends ugly notifications when something happens on a jschan imageboard that you moderate."


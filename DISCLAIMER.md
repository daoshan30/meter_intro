# Disclaimer

Meter Intro and its BK880 / LCR-615 Web Serial API page are provided as an experimental engineering utility and study project.

## Not official software

This project is not official software from B&K Precision or any instrument manufacturer. Product names, model names, and trademarks belong to their respective owners.

## Measurement responsibility

The software may communicate with measurement instruments through Web Serial API and SCPI-like commands. Measurement values, units, timing, tolerance status, and device behavior may vary depending on:

- Instrument model and firmware version.
- USB serial adapter or driver.
- Browser version and Web Serial API behavior.
- Operating system and serial permission handling.
- User-selected measurement settings.

Users are responsible for verifying instrument settings, calibration status, measurement conditions, and recorded values before using any result for engineering, production, quality control, or commercial decisions.

## No warranty

This project is provided "as is", without warranty of any kind. The author does not guarantee that the software will be accurate, uninterrupted, error-free, safe for every instrument, or suitable for any particular purpose.

## Hardware and data risk

Users should test with safe measurement conditions first. The author is not responsible for hardware misconfiguration, incorrect readings, data loss, production loss, or any direct or indirect damage caused by use of this software.

## Web Serial privacy note

Web Serial API requires explicit browser permission before accessing a local serial device. The website cannot access serial ports unless the user selects and authorizes a device in the browser. However, if a website is publicly deployed, its frontend JavaScript can be downloaded and inspected by visitors.

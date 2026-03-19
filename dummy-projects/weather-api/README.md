# Weather API Service

A fast, reliable weather API that provides real-time weather data and forecasts.

## Features

- Real-time weather data for any location
- 7-day weather forecasts
- Historical weather data
- Multiple data formats (JSON, XML)
- WebSocket support for live updates
- Rate limiting and caching included

## Quick Start

```bash
npm install weather-api-service
```

```javascript
const WeatherAPI = require('weather-api-service');

const weather = new WeatherAPI('your-api-key');
const data = await weather.getCurrentWeather('London');
```

## API Endpoints

- `GET /current/:location` - Current weather
- `GET /forecast/:location` - 7-day forecast
- `GET /historical/:location/:date` - Historical data
- `WS /live/:location` - Live weather updates

## Pricing

- Free tier: 1,000 requests/day
- Pro: $29/month - 100,000 requests
- Enterprise: Custom pricing

## Documentation

Full documentation available at https://weather-api.dev/docs
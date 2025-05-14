# AI Engine

A TypeScript-based AI engine that simulates personality traits, maintains memory, and interacts with external APIs. The engine runs on a schedule, processes environmental data, and maintains an activity log.

## Prerequisites

- Node.js 18+
- npm 9+
- TypeScript 5+

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd ai-engine

# Install dependencies
npm install

# Install dev dependencies
npm install --save-dev @types/jest
```

## Environment Variables

Create a `.env` file in the root directory:

```env
OPENROUTER_API_KEY=your_openrouter_api_key
WEATHER_API_KEY=your_openweathermap_api_key
```

## Folder Structure

```
ai-engine/
├── src/
│   ├── config/         # Configuration files
│   ├── services/       # External service integrations
│   ├── engines/        # Core AI components
│   ├── utils/          # Utility functions
│   └── types/          # TypeScript type definitions
├── tests/              # Unit tests
└── logs/              # Activity logs (created at runtime)
```

## Running the Engine

```bash
# Start the engine
npm start

# Run tests
npm test

# Build TypeScript
npm run build
```

## Testing

The project uses Jest for testing. Run tests with:

```bash
npm test
```

Tests are located in the `tests/` directory and cover:
- Fetcher service (time and weather)
- Personality engine (traits and hyperparameters)
- Memory engine (short-term storage)
- Logger utility (activity logging)

## Activity Log

The engine maintains an activity log in `logs/activity-log.json`. Each entry includes:

```json
{
  "timestamp": "2024-03-14T12:00:00.000Z",
  "weather": {
    "desc": "clear sky",
    "temp": 25.5
  },
  "energy": 0.8,
  "mood": 0.7,
  "thoughts": "Feeling energetic and ready to explore",
  "actions": "Taking a walk outside"
}
```

## License

MIT 
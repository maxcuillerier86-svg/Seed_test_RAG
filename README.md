# SeedGuide - AI-Powered Growing Assistant

**Lowering the barrier to growing your own food, one seed at a time.**

SeedGuide helps anyone — from complete beginners to experienced gardeners — grow their own food by providing personalized, step-by-step growing guides and connecting them with free library resources.

## Features

- **Browse Seeds** — Explore 12+ common vegetables, herbs, and fruits with full growing details
- **Personalized Growing Guides** — Tell us your space (indoor, balcony, yard, garden), experience level, and planting date to get a customized guide
- **Step-by-Step Timeline** — Every seed comes with a week-by-week growing plan so you always know what to do next
- **My Garden Planner** — Track what you're growing, see your next tasks, and monitor progress
- **Calendar Reminders** — Download .ics calendar files to get reminders in your phone/calendar app for each growing step
- **Library Resources** — Discover free seed libraries, tool lending programs, grow lights, and gardening workshops at your local library

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run the app
python app.py
```

Then open http://localhost:5000 in your browser.

## Project Structure

```
├── app.py              # Flask backend with API endpoints
├── seed_data.json      # Comprehensive seed growing database
├── requirements.txt    # Python dependencies
└── static/
    ├── index.html      # Main HTML page
    ├── styles.css      # Full responsive CSS
    └── app.js          # Frontend JavaScript application
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/seeds` | GET | List all seeds |
| `/api/seeds/<id>` | GET | Get full details for a seed |
| `/api/search?q=` | GET | Search seeds by name/category |
| `/api/guide` | POST | Generate personalized growing guide |
| `/api/schedule` | POST | Create planting schedule with dates |
| `/api/library-resources` | GET | Get library resource information |

## How It Works

1. **Browse or search** for the seed you want to grow
2. **View growing requirements** — light, water, soil, space, equipment
3. **Get a personalized guide** based on your space and experience
4. **Add to your garden** and set a planting date
5. **Follow the timeline** — the app tracks your progress and shows upcoming tasks
6. **Download calendar reminders** so you never miss a growing step
7. **Visit your library** — check for free seeds, tool lending, and classes

## Seeds Currently Available

| Seed | Category | Difficulty |
|------|----------|------------|
| Tomato | Vegetable | Beginner |
| Lettuce | Vegetable | Beginner |
| Basil | Herb | Beginner |
| Pepper | Vegetable | Intermediate |
| Cucumber | Vegetable | Beginner |
| Carrot | Vegetable | Beginner |
| Green Bean | Vegetable | Beginner |
| Strawberry | Fruit | Beginner |
| Spinach | Vegetable | Beginner |
| Radish | Vegetable | Beginner |
| Mint | Herb | Beginner |
| Zucchini | Vegetable | Beginner |

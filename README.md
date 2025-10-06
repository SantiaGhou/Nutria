# Nutri.IA

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![WhatsApp](https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)

**AI-Powered Nutrition Assistant for WhatsApp**

An intelligent nutrition bot that leverages computer vision and natural language processing to provide personalized dietary guidance through WhatsApp messaging.

[Features](#features) • [Installation](#installation) • [Configuration](#configuration) • [Usage](#usage) • [Architecture](#architecture)

</div>

---

## Overview

Nutri.IA is a professional-grade WhatsApp bot that acts as a virtual nutritionist, combining OpenAI's GPT-4 Vision API with SQLite for persistent data storage. The system provides real-time food recognition, calorie tracking, personalized meal planning, and automated reminders through a conversational interface.

## Features

### Core Capabilities

- **Computer Vision Food Recognition**: Analyzes food images using GPT-4 Vision API to identify ingredients and estimate caloric content
- **Voice Recognition**: Transcribes WhatsApp voice messages using Whisper API for hands-free interaction
- **Automated Meal Logging**: Persistent storage of daily food intake with timestamp and meal type classification
- **Conversational AI**: Context-aware dialogue system that maintains conversation history for personalized interactions
- **User Profiling**: Non-intrusive collection of biometric data (weight, height, age, gender) and fitness goals
- **Personalized Nutrition Planning**: AI-generated meal plans based on user objectives (weight loss, muscle gain, maintenance)
- **Scheduled Reminders**: Cron-based notification system for meal time alerts
- **Daily Analytics**: On-demand summary reports of caloric intake and meal patterns

### Technical Features

- Stateful conversation management with context persistence
- Local SQLite database for data persistence
- Asynchronous message processing pipeline
- QR code authentication for WhatsApp Web
- Modular architecture with separation of concerns
- Error handling and graceful degradation

## Prerequisites

- Node.js 16.x or higher
- OpenAI API account with available credits
- WhatsApp mobile application
- Active internet connection

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/SantiaGhou/nutri-ia-bot.git
cd nutri-ia-bot
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

The SQLite database is automatically created and initialized when you first run the application. No additional configuration is required.

## Configuration

### Environment Variables

Create a `.env` file in the project root with the following variable:

```env
OPENAI_API_KEY=your_openai_api_key
```

**Obtaining API Key:**

- **OpenAI API Key**:
  1. Navigate to [platform.openai.com](https://platform.openai.com)
  2. Access the API Keys section
  3. Generate a new secret key
  4. Copy and store securely

## Usage

### Starting the Bot

```bash
npm start
```

### WhatsApp Authentication

1. Execute the start command
2. A QR code will be generated in the terminal
3. Open WhatsApp on your mobile device
4. Navigate to Settings > Linked Devices > Link a Device
5. Scan the displayed QR code
6. Wait for authentication confirmation

### Interaction Patterns

**Image Analysis**
```
[User sends food image]
Bot: Identifies food items and estimates calories
Bot: "Would you like to log this meal?"
User: "yes"
Bot: Confirms meal registration
```

**Conversational Queries**
```
User: "I want to lose weight"
Bot: Collects user profile data naturally
Bot: Generates personalized recommendations
```

**Voice Messages**
```
[User sends voice message: "Acabei de comer uma salada com frango"]
Bot: Transcribes the audio and responds naturally
Bot: Asks if you want to log the meal
```

**Daily Summary**
```
User: "resumo"
Bot: Returns complete daily meal log with total calories
```

### Automated Reminders

The system sends notifications at the following times:
- **08:00** - Breakfast reminder
- **12:00** - Lunch reminder
- **16:00** - Snack reminder
- **19:00** - Dinner reminder

## Architecture

### Project Structure

```
nutri-ia-bot/
├── index.js                          # Application entry point
├── src/
│   ├── services/
│   │   ├── database.service.js      # SQLite database abstraction layer
│   │   └── openai.service.js        # AI model integration (GPT-4 Vision)
│   ├── managers/
│   │   └── conversation.manager.js  # Conversation state management
│   ├── whatsapp/
│   │   └── client.js                # WhatsApp Web.js client wrapper
│   └── reminders/
│       └── reminder.scheduler.js    # Cron-based reminder system
├── nutri-ia.db                       # SQLite database file (auto-generated)
├── .env                              # Environment configuration (gitignored)
└── package.json                      # Project dependencies
```

### Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Runtime | Node.js | JavaScript execution environment |
| Messaging | whatsapp-web.js | WhatsApp Web API client |
| AI/ML | OpenAI GPT-4o | Computer vision and NLP |
| Database | SQLite (better-sqlite3) | Local data persistence |
| Task Scheduling | node-cron | Automated reminder system |
| Authentication | LocalAuth | WhatsApp session management |

### Database Schema

The SQLite database consists of four main tables:

**users**
- Stores user profiles and biometric data
- Fields: id, phone_number, name, weight, height, age, gender, goal

**meals**
- Logs individual meal entries
- Fields: id, user_id, meal_type, food_name, calories, meal_date, meal_time

**conversation_history**
- Maintains dialogue context for each user
- Fields: id, user_id, role, content, created_at

**reminder_settings**
- Configurable meal time notifications
- Fields: id, user_id, meal_type, reminder_time, enabled

## Security

- All sensitive data stored locally in SQLite database
- API keys managed through environment variables (excluded from version control)
- End-to-end encryption for WhatsApp communications
- No plaintext storage of credentials
- Database file protected by file system permissions

## Troubleshooting

### QR Code Not Displaying

- Verify Node.js installation: `node --version`
- Ensure all dependencies are installed: `npm install`
- Check terminal supports QR code rendering

### OpenAI Authentication Failure

- Validate API key format in `.env` file
- Confirm OpenAI account has available credits
- Check API key permissions and quotas

### Bot Unresponsive

- Verify internet connectivity
- Confirm WhatsApp session is active (check terminal logs)
- Verify database file has read/write permissions
- Restart the application: `npm start`

### Database Issues

- Ensure the application has write permissions in the project directory
- Check if `nutri-ia.db` file exists and is not corrupted
- If needed, delete the database file to start fresh (all data will be lost)

## Performance Considerations

- Conversation history is automatically pruned to maintain performance (keeps last 50 messages)
- Image processing uses GPT-4o with 500 token limit for optimal response time
- Reminder checks execute every 15 minutes to balance responsiveness and resource usage
- Database queries are optimized with appropriate indexes

## Contributing

This project is maintained by [@SantiaGhou](https://github.com/SantiaGhou). Contributions, issues, and feature requests are welcome.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Acknowledgments

Built with Node.js, WhatsApp Web.js, OpenAI GPT-4, and SQLite.

---

**Author**: [@SantiaGhou](https://github.com/SantiaGhou)
**Version**: 1.0.0
**Last Updated**: October 2025

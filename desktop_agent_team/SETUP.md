# 24/7 Desktop Agent Team Setup Guide

Your desktop runs a permanent AI agent team powered by DeepSeek V4-Flash, available from your laptop or phone anytime.

## Architecture

```
Your Windows Desktop (always running):
├─ CrewAI Agent Team
│  ├─ Research Analyst (find information)
│  ├─ Code Reviewer (audit code)
│  ├─ Idea Generator (brainstorm solutions)
│  ├─ Task Executor (automate work)
│  └─ Dutchie API Expert (map Dutchie POS endpoints)
└─ Flask API Server (port 5000)

Your Laptop/Phone:
└─ Send requests to: http://desktop-ip:5000
```

## Setup (Windows Desktop)

### 1. Install Python
Download Python 3.11+ from python.org, ensure "Add Python to PATH" is checked.

### 2. Create Virtual Environment
```bash
cd C:\path\to\LFOLGYTASK\desktop_agent_team
python -m venv venv
venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Get DeepSeek API Key
1. Go to https://platform.deepseek.com
2. Sign up, get API key
3. Copy the `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```
4. Edit `.env` and paste your actual API key

### 5. Run the Server
```bash
python api_server.py
```

You should see:
```
 * Running on http://0.0.0.0:5000
 * WARNING: This is a development server...
```

### 6. Keep it Running (Windows)
Create a batch file `start_agents.bat`:
```batch
@echo off
cd C:\path\to\LFOLGYTASK\desktop_agent_team
venv\Scripts\activate
python api_server.py
pause
```

Right-click → Create shortcut → Properties → Advanced → Check "Run as administrator"
Place in Windows Startup folder: `C:\Users\YourUsername\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup`

## Using the Agent Team

### From Your Laptop
```bash
# Find your desktop's IP address
# Windows: ipconfig (look for IPv4 Address)
# Then use http://DESKTOP_IP:5000

curl -X POST http://192.168.1.100:5000/agents/research \
  -H "Content-Type: application/json" \
  -d '{"topic": "latest AI trends in 2026"}'

curl -X POST http://192.168.1.100:5000/agents/brainstorm \
  -H "Content-Type: application/json" \
  -d '{"topic": "how to improve my coding workflow"}'

curl -X POST http://192.168.1.100:5000/agents/code-review \
  -H "Content-Type: application/json" \
  -d '{"code": "def hello():\n    print(\"world\")"}'
```

### From Your Phone
Install an HTTP client app (Postman, Paw, etc.) and use the same URLs.

### Available Endpoints

**GET** `/health` — Check if agent team is running

**POST** `/agents/research` — Research a topic
```json
{"topic": "quantum computing basics"}
```

**POST** `/agents/brainstorm` — Brainstorm ideas
```json
{"topic": "features for a note-taking app"}
```

**POST** `/agents/code-review` — Review code
```json
{"code": "function add(a, b) { return a + b; }"}
```

**POST** `/agents/execute` — Execute a task
```json
{"task": "Create a Python script that downloads images from a URL"}
```

**POST** `/agents/dutchie` — Query Dutchie API expert
```json
{"query": "How do I get product SKUs from the Dutchie API?"}
```

Examples:
```json
{"query": "Map the Dutchie inventory endpoint schema"}
{"query": "What authentication method does Dutchie API use?"}
{"query": "How do I integrate with Dutchie for order tracking?"}
```

**POST** `/agents/collaborate` — Multi-agent problem solving
```json
{"problem": "How to optimize a slow database query"}
```

**GET** `/agents/list` — List all available agents

## Cost Estimates

DeepSeek V4-Flash pricing: **$0.14 per million input tokens, $0.28 per million output tokens**

- Research task (typical): ~1,000 tokens input → ~1,000 tokens output = ~$0.000042
- Code review (typical): ~2,000 tokens input → ~1,500 tokens output = ~$0.000084
- Brainstorm (typical): ~500 tokens input → ~2,000 tokens output = ~$00.00070

**Daily estimate** (20 tasks): ~$0.01-0.05
**Monthly estimate**: ~$0.30-1.50

Vastly cheaper than keeping your laptop running 24/7.

## Troubleshooting

**"Connection refused"** — Desktop agent server not running, check the batch file is executing

**"API key invalid"** — Check `.env` file has correct DeepSeek API key

**"No response"** — Check firewall allows port 5000. Windows Defender might block it. Add exception if needed.

**"Agents taking too long"** — Check your internet connection. DeepSeek API can be slow during peak hours.

## Next Steps

- Add more agents with specialized roles (scheduler, analyst, debugger)
- Connect to task queue systems (Celery) for async processing
- Add authentication if exposing outside your home network
- Set up log aggregation for monitoring

## Resources

- [CrewAI Documentation](https://docs.crewai.com/)
- [DeepSeek V4 API Guide](https://api-docs.deepseek.com/news/news260424)
- [Flask Documentation](https://flask.palletsprojects.com/)

# Quick Start: Desktop Agent Team

## 60-Second Setup

1. **Get API Key**
   - Go to https://platform.deepseek.com
   - Sign up, generate API key

2. **Create .env file**
   ```bash
   copy .env.example .env
   # Edit .env and paste your API key
   ```

3. **Install & Run**
   ```bash
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   python api_server.py
   ```

4. **Test from Laptop**
   ```bash
   # Get your desktop IP: ipconfig (look for IPv4 Address)
   
   curl -X POST http://DESKTOP_IP:5000/agents/research \
     -H "Content-Type: application/json" \
     -d '{"topic": "latest AI news"}'
   ```

## Example Queries

From your laptop terminal (replace `192.168.1.100` with your desktop IP):

```bash
# Research something
python client.py --host 192.168.1.100 research "quantum computing"

# Review code
python client.py --host 192.168.1.100 code "def hello(): print('world')"

# Brainstorm ideas
python client.py --host 192.168.1.100 brainstorm "startup ideas using AI"

# Execute a task
python client.py --host 192.168.1.100 task "create a python script that fetches news"

# Check if it's running
python client.py --host 192.168.1.100 health
```

## From Your Phone

Install Postman (free app) or Paw, then:
1. Create POST request to: `http://DESKTOP_IP:5000/agents/research`
2. Set body to: `{"topic": "your topic here"}`
3. Send

## Pricing

~$0.01-0.05 per day = ~$0.30-1.50 per month

## Full Setup

See `SETUP.md` for detailed Windows startup configuration and troubleshooting.

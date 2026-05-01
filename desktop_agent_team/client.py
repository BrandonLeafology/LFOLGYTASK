#!/usr/bin/env python3
"""
Client to query your desktop agent team from anywhere
Usage: python client.py --research "AI trends"
"""

import requests
import argparse
import json
import sys

class DesktopAgentClient:
    def __init__(self, host="localhost", port=5000):
        self.base_url = f"http://{host}:{port}"

    def research(self, topic):
        """Query research agent"""
        response = requests.post(
            f"{self.base_url}/agents/research",
            json={"topic": topic},
            timeout=120
        )
        return self._handle_response(response)

    def review_code(self, code):
        """Query code review agent"""
        response = requests.post(
            f"{self.base_url}/agents/code-review",
            json={"code": code},
            timeout=120
        )
        return self._handle_response(response)

    def brainstorm(self, topic):
        """Query idea generator agent"""
        response = requests.post(
            f"{self.base_url}/agents/brainstorm",
            json={"topic": topic},
            timeout=120
        )
        return self._handle_response(response)

    def execute_task(self, task):
        """Query task executor agent"""
        response = requests.post(
            f"{self.base_url}/agents/execute",
            json={"task": task},
            timeout=120
        )
        return self._handle_response(response)

    def collaborate(self, problem):
        """Query multi-agent collaboration"""
        response = requests.post(
            f"{self.base_url}/agents/collaborate",
            json={"problem": problem},
            timeout=120
        )
        return self._handle_response(response)

    def dutchie_api(self, query):
        """Query Dutchie API expert"""
        response = requests.post(
            f"{self.base_url}/agents/dutchie",
            json={"query": query},
            timeout=120
        )
        return self._handle_response(response)

    def list_agents(self):
        """Get list of available agents"""
        response = requests.get(f"{self.base_url}/agents/list")
        return self._handle_response(response)

    def health(self):
        """Check if agent team is running"""
        response = requests.get(f"{self.base_url}/health")
        return response.status_code == 200

    def _handle_response(self, response):
        """Handle API responses"""
        if response.status_code == 200:
            data = response.json()
            return data.get("result") or data
        else:
            return f"Error: {response.status_code} - {response.text}"

def main():
    parser = argparse.ArgumentParser(description="Query your desktop agent team")
    parser.add_argument("--host", default="localhost", help="Desktop IP address")
    parser.add_argument("--port", type=int, default=5000, help="Server port")

    subparsers = parser.add_subparsers(dest="command", help="Agent command")

    research_parser = subparsers.add_parser("research", help="Research a topic")
    research_parser.add_argument("topic", help="Topic to research")

    code_parser = subparsers.add_parser("code", help="Review code")
    code_parser.add_argument("code", help="Code to review")

    idea_parser = subparsers.add_parser("brainstorm", help="Brainstorm ideas")
    idea_parser.add_argument("topic", help="Topic to brainstorm")

    task_parser = subparsers.add_parser("task", help="Execute a task")
    task_parser.add_argument("description", help="Task description")

    collab_parser = subparsers.add_parser("collaborate", help="Multi-agent collaboration")
    collab_parser.add_argument("problem", help="Problem to solve")

    dutchie_parser = subparsers.add_parser("dutchie", help="Query Dutchie API expert")
    dutchie_parser.add_argument("query", help="API-related question or mapping request")

    subparsers.add_parser("list", help="List available agents")
    subparsers.add_parser("health", help="Check if agents are running")

    args = parser.parse_args()

    client = DesktopAgentClient(host=args.host, port=args.port)

    if args.command == "research":
        print(f"Researching: {args.topic}\n")
        print(client.research(args.topic))
    elif args.command == "code":
        print(f"Reviewing code...\n")
        print(client.review_code(args.code))
    elif args.command == "brainstorm":
        print(f"Brainstorming: {args.topic}\n")
        print(client.brainstorm(args.topic))
    elif args.command == "task":
        print(f"Executing: {args.description}\n")
        print(client.execute_task(args.description))
    elif args.command == "collaborate":
        print(f"Collaborating on: {args.problem}\n")
        print(client.collaborate(args.problem))
    elif args.command == "dutchie":
        print(f"Dutchie API Expert Query: {args.query}\n")
        print(client.dutchie_api(args.query))
    elif args.command == "list":
        agents = client.list_agents()
        print(json.dumps(agents, indent=2))
    elif args.command == "health":
        if client.health():
            print("✓ Agent team is running")
        else:
            print("✗ Agent team is not responding")
            sys.exit(1)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()

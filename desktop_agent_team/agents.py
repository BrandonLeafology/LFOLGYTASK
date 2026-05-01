from crewai import Agent
from crewai_tools import tool
from datetime import datetime

research_agent = Agent(
    role="Research Analyst",
    goal="Research topics and find current information to answer questions",
    backstory="Expert at finding relevant information and summarizing complex topics",
    verbose=True,
)

code_reviewer = Agent(
    role="Code Review Specialist",
    goal="Review code for bugs, security issues, and best practices",
    backstory="Senior developer with 15 years of experience reviewing code",
    verbose=True,
)

task_executor = Agent(
    role="Task Executor",
    goal="Execute and manage tasks, write scripts, and automate workflows",
    backstory="Pragmatic engineer who turns plans into working code",
    verbose=True,
)

idea_generator = Agent(
    role="Idea Generator",
    goal="Generate creative solutions and brainstorm improvements",
    backstory="Strategic thinker who sees opportunities and novel approaches",
    verbose=True,
)

@tool("get_current_time")
def get_current_time():
    """Get the current time and date"""
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

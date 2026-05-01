from crewai import Crew, Task
from agents import research_agent, code_reviewer, task_executor, idea_generator
import os
from openai import OpenAI

class AgentTeam:
    def __init__(self):
        self.deepseek_client = OpenAI(
            api_key=os.getenv("DEEPSEEK_API_KEY"),
            base_url="https://api.deepseek.com"
        )

    def get_llm_config(self):
        """Configure DeepSeek V4-Flash as the model"""
        return {
            "model": "deepseek-v4-flash",
            "temperature": 0.7,
            "max_tokens": 2048,
        }

    def research_task(self, topic: str) -> str:
        """Research a topic"""
        task = Task(
            description=f"Research and summarize information about: {topic}",
            agent=research_agent,
            expected_output="A comprehensive summary of findings"
        )
        crew = Crew(agents=[research_agent], tasks=[task], verbose=True)
        result = crew.kickoff()
        return str(result)

    def review_code_task(self, code: str) -> str:
        """Review provided code"""
        task = Task(
            description=f"Review this code for issues:\n{code}",
            agent=code_reviewer,
            expected_output="Code review with suggestions and any found issues"
        )
        crew = Crew(agents=[code_reviewer], tasks=[task], verbose=True)
        result = crew.kickoff()
        return str(result)

    def brainstorm_task(self, topic: str) -> str:
        """Brainstorm ideas on a topic"""
        task = Task(
            description=f"Generate creative ideas and solutions for: {topic}",
            agent=idea_generator,
            expected_output="List of innovative ideas with brief explanations"
        )
        crew = Crew(agents=[idea_generator], tasks=[task], verbose=True)
        result = crew.kickoff()
        return str(result)

    def execute_task(self, task_description: str) -> str:
        """Execute a general task"""
        task = Task(
            description=task_description,
            agent=task_executor,
            expected_output="Task completion report with results"
        )
        crew = Crew(agents=[task_executor], tasks=[task], verbose=True)
        result = crew.kickoff()
        return str(result)

    def multi_agent_collaboration(self, problem: str) -> dict:
        """Have all agents collaborate on a complex problem"""
        research_task = Task(
            description=f"Research background on: {problem}",
            agent=research_agent,
            expected_output="Research findings"
        )

        ideas_task = Task(
            description=f"Based on research, brainstorm solutions for: {problem}",
            agent=idea_generator,
            expected_output="List of potential solutions"
        )

        crew = Crew(
            agents=[research_agent, idea_generator],
            tasks=[research_task, ideas_task],
            verbose=True
        )
        result = crew.kickoff()
        return {"result": str(result)}

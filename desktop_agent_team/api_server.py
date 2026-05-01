from flask import Flask, request, jsonify
from flask_cors import CORS
from crew import AgentTeam
from dotenv import load_dotenv
import logging

load_dotenv()

app = Flask(__name__)
CORS(app)

team = AgentTeam()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "Agent team is running"}), 200

@app.route('/agents/research', methods=['POST'])
def research():
    """Query the research agent"""
    try:
        data = request.json
        topic = data.get('topic', '')
        if not topic:
            return jsonify({"error": "topic required"}), 400

        result = team.research_task(topic)
        return jsonify({"agent": "research", "result": result}), 200
    except Exception as e:
        logger.error(f"Research task failed: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/agents/code-review', methods=['POST'])
def code_review():
    """Query the code review agent"""
    try:
        data = request.json
        code = data.get('code', '')
        if not code:
            return jsonify({"error": "code required"}), 400

        result = team.review_code_task(code)
        return jsonify({"agent": "code_reviewer", "result": result}), 200
    except Exception as e:
        logger.error(f"Code review failed: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/agents/brainstorm', methods=['POST'])
def brainstorm():
    """Query the brainstorm/idea generation agent"""
    try:
        data = request.json
        topic = data.get('topic', '')
        if not topic:
            return jsonify({"error": "topic required"}), 400

        result = team.brainstorm_task(topic)
        return jsonify({"agent": "idea_generator", "result": result}), 200
    except Exception as e:
        logger.error(f"Brainstorm failed: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/agents/execute', methods=['POST'])
def execute():
    """Query the task execution agent"""
    try:
        data = request.json
        task_desc = data.get('task', '')
        if not task_desc:
            return jsonify({"error": "task required"}), 400

        result = team.execute_task(task_desc)
        return jsonify({"agent": "task_executor", "result": result}), 200
    except Exception as e:
        logger.error(f"Task execution failed: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/agents/dutchie', methods=['POST'])
def dutchie_api():
    """Query the Dutchie API expert"""
    try:
        data = request.json
        query = data.get('query', '')
        if not query:
            return jsonify({"error": "query required"}), 400

        result = team.dutchie_api_task(query)
        return jsonify({"agent": "dutchie_expert", "result": result}), 200
    except Exception as e:
        logger.error(f"Dutchie API query failed: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/agents/collaborate', methods=['POST'])
def collaborate():
    """Multi-agent collaboration on complex problems"""
    try:
        data = request.json
        problem = data.get('problem', '')
        if not problem:
            return jsonify({"error": "problem required"}), 400

        result = team.multi_agent_collaboration(problem)
        return jsonify({"agents": ["research", "idea_generator"], "result": result}), 200
    except Exception as e:
        logger.error(f"Collaboration failed: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/agents/list', methods=['GET'])
def list_agents():
    """List available agents"""
    agents = [
        {
            "name": "Research Analyst",
            "endpoint": "/agents/research",
            "description": "Research topics and find information"
        },
        {
            "name": "Code Review Specialist",
            "endpoint": "/agents/code-review",
            "description": "Review code for bugs and improvements"
        },
        {
            "name": "Idea Generator",
            "endpoint": "/agents/brainstorm",
            "description": "Generate creative ideas and solutions"
        },
        {
            "name": "Task Executor",
            "endpoint": "/agents/execute",
            "description": "Execute tasks and automate workflows"
        },
        {
            "name": "Dutchie API Expert",
            "endpoint": "/agents/dutchie",
            "description": "Map Dutchie POS API endpoints and data schemas"
        }
    ]
    return jsonify({"agents": agents}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)

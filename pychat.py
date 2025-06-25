#                                           Back End for Chat Page
#                                              author: Jerrod G
from flask import Flask, request, jsonify
from flask_cors import CORS
import openai
from openai import OpenAI
import logging
import os
from dotenv import load_dotenv

#Get started ----> source pythonvenv/bin/activate
#----------------> python3 pychat.py

# Load environment variables from .env file if available
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Setup logging
logging.basicConfig(level=logging.INFO)

# Ensure your OpenAI API key is set as an environment variable
api_key = os.getenv('NEXT_PUBLIC_APIKEY') | "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"  # Ensure the environment variable is set correctly


# Initialize the OpenAI client
client = OpenAI(api_key=api_key)


if api_key is None:
    raise ValueError("OpenAI API key not found. Please set it as an environment variable.")

# Initialize the OpenAI client
openai.api_key = api_key
messages = []
tutorial = "Welcome to your virtual math tutor! Change the math topic of interest by clicking the text at the top of this page.  Use the buttons to enter an equation and open the controls to have it solved for you.  You can edit your equation, or enter a new one by clicking on it when it appears on top of the page.  Use the 'Start Lecture' button to receive a full overview of the topic you selected.  If you want to learn more, ask questions in the message bar.  Study well!"

@app.route('/message', methods=['POST'])
def answerMessage():
    data = request.get_json()  # Get JSON data from the request
    inputText = data['inputText']  # Extract the topic from the JSON data
    chat_completion = client.chat.completions.create(
    messages=[{"role": "system", "content": 
               "Respond to this message and provide helpful math lessons to the user, "+
               "who is a high school student: "+inputText+".  If this message is not math related, "+
               "remind the user to ask math related questions.  If the user does not know what to do,"+
               " or asks for a tutorial, say this: " + tutorial}],
    model="gpt-4",
    #stream=True
    )
    AIanswer = chat_completion.choices[0].message.content.strip()
    return jsonify({"airesponse": AIanswer}), 200

@app.route('/lecture', methods=['POST'])
def giveLecture():
    data = request.get_json()  # Get JSON data from the request
    topic = data['topic']  # Extract the topic from the JSON data
    chat_completion = client.chat.completions.create(
    messages=[{"role": "system", "content": "Briefly explain any math related topic the user " + 
               "provides.  If the provided topic is not math related, " +
               "tell the user to stay focused and ask a math related question.  "+
               "If there is no topic, tell the user to enter one by clicking the text at "+
               "the top of the page.  The topic is: (" + topic +")"}],
    model="gpt-4",
    #stream=True
    )
    AIanswer = chat_completion.choices[0].message.content.strip()
    return jsonify({"airesponse": AIanswer}), 200

@app.route('/generate', methods=['POST'])
def generateMath():
    data = request.get_json()  # Get JSON data from the request
    topic = data['topic']  # Extract the topic from the JSON data
    chat_completion = client.chat.completions.create(
    messages=[{"role": "system", "content": "Generate a math problem based on this topic: " + topic}],
    model="gpt-4",
    )
    AIanswer = chat_completion.choices[0].message.content.strip()
    return jsonify({"airesponse": AIanswer}), 200

@app.route('/hint', methods=['POST'])
def giveHint():
    data = request.get_json()  # Get JSON data from the request
    equation = data['equation']  # Extract the topic from the JSON data
    chat_completion = client.chat.completions.create(
    messages=[{"role": "system", "content": 
               "Give a hint for taking the first step toward solving this "+
               "math problem.  Do not give away the answer: " + equation}],
    model="gpt-4",
    )
    AIanswer = chat_completion.choices[0].message.content.strip()
    return jsonify({"airesponse": AIanswer}), 200

@app.route('/step', methods=['POST'])
def takeStep():
    data = request.get_json()  # Get JSON data from the request
    equation = data['equation']  # Extract the topic from the JSON data
    convertedSteps = data['convertedSteps']
    chat_completion = client.chat.completions.create(
    messages=[{"role": "system", "content": 
               "Explain only one step toward solving this math problem: " + equation +
               ".  If it is an equation, perform only one operation. These are the previous steps: ("+
               convertedSteps+")  If this space is empty, explain the first step to solving the math problem."}],
    model="gpt-4",
    )
    AIanswer = chat_completion.choices[0].message.content.strip()
    return jsonify({"airesponse": AIanswer}), 200

@app.route('/solve', methods=['POST'])
def quickSolve():
    data = request.get_json()  # Get JSON data from the request
    equation = data['equation']  # Extract the topic from the JSON data
    chat_completion = client.chat.completions.create(
    messages=[{"role": "system", "content": 
               "Solve the following math problem: " + equation}],
    model="gpt-4",
    )
    AIanswer = chat_completion.choices[0].message.content.strip()
    return jsonify({"airesponse": AIanswer}), 200

@app.errorhandler(Exception)
def handle_exception(e):
    response = {
        "error": str(e),
        "description": "An error occurred during the request."
    }
    logging.error(f"Error: {e}")
    return jsonify(response), 500

if __name__ == "__main__":
    app.run(debug=True)  # For production, you should run the app using a WSGI server like Gunicorn

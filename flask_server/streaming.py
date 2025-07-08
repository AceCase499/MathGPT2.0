import os
import openai
import json
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API"))
#openai.api_key = os.getenv("OPENAI_API")

app = FastAPI()
tutorial = "Welcome to your virtual math tutor! Change the math topic of interest by ",
"clicking the text at the top of this page.  Use the buttons to enter an equation, and choose ",
"to step through the problem or solve it instantly with the buttons provided.  You can edit your ",
"equation, or enter a new one by clicking on it when it appears on top of the page.  Use the 'Start ",
"Lecture' button to receive a full overview of the topic you selected.  If you want to learn more, ask ",
"questions in the message bar.  Study well!"
renderMath = "Please write math expressions inside dollar signs like this: ",
"$single line math expression$, $$multi-line math expression$$."
lecturePrompt = "Provide a short lecture about the math topic the user ",
"provides. ",renderMath," If the provided topic is not math related, ",
"encourage the user to stay focused and ask a math related question. ",
"If there is no topic provided, tell the user to click the text at the top of the page that ",
"reads, 'Enter a Math Topic Here.' Doing so will open a dialogue box where ",
"the user can enter a math topic to study."
#PersonalBio = select user's bio from supabase data and load it here

# CORS setup for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            parsed = json.loads(data)

            messages = parsed.get("messages", [])
            objective = parsed.get("objective", "")
            topic = parsed.get("topic", "")

            if objective == "lecture":
                sys_msg = f'''{lecturePrompt} The topic is: {topic}.'''
                messages.insert(0, {"role": "system", "content": sys_msg})
            
            if objective == "generalChat":
                sys_msg = f'''You are a math tutor. Read the conversation between the user and 
                the chatbot and respond to the last thing the user said. Only respond if the question is math related. 
                {renderMath} If the user seems confused or asks for a tutorial, say this: {tutorial}'''
                messages.insert(0, {"role": "system", "content": sys_msg})

            if objective == "continueLecture":
                sys_msg = f'''You are a math tutor. Read the conversation between the user and the chatbot and continue 
                lecturing the user about the following topic: {topic}. Use real world examples, or give a fun fact related to the topic.'''
                messages.insert(0, {"role": "system", "content": sys_msg})

            async def stream_openai():
                try:
                    response = client.chat.completions.create(
                        model="gpt-4.1",
                        messages=messages,
                        stream=True
                    )
                    for chunk in response:
                        delta = chunk.choices[0].delta.content if chunk.choices[0].delta.content else ""
                        if delta:
                            await websocket.send_text(json.dumps({
                                "chunk": delta,
                                "objective": "stepstep" if objective == "lecture" else "newProb"
                            }))
                except Exception as e:
                    await websocket.send_text(json.dumps({
                        "chunk": f"\n[Error]: {str(e)}",
                        "objective": "error"
                    }))

            await stream_openai()

    except WebSocketDisconnect:
        print("Client disconnected")

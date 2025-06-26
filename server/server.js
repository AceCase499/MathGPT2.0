const express = require("express");
const http = require("http");
const { WebSocketServer } = require("ws");
const OpenAI = require("openai");
const { object } = require("zod");
const { render } = require("katex");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_MATHGPTKEY });
const tutorial = "Welcome to your virtual math tutor! Change the math topic of interest by "+
  "clicking the text at the top of this page.  Use the buttons to enter an equation, and choose "+
  "to step through the problem or solve it instantly with the buttons provided.  You can edit your "+
  "equation, or enter a new one by clicking on it when it appears on top of the page.  Use the 'Start "+
  "Lecture' button to receive a full overview of the topic you selected.  If you want to learn more, ask "+
  "questions in the message bar.  Study well!"
const renderMath = "Please write math expressions inside dollar signs like this: "+
  "$single line math expression$, $$multi-line math expression$$."


async function generalChat(ws, messages){
  try {
      messages.unshift({role: "system", 
        content: "You are a math tutor. Read the conversation and respond to the "+
        "last thing the user wrote. If what they said is not related to math, encourage "+
        "them to stay focused and remind them to ask only math related questions. "+ renderMath+
        " If the user does not know what to do, or asks for a tutorial, say this: " + tutorial})
      const stream = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: messages,
        stream: true,
      });

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) {
        ws.send(
          JSON.stringify({
            chunk: delta,
            objective: 'chat',
          })
        );
      }
    }
  } catch (err) {
    ws.send(
      JSON.stringify({
        chunk: `Error processing your request — ${err.message}`,
        objective: 'error',
      })
    );
  }
}

async function lecture(ws, topic){
  var prompt = "Provide a short lecture about the math related topic the user "+ 
    "provides. "+renderMath+" If the provided topic is not math related, "+
    "encourage the user to stay focused and ask a math related question. "+
    "If there is no topic provided, tell the user to click the white text at the top of the page that "+
    "reads, 'Enter a Math Topic Here.' Doing so will open a dialogue box where "+
    "the user can enter a math topic to study."
  try {
      const stream = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [{role: "system", content: prompt}, {role: "user", content: topic}],
        stream: true,
      });

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) {
        ws.send(
          JSON.stringify({
            chunk: delta,
            objective: 'lecture',
          })
        );
      }
    }
  } catch (err) {
    ws.send(
      JSON.stringify({
        chunk: `Error processing your request — ${err.message}`,
        objective: 'error',
      })
    );
  }
}

async function giveHint(ws, equation){
  var prompt = "Give a hint that will help the user solve a math problem that they provided. "+
    "Do not solve the math problem. "+renderMath+" If their input is not math related, encourage them to stay "+
    "focused on math. Tell them to enter a math equation by clicking the white text at the top of the page, "+
    "and typing an equation in the dialogue box that appears."
  try {
      const stream = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [{role: "system", content: prompt}, {role: "user", content: equation}],
        stream: true,
      });

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) {
        ws.send(
          JSON.stringify({
            chunk: delta,
            objective: 'hint',
          })
        );
      }
    }
  } catch (err) {
    ws.send(
      JSON.stringify({
        chunk: `Error processing your request — ${err.message}`,
        objective: 'error',
      })
    );
  }
}

async function generateProb(ws, topic){
  var prompt = "Generate a math problem based on the user's selected math topic. "+
        "Only respond with the math problem. "+renderMath+" If the topic is not related to math, say "+
        "(This topic is not related to math. Enter another topic.)"
  try {
      const stream = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [{role: "system", content: prompt}, {role: "user", content: topic}],
        stream: true,
      });

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) {
        ws.send(
          JSON.stringify({
            chunk: delta,
            objective: 'newProb',
          })
        );
      }
    }
  } catch (err) {
    ws.send(
      JSON.stringify({
        chunk: `Error processing your request — ${err.message}`,
        objective: 'error',
      })
    );
  }
}

async function solveInSteps(ws, steps, Equation){
  try {
      steps.unshift(
        {role: "system", 
        content: "Help the user solve a math problem they provided. "+
          "Read through the following messages, then explain the next step toward solving the problem. "+
          "Only explain one step, for example one operation.  Only give away the answer on the final step. "+renderMath},
        {role: "user", content: Equation})
        
      const stream = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: steps,
        stream: true,
      });

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) {
        ws.send(
          JSON.stringify({
            chunk: delta,
            objective: 'stepstep',
          })
        );
      }
    }
  } catch (err) {
    ws.send(
      JSON.stringify({
        chunk: `Error processing your request — ${err.message}`,
        objective: 'error',
      })
    );
  }
}

async function quickSolve(ws, Equation){
  try {
      const prompt = "Solve the math problem the user provides. "+renderMath
      const stream = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [{role: "system", content: prompt}, {role: "user", content: Equation}],
        stream: true,
      });

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) {
        ws.send(
          JSON.stringify({
            chunk: delta,
            objective: 'solve',
          })
        );
      }
    }
  } catch (err) {
    ws.send(
      JSON.stringify({
        chunk: `Error processing your request — ${err.message}`,
        objective: 'error',
      })
    );
  }
}

wss.on("connection", (ws) => {
  ws.on("message", async (inputData) => { //ws.on("message", async function incoming(inputData) => {
    const parsedData = JSON.parse(inputData);
    //const { messageHistory, objective, topic } = parsedData;
    var messages = parsedData.messages
    var objective = parsedData.objective
    var Topic = parsedData.Topic
    var Equation = parsedData.Equation

    switch (objective) {
      case "generalChat":
        generalChat(ws, messages)
        break;

      case "lecture":
        lecture(ws, Topic)
        break;
        
      case "stepstep":
        solveInSteps(ws, messages, Equation)
        break;

      case "generateProb":
        generateProb(ws, Topic)
        break;

      case "solve":
        quickSolve(ws, Equation)
        break;

      case "hint":
        giveHint(ws, Equation);
        break;
      default:
        ws.send("Backend Error: foriegn objective");
      }
  });
});

server.listen(3001, () => console.log("Server running on port 3001"));
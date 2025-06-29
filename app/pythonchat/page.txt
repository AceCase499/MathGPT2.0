//                                                Chat/Lecture/Practice Page
//author: Jerrod G
'use client'
import React, { useRef, useEffect, useState, use } from 'react';
import Image from 'next/image'

export default function NewChat(
  props: {
    searchParams: Promise<{
      FirstChat: string
      //cast incoming ints and floats as such, they will arrive as strings by default
    }>
  }
) {
  const searchParams = use(props.searchParams);
  const [InputText, setInputText] = useState('')
  const [currentBotResponse, setCurrentBotResponse] = useState('Something'); // Temporary storage for streaming response
  const [InpEnabled, ttginp] = useState(true) //true = enabled, false = disabled
  const [Topic, setTopic] = useState(searchParams.FirstChat)
  const [Equation, setEquation] = useState('')
  const [Lecture, tggLecture] = useState(false)
  const [Practice, tggPractice] = useState(false)
  const [ws, setWs] = useState(null);

  const [SolutionSteps, setSolutionStep] = useState([''])
  // an array to keep track of every step toward solving the current equation
  //resets when a new equation is entered

  const [ChatStream, setChatStream] = useState([{role: "user", content: "User Test"}, {role: "assistant", content: "Assistant Test"}, {role: "system", content: "System Test"}])

  useEffect(() => {
  const socket = new WebSocket("http://localhost:3001/"); // Change as needed
  setWs(socket);

  socket.onmessage = (event) => {
    const chunk = event.data;
    setCurrentBotResponse(prev => prev + chunk);  // Accumulate chunks
    scroll()
  };

  socket.onclose = () => {
    if (currentBotResponse) {
      setChatStream(prev => [...prev, { role: "assistant", content: currentBotResponse }]);
      setCurrentBotResponse(""); // Clear buffer
    }
  };

  return () => {
    socket.close();
  };
}, []);



  const chatContainer = useRef<HTMLDivElement>(null) //sets up a new chatContainer that is used in the second approach

  function scroll() {
    const { offsetHeight, scrollHeight, scrollTop } =
      chatContainer.current as HTMLDivElement
    if (scrollHeight >= scrollTop + offsetHeight) {
      chatContainer.current?.scrollTo(0, scrollHeight + 200)
    }
  }

  const disabledcss =
    'inputBar cursor-pointer rounded-full border bg-zinc-500 p-4 hidden md:block'
  const enabledcss =
    'inputBar cursor-pointer rounded-full border bg-white p-4 hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900 hidden md:block'
  const botDiv = 'divconfig p-3 border-slate-100 border-2 rounded-lg'
  const userDiv = 'divconfig p-3 border-blue-400 border-2 rounded-lg'
  /*   const openai = new OpenAI({
    apiKey: 'paste api key here',
    dangerouslyAllowBrowser: true //IMPLEMENT A SAFER WAY TO PROMPT CHATGPT BEFORE WE LAUNCH, THIS METHOD CREATES VULNERABILITIES FOR THE WHOLE APP
  }) */
  //connect home page and topic select to new chat page
  //next config
  //chain of thought prompting for AI: Ask AI to give YOU a prompt to solve a problem,
  //break up the problem into smaller problem that gpt can handle

  async function setNewTopic() {
    ttginp(false)
    let newTopic = prompt(
      'Enter a math topic to learn about:', //prompt
      'Nonlinear Functions' //placeholder
    )
    if (newTopic !== null && newTopic !== '') {
      //only set a new topic if the user inputs a nonempty string
      setTopic(newTopic)
      tggLecture(false)
      tggPractice(false)

      setChatStream(
        ChatStream.concat(
          //add to the chat stream
          'System: Topic was changed to ' + newTopic + '.<br/><br/>'
        )
      )
      /* convo.push(
        convo.length + 1,
        'System',
        'System: Topic was changed to ' + newTopic + '.<br/><br/>'
      ) */
      //save new chat to conversation
      ttginp(true) //enable chat bar
    }
  }

  function changeEquation() {
    let newEQ = prompt('Enter a math equation to solve:')
    if (newEQ !== null && newEQ !== '') {
      setEquation(newEQ)
      setSolutionStep(['']) //reset steps when a new equation is entered
    }
  }

  const startLecture = async (e: React.FormEvent) => {
    e.preventDefault() // Prevent form default behavior
    tggLecture(true) // Toggle lecture state
    tggPractice(false) // Toggle practice state
    ttginp(false) // disable chat bar

    try {
      const response = await fetch('http://localhost:5000/lecture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json' // Set the Content-Type header to application/json
        },
        body: JSON.stringify({ topic: Topic }) // Ensure topic is sent correctly
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setChatStream(ChatStream.concat('Bot: ' + data.airesponse + '<br/><br/>')) // Update chat stream with bot's response
      ttginp(true) //enable chat bar
    } catch (error) {
      console.error('Error:', error)
    }
  }

  async function generateProb() {
    tggLecture(false) // Toggle lecture state
    tggPractice(true) // Toggle practice state

    try {
      const response = await fetch('http://localhost:5000/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json' // Set the Content-Type header to application/json
        },
        body: JSON.stringify({ topic: Topic }) // Ensure topic is sent correctly
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setChatStream(ChatStream.concat('Bot: ' + data.airesponse + '<br/><br/>')) // Update chat stream with bot's response
      setEquation(data.airesponse)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  async function giveHint() {
    ttginp(false)
    try {
      const response = await fetch('http://localhost:5000/hint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json' // Set the Content-Type header to application/json
        },
        body: JSON.stringify({ equation: Equation }) // Ensure equation is sent correctly
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setChatStream(ChatStream.concat('Bot: ' + data.airesponse + '<br/><br/>')) // Update chat stream with bot's response
      ttginp(true)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  async function stepStep() {
    ttginp(false)
    const convertedSteps = SolutionSteps.toString()
    try {
      const response = await fetch('http://localhost:5000/step', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json' // Set the Content-Type header to application/json
        },
        body: JSON.stringify({ equation: Equation, convertedSteps }) // Ensure equation is sent correctly
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      //katex.rendertostring('  Bot: ' + data.airesponse + '  ')
      setChatStream(ChatStream.concat('Bot: ' + data.airesponse + '<br/><br/>')) // Update chat stream with bot's response
      SolutionSteps.push(data.airesponse)
      ttginp(true)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  async function quickSolution() {
    ttginp(false) //disable chat bar
    try {
      const response = await fetch('http://localhost:5000/solve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json' // Set the Content-Type header to application/json
        },
        body: JSON.stringify({ equation: Equation }) // Ensure equation is sent correctly
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setChatStream(ChatStream.concat('Bot: ' + data.airesponse + '<br/><br/>')) // Update chat stream with bot's response
      ttginp(true)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  async function generalMessage(e: React.FormEvent) {
    e.preventDefault() // Prevent form default behavior
    setInputText('')
    ttginp(false)
    try {
      const response = await fetch('http://localhost:3001/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json' // Set the Content-Type header to application/json
        },
        body: JSON.stringify({ inputText: InputText }) // Ensure Input Text is sent correctly
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json() //data holds the output json

      setChatStream(
        ChatStream.concat(
          'You: ' +
            InputText +
            '<br/><br/>Bot: ' +
            data.airesponse +
            '<br/><br/>'
        )
      ) // Update chat stream with bot's response
    } catch (error) {
      console.error('Error:', error)
    }
    ttginp(true)
  }

  const renderResponse = () => {
    //prompt ai and stream the response, has issues
    return (
      <div className="response">
        {ChatStream.map((m, index) => (
          <div
            key={m.id}
            className={`chat-line ${m.role === 'user' ? 'user-chat' : 'ai-chat'}`}
          >
            <Image
              className="avatar"
              alt="avatar"
              src={m.role === 'user' ? '/user.png' : '/bot.png'}
              width={30}
              height={30}
            />
            <div style={{ width: '100%', marginLeft: '16px' }}>
              <p className="message">{m.content}</p>
              {index < ChatStream.length - 1 && (
                <div className="horizontal-line" />
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  function getBubbleStyle(role, inout){ //if true, get inner CSS, if false, get outer CSS
    if (role == "system"){
      if (inout){
        return "systemInner"
      } else{
        return "systemOuter"
      }
    }
    if (role == "user"){
      if (inout){
        return "userInner"
      } else{
        return "userOuter"
      }
    } else {
      if (inout){
        return "assistantInner"
      } else{
        return "assistantOuter"
      }
    }
  }

  return (
    <>
      {/* <InlineMath>\( \int f(x) dx \)</InlineMath> [could not get kaTex to work]
      <br />
      <InlineMath>$$ \int f(x) dx $$</InlineMath> */}
      <div className="splitsub left bg-slate-950 text-xl h-full">
        {' '}
        {/* This div holds the left panel */}
        <br />
        <br />
        <br />
        <h1 className="text-blue-400 font-extrabold">Previous Sessions:</h1>
        <br />
        <div></div>
        {/*Previous Topics loaded in from database are placed here*/}
      </div>
      <div className="splitmain right text-lg margin-top: 50px;">
        {' '}
        {/* This div holds the right panel */}
        <br />
        <br />
        <center>
          {!Topic ? (
            <button className="text-xl font-extrabold" onClick={setNewTopic}>
              Enter a Math Topic Here
            </button>
          ) : (
            <button className="text-xl font-extrabold" onClick={setNewTopic}>
              {Topic}
            </button>
          )}
          <br />
          {Equation !== '' && (
            <button onClick={changeEquation}>{Equation}</button>
          )}
          {Lecture && (
            <h1 className="font-style: italic">{'(lecture mode)'}</h1>
          )}
          {Practice && (
            <h1 className="font-style: italic">{'(practice mode)'}</h1>
          )}
          <br />
          <br />

          <div ref={chatContainer} style={{flex: 1, overflowY: "scroll", maxHeight: 350}}> {/* //This div streams the response in real time, couldn't finish it in time */}
            {ChatStream.map((txt, index) => (
            <div id={index.toString()} key={index} className={getBubbleStyle(txt.role, false)}> {/* Setting the id prevents warnings/errors from the map function, otherwise it in not important*/}
              <div className={getBubbleStyle(txt.role, true)}>
                <p id={index.toString()}>
                  {txt.content}
                </p>
              </div>
            </div>
          ))}

          {currentBotResponse != "" && <div className="assistantOuter"> {/* Setting the id prevents warnings/errors from the map function, otherwise it in not important*/}
              <div className="currentInner">
                <p>
                  {currentBotResponse}
                </p>
              </div>
            </div>}
            {/* {ChatStream.map((m, index) => (
          <div
            key={m.id}
            className={`chat-line ${m.role === 'user' ? 'user-chat' : 'ai-chat'}`}
          >
            <Image
              className="avatar"
              alt="avatar"
              src={m.role === 'user' ? '/user.png' : '/bot.png'}
              width={30}
              height={30}
            />
            <div style={{ width: '100%', marginLeft: '16px' }}>
              <p className="message">{m.content}</p>
              {index < ChatStream.length - 1 && (
                <div className="horizontal-line" />
              )}
            </div>
          </div>
        ))} */}
          </div>
          
          {/* <div
            id="stream"
            className={userDiv}
            dangerouslySetInnerHTML={{ __html: ChatStream }}
            a temporary solution to display messages on the screen, with potential for html and css 
          >
            { {chatStream} }
          </div> */}
          <br />
          {Equation !== '' ? (
            <div className="cursor-pointer rounded-lg border sm:block  bg-white p-1 hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900">
              {/* These buttons only appear when the user inputs a math problem to solve, 
              or lets ai generate one */}
              <button className="px-4 border rounded-lg" onClick={giveHint}>
                Hint
              </button>
              <button className="px-4 border rounded-lg" onClick={stepStep}>
                Solve in Steps
              </button>
              <button
                className="px-4 border rounded-lg"
                onClick={quickSolution}
              >
                Quick Solution
              </button>
            </div>
          ) : (
            <button
              onClick={changeEquation}
              className="cursor-pointer rounded-lg border sm:block  bg-white p-1 hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900"
            >
              Enter an Equation
            </button>
          )}
          {!Practice && Topic && (
            <button
              className="cursor-pointer rounded-lg border sm:block  bg-white p-1 hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900"
              onClick={() => {
                tggPractice(true)
                tggLecture(false)
                generateProb()
              }}
            >
              Generate a Problem
            </button>
          )}
          <form onSubmit={startLecture}>
            <div>
              {!Lecture && (
                <button className="cursor-pointer rounded-lg border sm:block  bg-white p-1 hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900">
                  Start Lecture
                </button>
              )}
            </div>
          </form>
          <form onSubmit={/* handleSubmit */ generalMessage}>
            {/* handleSubmit and handleInputChange are used to stream ai response in real time*/}
            <input
              type="text"
              id="messageinp"
              value={InputText}
              disabled={!InpEnabled}
              placeholder="Message MathGPT"
              onChange={
                e => setInputText(e.target.value) /* handleInputChange */
              }
              className={InpEnabled ? enabledcss : disabledcss}
            />
          </form>
        </center>
      </div>
    </>
  )
}

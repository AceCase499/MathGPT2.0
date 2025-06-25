//                                                Chat/Lecture/Practice Page
//author: Jerrod G
'use client'
'--jsx'
import React, { useRef, useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';


export default function jsChat(){
  //const { initialTopic } = await searchParams
  //cast incoming ints and floats as such, they will arrive as strings by default
  const [InputText, setInputText] = useState('')
  const [currentBotResponse, setCurrentBotResponse] = useState(''); // Temporary storage for streaming response
  const [InpEnabled, ttginp] = useState(true) //true = enabled, false = disabled
  const [Topic, setTopic] = useState('')
  const [Equation, setEquation] = useState('')
  const [Lecture, tggLecture] = useState(false)
  const [Practice, tggPractice] = useState(false)
  const [ws, setWs] = useState(null);
  const markdownTest = `
The product of matrices is:

$$
AB = \\begin{pmatrix} 2 & 3 \\\\ 1 & 4 \\end{pmatrix} \\begin{pmatrix} 5 & 2 \\\\ 0 & 1 \\end{pmatrix}
$$
`;

  const [SolutionSteps, setSolutionSteps] = useState([])
  const [CurrentStep, setCurrentStep] = useState('')
  //give buttons and text input absolute position, and justify bottom middle CSS
  // an array to keep track of every step toward solving the current equation
  //resets when a new equation is entered

  const [ChatStream, setChatStream] = useState([{role: "assistant", content: "Welcome to your virtual math tutor! How can I help you study today?"}])

    useEffect(() => {
      const socket = new WebSocket("ws://localhost:3001/"); // Change as needed
    //const socket = new WebSocket("http://localhost:3001/");
    setWs(socket);
  
    socket.onmessage = (event) => {
      try {
        const { chunk, objective } = JSON.parse(event.data);

        switch (objective) {
          case 'stepstep':
            setCurrentBotResponse((prev) => prev + chunk); //Accumulate chunks
            setCurrentStep((prev) => prev + chunk); //Accumulate chunks
            break;
          case 'newProb':
            setCurrentBotResponse((prev) => prev + chunk); //Accumulate chunks
            setEquation((prev) => prev + chunk); //Accumulate chunks
            break;
          default:
            setCurrentBotResponse((prev) => prev + chunk); //Accumulate chunks
        }
      } catch (e) {
        console.error('Malformed message from server:', e);
      } finally {
        scroll();
      }
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
  
  async function setNewTopic() {
    let newTopic = prompt(
      'Enter a math topic to learn about:', //prompt
      'Nonlinear Functions' //placeholder
    )
    if (newTopic !== null && newTopic.trim()) {
      //only set a new topic if the user inputs a nonempty string
      setTopic(newTopic)
      tggLecture(false)
      tggPractice(false)

      if (currentBotResponse.trim()) {
        setChatStream((prev) => [...prev, { role: "assistant", content: currentBotResponse }]);
        setCurrentBotResponse("");
      }
      setChatStream((prev) => [...prev, { role: "system", content: `System: The topic was changed to "${newTopic}."`, }]);
      //save new chat to conversation
      ttginp(true) //enable chat bar
    } else{
      alert("Please make sure to select a topic!")
    }
  }

  function changeEquation() {
    let newEQ = prompt('Enter a math equation to solve:')
    if (newEQ !== null && newEQ !== '') {
      setEquation(newEQ)
      setSolutionSteps([]) //reset steps when a new equation is entered
      setCurrentStep("")
    }
  }



//FIX HINT AND GENERAL CHAT
//make a copy of this project, install markdown, follow chatGPT instructions
//make distraction-proof tests for all features
//REMOVE TEST BUTTONS
//connect home page and topic select to new chat page
//next config
//chain of thought prompting for AI: Ask AI to give YOU a prompt to solve a problem,
//break up the problem into smaller problem that gpt can handle


   const startLecture = async (e: React.FormEvent) => {
    e.preventDefault() // Prevent form default behavior
    tggLecture(true) // Toggle lecture state
    tggPractice(false) // Toggle practice state
    ttginp(false) // disable chat bar

    if (ws) {
      if (currentBotResponse.trim()) {
        setChatStream((prev) => [...prev, { role: "assistant", content: currentBotResponse }]);
        setCurrentBotResponse("");
      }
      const objective = "lecture"
      ws.send(JSON.stringify({ messages: ChatStream, objective, Topic, Equation }));
      setInputText("");
      ttginp(true) //enable chat bar
    }
  }

  async function generateProb(e: React.FormEvent) {
    e.preventDefault() // Prevent form default behavior
    tggLecture(false) // Toggle lecture state
    tggPractice(true) // Toggle practice state
    ttginp(false) // disable chat bar
    setEquation("")

    if (ws) {
      if (currentBotResponse.trim()) {
        setChatStream((prev) => [...prev, { role: "assistant", content: currentBotResponse }]);
        setCurrentBotResponse("");
      }
      const objective = "generateProb"
      const output = await ws.send(JSON.stringify({ messages: ChatStream, objective, Topic, Equation }));
      setEquation(await output)
      setInputText("");
      ttginp(true) //enable chat bar
    }
  }

  async function giveHint(e: React.FormEvent) {
    e.preventDefault() // Prevent form default behavior
    tggLecture(false) // Toggle lecture state
    tggPractice(true) // Toggle practice state
    ttginp(false) // disable chat bar

    if (ws) {
      if (currentBotResponse.trim()) {
        setChatStream((prev) => [...prev, { role: "assistant", content: currentBotResponse }]);
        setCurrentBotResponse("");
      }
      const objective = "hint"
      ws.send(JSON.stringify({ messages: ChatStream, objective, Topic, Equation }));
      setInputText("");
      ttginp(true) //enable chat bar
    }
  }

  async function stepStep(e: React.FormEvent) {
    e.preventDefault() // Prevent form default behavior
    tggLecture(false) // Toggle lecture state
    tggPractice(true) // Toggle practice state
    ttginp(false) // disable chat bar

    if (!Equation.trim()){
      alert("Make sure to give an equation first!")
      ttginp(true) //enable chat bar
      return
    }
    if (ws) {
      if (CurrentStep.trim()) {
        var tempSteps = SolutionSteps
        tempSteps.push({ role: "assistant", content: CurrentStep })
        setSolutionSteps(tempSteps)
        //setSolutionSteps((prev) => [...prev, { role: "assistant", content: CurrentStep }]);
        setCurrentStep("");
      }
      if (currentBotResponse) {
        setChatStream((prev) => [...prev, { role: "assistant", content: currentBotResponse }]);
        setCurrentBotResponse("");
      }
      const objective = "stepstep"
      ws.send(JSON.stringify({ messages: SolutionSteps, objective, Equation, Topic }));
      setInputText("");
      ttginp(true) //enable chat bar
    }
  }

  async function quickSolution(e: React.FormEvent) {
    e.preventDefault() // Prevent form default behavior
    tggLecture(false) // Toggle lecture state
    tggPractice(true) // Toggle practice state
    ttginp(false) // disable chat bar

    if (ws) {
      if (currentBotResponse.trim()) {
        setChatStream((prev) => [...prev, { role: "assistant", content: currentBotResponse }]);
        setCurrentBotResponse("");
      }
      const objective = "solve"
      ws.send(JSON.stringify({ messages: ChatStream, objective, Topic, Equation }));
      setInputText("");
      ttginp(true) //enable chat bar
    }
  }

  function generalMessage (e: React.FormEvent){
    e.preventDefault() // Prevent form default behavior
    ttginp(false) // disable chat bar
    if (ws && InputText.trim()) {
      const updatedMessages = [...ChatStream, { role: "user", content: InputText }];
      if (currentBotResponse) {
        setChatStream((prev) => [...prev, { role: "assistant", content: currentBotResponse }]);
        setCurrentBotResponse("");
      }
      const objective = "generalChat"
      const topic = ""
      setChatStream((prev) => [...prev, { role: "user", content: InputText }]);
      console.log(ChatStream)
      ws.send(JSON.stringify({ messages: updatedMessages, objective, topic, Equation }));
      setInputText("");
      ttginp(true) //enable chat bar
    }
  };

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
        {/* This div holds the left panel */}
        <h1 className="text-blue-400 px-6 pt-12 font-extrabold">Previous Sessions:</h1>
        <br />
        <div></div>
        {/*Previous Topics loaded in from database are placed here*/}
      </div>
      <div className="splitmain right text-lg">
        {/* This div holds the right panel */}
        <center>
          {!Topic ? (
            <button className="py-3 text-xl font-extrabold" onClick={setNewTopic}>
              Enter a Math Topic Here
            </button>
          ):(
            <button className="py-3 text-xl font-extrabold" onClick={setNewTopic}>
              {Topic}
            </button>
          )}
          <br />
          {Equation != "" && (
            <button onClick={changeEquation}>
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {Equation}
              </ReactMarkdown>
            </button>
          )}
          {Lecture && (
            <h1 className="font-style: italic text-cyan-400">{'(lecture mode)'}</h1>
          )}
          {Practice && (
            <h1 className="font-style: italic text-cyan-400">{'(practice mode)'}</h1>
          )}

          <div ref={chatContainer} style={{boxShadow: "0 0 30px rgb(230, 230, 230)", flex: 1, overflowY: "scroll", height: "58vh"}}> {/* //This div streams the response in real time, couldn't finish it in time */}
            {ChatStream.map((txt, index) => (
            <div id={index.toString()} key={index} className={getBubbleStyle(txt.role, false)}> {/* Setting the id prevents warnings/errors from the map function, otherwise it in not important*/}
              <div className={getBubbleStyle(txt.role, true)}>
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {txt.content}
                </ReactMarkdown>
              </div>
            </div>
          ))}

          {currentBotResponse != "" && <div className="assistantOuter"> {/* Setting the id prevents warnings/errors from the map function, otherwise it in not important*/}
              <div className="currentInner">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {currentBotResponse}
                </ReactMarkdown>
              </div>
            </div>}
          </div>
        <br/>
          <div /* style={{justifyContent: "center", alignSelf: "center"}} className='w-full fixed bottom-10' */>
            {Equation !== '' ? (
              <div className="cursor-pointer rounded-lg border sm:block  bg-white p-1 hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900">
                {/* These buttons only appear when the user inputs a math problem to solve,
                or lets ai generate one */}
                <button className="cursor-pointer px-4 border rounded-lg dark:hover:bg-zinc-700" onClick={giveHint}>
                  Hint
                </button>
                <button className="cursor-pointer px-4 border rounded-lg dark:hover:bg-zinc-700" onClick={stepStep}>
                  Solve in Steps
                </button>
                <button
                  className="cursor-pointer px-4 border rounded-lg dark:hover:bg-zinc-700"
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
                onClick={generateProb}
                >
                Generate a Problem
              </button>
            )}
            <form onSubmit={startLecture}>
              <div>
                {!Lecture && (
                  <button className="cursor-pointer rounded-lg border sm:block bg-white p-1 hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-700">
                    Start Lecture
                  </button>
                )}
              </div>
            </form>
            <form onSubmit={generalMessage}>
              {/* handleSubmit and handleInputChange are used to stream ai response in real time*/}
              <input
                type="text"
                id="messageinp"
                value={InputText}
                disabled={!InpEnabled}
                placeholder="Send a message..."
                onChange={
                  e => setInputText(e.target.value) /* handleInputChange */
                }
                className={InpEnabled ? enabledcss : disabledcss}
              />
            </form>
          </div>
          </center>
      </div>
    </>
  )
}

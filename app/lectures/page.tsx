//                                                Lectures Only Page
//author: Jerrod G
//run next config
//chain of thought prompting for AI: Ask AI to give YOU a prompt to solve a problem,
//break up the problem into smaller problem that gpt can handle
//Save current session and add it to the session list when: 
//  (1)user closes the tab, (2)user loads an old session, (3)user creates a new session

'use client'
'--jsx'
import React, { useRef, useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import "../chatFormat.css"
import NavigationBar from "../../assets/components/navbar/page"

export default function jsChat(){
  const [InputText, setInputText] = useState('')
  const [currentBotResponse, setCurrentBotResponse] = useState(''); // Temporary storage for streaming response
  const [LoadedSessionName, setLoadedSessionName] = useState('New Session')
  const [InpEnabled, ttginp] = useState(true) //true = enabled, false = disabled
  const [Topic, setTopic] = useState('')
  const [Lecture, tggLecture] = useState(false)
  const [updating, tggUpdating] = useState(false)
  const [ws, setWs] = useState(null);
  const [currentSessionID, setCurrentSessionID] = useState(0)
  const markdownTest = `
The product of matrices is:
$$
AB = \\begin{pmatrix} 2 & 3 \\\\ 1 & 4 \\end{pmatrix} \\begin{pmatrix} 5 & 2 \\\\ 0 & 1 \\end{pmatrix}
$$
`;
  const [CurrentStep, setCurrentStep] = useState('')
  //give buttons and text input absolute position, and justify bottom middle CSS
  // an array to keep track of every step toward solving the current equation
  //resets when a new equation is entered

  const [ChatStream, setChatStream] = useState([{role: "assistant", content: "Let's begin a new math lesson!"}])
  const [SessionArchive, setSessionArchive] = useState(//the user's previous sessions will be loaded here
    [
      {id: 1010, name: "First Lesson", chat: [
          {role: "assistant", content: "What will you learn about?"}, 
          {role: "user", content: "Derivatives"}, 
          {role: "assistant", content: "I will now explain derivatives...."}
                                  ]
      }, 
      {id: 2020, name: "Second Lesson", chat: [
          {role: "assistant", content: "What will you learn about?"}, 
          {role: "user", content: "Logorithms"}, 
          {role: "assistant", content: "Let's begin!"}
                                  ]
      },
      {id: 3030, name: "The Other Lesson", chat: [
          {role: "assistant", content: "What will you learn about?"}, 
          {role: "user", content: "Long Division"}, 
          {role: "assistant", content: "This is what division is..."}
                                  ]
      }
    ])

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

    useEffect(() => {
      //The code will run as soon as the page loads
    }, []); // The empty array ensures this effect runs only once on mount


    useEffect(() => {
    const handleBeforeUnload = (event) => {
      // Perform actions here before the tab is closed or navigated away
      alert('User is attempting to close the tab or navigate away.');
      // For example, you could send an API call to log out the user:
      // fetch('/api/logout', { method: 'POST' });

      // To prompt the user with a confirmation message (browser-dependent):
      // event.preventDefault();
      // event.returnValue = ''; // Required for some browsers to show the prompt
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup function to remove the event listener when the component unmounts
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []); // Empty dependency array ensures this runs only once on mount


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
    'inputBar cursor-pointer rounded-full border bg-white p-4 hover:bg-zinc-200 hidden md:block'
  
  async function setNewTopic() {
    let newTopic = prompt(
      'Enter a math topic to learn about:', //prompt
      'Nonlinear Functions' //placeholder
    )
    if (newTopic !== null && newTopic.trim()) {
      //only set a new topic if the user inputs a nonempty string
      setTopic(newTopic)
      tggLecture(false)

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

   const startLecture = async (e: React.FormEvent) => {
    e.preventDefault() // Prevent form default behavior
    tggLecture(true) // Toggle lecture state
    ttginp(false) // disable chat bar

    if (ws) {
      if (currentBotResponse.trim()) {
        setChatStream((prev) => [...prev, { role: "assistant", content: currentBotResponse }]);
        setCurrentBotResponse("");
      }
      const objective = "lecture"
      ws.send(JSON.stringify({ messages: ChatStream, objective, Topic }));
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
      ws.send(JSON.stringify({ messages: updatedMessages, objective, topic }));
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

  function loadConvo(indexx){
    saveConvo()
    setCurrentSessionID(SessionArchive[indexx].id)
    let loadedChat = SessionArchive[indexx].chat
    setChatStream(loadedChat)
    setLoadedSessionName(SessionArchive[indexx].name)
    //alert(currentSessionID)
  }

  function deleteConvo(indexx){
    let tempArc = SessionArchive

    let dialogue = "Delete this chat session?";
    if(LoadedSessionName === tempArc[indexx].name){
      dialogue += "\n(This will end your current session.)"
    }
    if (confirm(dialogue) == true) {
      tggUpdating(true)
      let newArchive = SessionArchive
      newArchive.splice(indexx, 1)
      setSessionArchive(newArchive)

      const timer = setTimeout(() => {
        tggUpdating(false);
      }, 1); //wait for one nanosecond, then toggle the bool that renders the session list
      return () => clearTimeout(timer);
    } else {
      return
    }
  }

  function renameConvo(indexx){
    let newSessionName = prompt(
      'Rename this Session:', //prompt
      `${LoadedSessionName} - ${new Date().toDateString()}` //placeholder
    )

    if (newSessionName != null && newSessionName.trim()){
      tggUpdating(true)
      let tempConvo = SessionArchive
      tempConvo[indexx].name = newSessionName
      setSessionArchive(tempConvo)

      const timer = setTimeout(() => {
        tggUpdating(false);
      }, 1);//wait for one nanosecond, then toggle the bool that renders the session list
      return () => clearTimeout(timer);
    } else{
      alert("This value cannot be empty!")
    }
  }

  function getConvoIDs(){
    let IDs = []
      SessionArchive.forEach(convo => {
        IDs.push(convo.id)
      });
      return(IDs)
  }

  function newConvo(){
    saveConvo()
    let newTopic = prompt(
      'Name this Lesson. \nWhat do you want to study?', //prompt
      `New Lesson - ${new Date().toDateString()}` //placeholder
    )
    setTopic(newTopic)

    setCurrentSessionID(0)
    setChatStream([{role: "assistant", content: "Let's begin a new math lesson!"}])
  }


  function saveConvo(){
    const IDs = getConvoIDs()
    if (IDs.includes(currentSessionID)){//if this is true, do not create a new convo, overwrite the existing one
      let tempArchive = SessionArchive;
      let indexById = tempArchive.findIndex(obj => obj.id === currentSessionID);
      if (indexById < 0){
        indexById = 0
      }
      tempArchive[indexById].chat = ChatStream;
      setSessionArchive(tempArchive);
      return
    }
    //create a new convo and add it to the list of lectures
    let newID;
    do {
      newID = crypto.randomUUID();
    } while (IDs.includes(newID));
    //now we can confirm this ID is unique

    let tempArchive = SessionArchive
    tempArchive.push({id: parseInt(newID), name: `Untitled Lesson - ${new Date().toDateString()}`, chat: ChatStream})
    setSessionArchive(tempArchive)

  }

  return (
    <div>
      <NavigationBar/>
      <div className="splitsub left bg-slate-300 text-xl h-full">
        {/* This div holds the left panel */}
        <button className='underline cursor-pointer underline-offset-8' onClick={()=>newConvo()}>Start a New Lesson</button>
        <h1 className="text-blue-600 px-3 pt-3 font-extrabold">Previous Sessions:</h1>
        {/*Previous Topics loaded in from database are placed here*/}
        {!updating && SessionArchive.map((cht, index) => (
            <div id={index.toString()} key={index} style={{padding: 4, borderRadius: 20}} className='parent flex cursor-pointer bg-transparent hover:bg-indigo-300'>
            <p onClick={()=> loadConvo(index)} className='font-bold'>{cht.name}</p>
            <div className='child space-x-2'>
              <svg onClick={()=>renameConvo(index)} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil-line-icon lucide-pencil-line"><path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/><path d="m15 5 3 3"/></svg>
              <svg onClick={()=>deleteConvo(index)} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e32400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide cursor-pointer lucide-trash2-icon lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
            </div>
          </div>
          ))}
      </div>
      <div className="splitmain right text-lg">
        {/* This div holds the right panel */}
        <center>
          {!Topic ? (
            <button className="py-3 cursor-pointer text-xl font-extrabold underline underline-offset-8" onClick={setNewTopic}>
              Enter a Math Topic Here
            </button>
          ):(
            <button className="py-3 text-xl font-extrabold" onClick={setNewTopic}>
              {Topic}
            </button>
          )}
          <br />
          {Lecture && (
            <h1 className="font-style: italic text-cyan-400">{'(lecture mode)'}</h1>
          )}

          <div ref={chatContainer} style={{boxShadow: "0 0 30px rgb(160, 160, 160)", flex: 1, overflowY: "scroll", height: "55vh"}}> {/* //This div streams the response in real time, couldn't finish it in time */}
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
            <form onSubmit={startLecture}>
              <div>
                <button className="cursor-pointer rounded-lg border sm:block bg-white p-1 hover:bg-zinc-200">
                  Start Lecture
                </button>
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
    </div>
  )
}

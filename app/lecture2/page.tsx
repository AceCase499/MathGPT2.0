//                                                Lectures Only Page
//author: Jerrod G
//run next config
//chain of thought prompting for AI: Ask AI to give YOU a prompt to solve a problem,
//break up the problem into smaller problem that gpt can handle
//Save current session and add it to the session list when: 
//  (1)user closes the tab, (2)user loads an old session, (3)user creates a new session

'use client'
'--jsx'
import React, { useRef, useEffect, useState, useContext } from 'react'
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import "../chatFormat.css"
import NavigationBar from "../../assets/components/navbar/page"
import { AuthContext } from "../context/AuthContext.js";
import WaveLoader from "../components/loading"


export default function jsChat(){
  const [InputText, setInputText] = useState('')
  const [currentBotResponse, setCurrentBotResponse] = useState(''); // Temporary storage for streaming response
  const [LoadedSessionName, setLoadedSessionName] = useState('New Session')
  const [InpEnabled, ttginp] = useState(true) //true = enabled, false = disabled
  const [Topic, setTopic] = useState('')
  const [Subtopic, setSubtopic] = useState('')
  const [Lecture, tggLecture] = useState(false)
  const [updating, tggUpdating] = useState(false)
  //const [ws, setWs] = useState(null);
  const [currentLectureID, setCurrentLectureID] = useState(0)
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
  const { user } = useContext(AuthContext);
  const [ChatStream, setChatStream] = useState([{role: "assistant", content: "Let's begin a new math lecture!"}])
  const [LectureArchive, setLectureArchive] = useState(//the user's previous sessions will be loaded here
    [
      {lecture_id: 1010, topic: "First Lecture"}, 
      {lecture_id: 2020, topic: "Second Lecture"},
      {lecture_id: 3030, topic: "The Other Lecture"}
    ])

/*     useEffect(() => { //WEBSOCKET STREAMING
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
  }, []); */

    useEffect(() => {
      //The code will run as soon as the page loads
      loadFromDB()
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
      'Algebra' //placeholder
    )
    if (newTopic !== null && newTopic.trim()) {
      //only set a new topic if the user inputs a nonempty string
      setTopic(newTopic)

      if (currentBotResponse.trim()) {
        setChatStream((prev) => [...prev, { role: "assistant", content: currentBotResponse }]);
        setCurrentBotResponse("");
      }
      setChatStream((prev) => [...prev, { role: "system", content: `System: The topic was changed to "${newTopic}."`, }]);
      //save new chat to conversation
      ttginp(true) //enable chat bar
    } else{
      alert("Please make sure the topic field is not empty before starting a lecture!")
    }
  }

  async function setNewSubtopic() {
    let newTopic = prompt(
      'Enter a subtopic to focus on:', //prompt
      'Substitution Method' //placeholder
    )
    if (newTopic !== null && newTopic.trim()) {
      //only set a new topic if the user inputs a nonempty string
      setSubtopic(newTopic)

      if (currentBotResponse.trim()) {
        setChatStream((prev) => [...prev, { role: "assistant", content: currentBotResponse }]);
        setCurrentBotResponse("");
      }
      setChatStream((prev) => [...prev, { role: "system", content: `System: The subtopic was changed to "${newTopic}."`, }]);
      //save new chat to conversation
      ttginp(true) //enable chat bar
    } else{
      alert("Please make sure the subtopic field is not empty before starting a lecture!")
    }
  }

   const startLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    ttginp(false);

    /* if (!Topic.trim() || !user?.id) {
      alert("Please enter a topic and make sure you are logged in.");
      ttginp(true);
      return;
    } */
    const form = new FormData();
    Object.entries({topic: Topic, student_id: "3"}).forEach(([key, value]) => {
      form.append(key, value);
    });

    const response = await fetch('https://mathgptdevs25.pythonanywhere.com/mathgpt', {
      method: 'POST',
      body: form
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    setCurrentLectureID(data.lecture_id)
    setChatStream(prev => [...prev, { role: "assistant", content: data.lecture }]);
    scroll()
    tggLecture(true); // Enable "Continue Lecture" button

  /* try {
  } catch (error) {
    console.error('Error:', error);
    alert("Failed to start lecture. Please try again.");
  } finally {
    ttginp(true);
  } */
};

  async function continueLecture (e: React.FormEvent){
    e.preventDefault();
    ttginp(false);

    /* if (!Topic.trim() || !user?.id) {
      alert("Please enter a topic and make sure you are logged in.");
      ttginp(true);
      return;
    } */

    const form = new FormData();
    Object.entries({lecture_id: /* currentLectureID.toString() */"3", quesion: InputText}).forEach(([key, value]) => {
      form.append(key, value);
    });
    
    const response = await fetch('https://mathgptdevs25.pythonanywhere.com/mathgpt/followup', {
      method: 'POST',
      body: form
    });

    /* if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    } */
    const data = await response.json();
    console.log(data)
    setChatStream(prev => [...prev, { role: "assistant", content: data.answer }]);
    setInputText("")
    ttginp(true) //enable chat bar
  };

const testSolve = async (e: React.FormEvent) => {
    e.preventDefault();
    ttginp(false);

    const form = new FormData();
    Object.entries({session_id: "4"}).forEach(([key, value]) => {
      form.append(key, value);
    });

    const response = await fetch('https://mathgptdevs25.pythonanywhere.com/mathgpt/problem/solution', {
      method: 'POST',
      body: JSON.stringify({session_id: 4}) /* form */
    });
    const data = await response.json();
    console.log(data)
    tggLecture(true);
}

/*   const lectureContinued = async (e: React.FormEvent) => {
    e.preventDefault() // Prevent form default behavior
    ttginp(false) //disable chat bar

    const form = new FormData();
    Object.entries({topic: Topic, student_id: user.id}).forEach(([key, value]) => {
      form.append(key, value);
    });

    try {
      const response = await fetch('https://mathgptdevs25.pythonanywhere.com/mathgpt', {
      method: 'POST',
      body: form, // no need for headers; browser sets correct Content-Type
    });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      let tempChat = ChatStream
      tempChat.push({role: "assistant", content: data.lecture})
      setChatStream(tempChat) // Update chat stream with bot's response
      ttginp(true) //disable chat bar
    } catch (error) {
      console.error('Error:', error)
    }
  } */

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

  function loadLecture(lecID){
    /* setCurrentLectureID(LectureArchive[lecID].lecture_id)
    let loadedChat = LectureArchive[lecID].chat
    setChatStream(loadedChat)
    setLoadedSessionName(LectureArchive[lecID].name)
    setCurrentBotResponse("") */
    //alert(currentSessionID)
  }

  function deleteConvo(indexx){
    let tempArc = LectureArchive

    let dialogue = "Delete this chat session?";
    if(LoadedSessionName === tempArc[indexx].topic){
      dialogue += "\n(This will end your current session.)"
    }
    if (confirm(dialogue) == true) {
      tggUpdating(true)
      let newArchive = LectureArchive
      newArchive.splice(indexx, 1)
      setLectureArchive(newArchive)

      const timer = setTimeout(() => {
        tggUpdating(false);
      }, 1); //wait for one nanosecond, then toggle the bool that renders the session list
      return () => clearTimeout(timer);
    } else {
      return
    }
  }

  function renameConvo(lecID){
    let newLectureName = prompt(
      'Rename this Session:', //prompt
      `New Lesson - ${new Date().toDateString()}` //placeholder
    )
    let tempArchive = LectureArchive

    if (newLectureName != null && newLectureName.trim()){
      tggUpdating(true)
      const newArchive = tempArchive.map(obj => {
      if (obj.lecture_id == lecID) {
        return { ...obj, name: newLectureName };
      }
      return obj; // Return other objects as they are
    });
      let tempConvo = LectureArchive
      tempConvo[lecID].topic = newLectureName
      setLectureArchive(tempConvo)

      const timer = setTimeout(() => {
        tggUpdating(false);
      }, 1);//wait for one nanosecond, then toggle the bool that renders the session list
      return () => clearTimeout(timer);
    } else{
      alert("This value cannot be empty!")
    }
  }

  function getLectureIDs(){
    let IDs = []
      LectureArchive.forEach(convo => {
        IDs.push(convo.lecture_id)
      });
      return(IDs)
  }

  function newLecture(){
/*   
    let newTopic = prompt(
      'Which math topic do you want to study?', //prompt
      `New Topic - ${new Date().toDateString()}` //placeholder
    )
    setTopic(newTopic)
    let newSubtopic = prompt(
      'Enter a subtopic to focus on.', //prompt
      `Subtopic - ${new Date().toDateString()}` //placeholder
    )
    setSubtopic(newSubtopic)


    setCurrentLectureID(response.lecture_id)
    setChatStream([{role: "assistant", content: "Let's begin a new math lecture!"}]) */
  }

  async function loadFromDB(){
    ttginp(false);
    tggUpdating(true);

    const form = new FormData();
    Object.entries({ student_id: "3"}).forEach(([key, value]) => {
      form.append(key, value);
    });

    const response = await fetch('https://mathgptdevs25.pythonanywhere.com/mathgpt/lectures', {
      method: 'POST',
      body: form
    });

    /* if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    } */
    const data = await response.json();
    console.log(data)
    setLectureArchive(data)
    tggLecture(true); // Enable "Continue Lecture" button
    ttginp(true);
    tggUpdating(false)
  }

  return (
    <div>
      <NavigationBar/>
      <div className="splitsub left bg-slate-300 text-xl h-full">
        {/* This div holds the left panel */}
        <button className='underline cursor-pointer underline-offset-8' onClick={()=>newLecture()}>Start a New Lecture</button>
        <h1 className="text-blue-600 px-3 pt-3 font-extrabold">Previous Sessions:</h1>
        {/*Previous Topics loaded in from database are placed here*/}
        {!updating && LectureArchive.map((lec, index) => (
            <div id={lec.lecture_id.toString()} key={lec.lecture_id} style={{padding: 4, borderRadius: 20}} className='parent flex cursor-pointer bg-transparent hover:bg-indigo-300'>
            <p onClick={()=> loadLecture(lec.lecture_id)} className='font-bold'>{lec.topic}</p>
            <div className='child space-x-2'>
              <svg onClick={()=>renameConvo(index)} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil-line-icon lucide-pencil-line"><path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/><path d="m15 5 3 3"/></svg>
              <svg onClick={()=>deleteConvo(index)} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e32400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide cursor-pointer lucide-trash2-icon lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
            </div>
          </div>
          ))}
        <button className='underline cursor-pointer underline-offset-8' onClick={loadFromDB}>Load Lectures</button>
      </div>
      <div className="splitmain right text-lg">
        {/* This div holds the right panel */}
        <center>
          <button onClick={()=> alert(user?.id)}>Try Me</button>
          {!Topic ? (
            <button className="py-3 cursor-pointer text-xl font-extrabold underline underline-offset-8" onClick={setNewTopic}>
              Enter a Math Topic Here
            </button>
          ):(
            <p className="py-3 text-xl font-extrabold">
              {Topic}              
              <svg onClick={setNewTopic} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil-line-icon lucide-pencil-line"><path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/><path d="m15 5 3 3"/></svg>
            </p>
            
          )}
          {!Subtopic ? (
            <button className="py-3 cursor-pointer text-xl italic underline-offset-8" onClick={setNewSubtopic}>
              Enter a Subtopic Here
            </button>
          ):(
            <p className="py-3 text-xl font-extrabold">
              {Subtopic}              
              <svg onClick={setNewSubtopic} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil-line-icon lucide-pencil-line"><path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/><path d="m15 5 3 3"/></svg>
            </p>
          )}
          <button onClick={testSolve}>Solve Equation?</button>
          <br />
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

          {!InpEnabled && <div className="assistantOuter"> {/* Setting the id prevents warnings/errors from the map function, otherwise it in not important*/}
              <div className="currentInner">
                <WaveLoader></WaveLoader>
              </div>
            </div>}
          </div>
        <br/>
          <div /* style={{justifyContent: "center", alignSelf: "center"}} className='w-full fixed bottom-10' */>
            <div style={{ display: 'flex', gap: '1rem', alignItems: "center", justifyContent: "center" }}>
              
              {!Lecture ? ( 
              <div>
                <button onClick={()=>console.log("HI")/* lectureContinued */} className="cursor-pointer rounded-lg border sm:block bg-white p-1 hover:bg-zinc-200">
                  Continue Lecture
                </button>
                <button onClick={()=>console.log("HI")/* lectureContinued */} className="cursor-pointer rounded-lg border sm:block bg-white p-1 hover:bg-zinc-200">
                  New Lecture
                </button>
              </div>) : (
                <button onClick={startLecture} className="cursor-pointer rounded-lg border sm:block bg-white p-1 hover:bg-zinc-200">
                Start Lecture
                </button>
                )}
            </div>
            <form onSubmit={continueLecture}>
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

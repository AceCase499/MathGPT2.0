//                                                Lectures Only Page
//author: Jerrod G
//run next config
//chain of thought prompting for AI: Ask AI to give YOU a prompt to solve a problem,
//break up the problem into smaller problem that gpt can handle
//Save current session and add it to the session list when: 
//  (1)user closes the tab, (2)user loads an old session, (3)user creates a new session
//give buttons and text input absolute position, and justify bottom middle CSS

'use client'
'--jsx'
//export const dynamic = "force-dynamic";
import React, { useRef, useEffect, useState, useContext } from 'react'
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import "../chatFormat.css"
import NavigationBar from "../../assets/components/navbar/page"
import { AuthContext } from "../context/AuthContext";
import WaveLoader from "../components/loading"
import { useRouter } from 'next/navigation';

export default function jsChat(){
  const { user, storeEquation, equation } = useContext(AuthContext) as any;
  const router = useRouter();
  useEffect(() => {
    if (!user) {
      router.replace('/');
    } else {
      //alert(user.id+" "+user.username)
    }
  }, [user, router]);
  const [InputText, setInputText] = useState('')
  const [currentBotResponse, setCurrentBotResponse] = useState(''); // Temporary storage for streaming response
  const [InpEnabled, ttginp] = useState(true) //true = enabled, false = disabled
  const [Topic, setTopic] = useState('')
  const [Subtopic, setSubtopic] = useState('')
  const [LectureStart, tggLectureStart] = useState(false)
  const [MathEquation, setMathEquation] = useState("")
  const [updating, tggUpdating] = useState(false)
  //const [ws, setWs] = useState(null);
  const [currentLectureID, setCurrentLectureID] = useState(0)
  const markdownTest = `
The product of matrices is:
$$
AB = \\begin{pmatrix} 2 & 3 \\\\ 1 & 4 \\end{pmatrix} \\begin{pmatrix} 5 & 2 \\\\ 0 & 1 \\end{pmatrix}
$$
`;

  const [ChatStream, setChatStream] = useState([{sender: "ai", message: "Let's begin a new math lecture!"}])
  const [LectureArchive, setLectureArchive] = useState([])

    useEffect(() => {
      //The code will run as soon as the page loads
      loadLectureList()
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
        setChatStream((prev) => [...prev, { sender: "ai", message: currentBotResponse }]);
        setCurrentBotResponse("");
      }
      setChatStream((prev) => [...prev, { sender: "system", message: `System: The topic was changed to "${newTopic}."`, }]);
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
        setChatStream((prev) => [...prev, { sender: "ai", message: currentBotResponse }]);
        setCurrentBotResponse("");
      }
      setChatStream((prev) => [...prev, { sender: "system", message: `System: The subtopic was changed to "${newTopic}."`, }]);
      //save new chat to conversation
      ttginp(true) //enable chat bar
    } else{
      alert("Please make sure the subtopic field is not empty before starting a lecture!")
    }
  }

   const startLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    ttginp(false);
    //alert(Topic+" "+user.id)

    if (!Topic.trim()/* || !user?.id */) {
      alert("Please enter a topic and make sure you are logged in.");
      ttginp(true);
      return;
    }
    const form = new FormData();
    Object.entries({topic: Topic, student_id: user.id}).forEach(([key, value]) => {
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
    setChatStream(prev => [...prev, { sender: "ai", message: data.lecture }]);

    const regex = /\${1,2}([^$]+?)\${1,2}/g;
    const matches = Array.from(data.lecture.matchAll(regex));
    if (matches.length > 0) {
      const lastMatch = matches[matches.length - 1];
      /* alert(`A new math problem is available for practice:\n ${lastMatch[0]}`) */
      setMathEquation(lastMatch[0])
    }
    scroll()
    tggLectureStart(true); // Enable "Continue Lecture" button
    ttginp(true);
    loadLectureList();
};

  async function continueLecture (e: React.FormEvent){
    e.preventDefault();
    if(!InputText.trim()){
      return
    }
    ttginp(false);
  
    if (currentLectureID == 0){
      alert("Choose a topic and click the 'Start Lecture' button")
      return
    }
    if (/* !user?.id */false) {
      alert("Please make sure you are logged in.");
      ttginp(true);
      return;
    }

    const form = new FormData();
    Object.entries({lecture_id: currentLectureID.toString(), question: InputText}).forEach(([key, value]) => {
      form.append(key, value);
    });
    
    const response = await fetch('https://mathgptdevs25.pythonanywhere.com/mathgpt/followup', {
      method: 'POST',
      body: form
    });

    const data = await response.json();
    console.log(data)
    setChatStream(prev => [...prev, { sender: "ai", message: data.answer }]);

    const regex = /\${1,2}([^$]+?)\${1,2}/g;
    const matches = Array.from(data.answer.matchAll(regex));
    if (matches.length > 0) {
      const lastMatch = matches[matches.length - 1];
      /* alert(`A new math problem is available for practice:\n ${lastMatch[0]}`) */
      setMathEquation(lastMatch[0])
    }
    setInputText("")
    ttginp(true) //enable chat bar
    scroll()
  };

  function getBubbleStyle(role, inout){ //if true, get inner CSS, if false, get outer CSS
    if (role == "system"){
      if (inout){
        return "systemInner"
      } else{
        return "systemOuter"
      }
    }
    if (role == "student"){
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

  async function loadSingleLecture(lecID, lecTopic, lecSub){
    ttginp(false);
    setCurrentLectureID(lecID)
    setTopic(lecTopic)
    setSubtopic(lecSub)
    tggLectureStart(true); // Enable "Continue Lecture" button
    const form = new FormData();
    Object.entries({lecture_id: lecID.toString()}).forEach(([key, value]) => {
      form.append(key, value);
    });

    const response = await fetch('https://mathgptdevs25.pythonanywhere.com/mathgpt/session', {
      method: 'POST',
      body: form
    });
    const data = await response.json();
    setChatStream(data)
    ttginp(true);
    loadLectureList();
  }

  async function deleteLecture(lecID){
    let dialogue = "Delete this chat session?";
    if(currentLectureID == lecID){
      dialogue += "\n(This will end your current session.)"
    }
    
    if (confirm(dialogue) == true) {
      const form = new FormData();
      Object.entries({lecture_id: lecID.toString()}).forEach(([key, value]) => {
        form.append(key, value);
      });

      const response = await fetch('https://mathgptdevs25.pythonanywhere.com/mathgpt/delete', {
        method: 'POST',
        body: form
      });

      const data = await response.json();
      console.log(data)
      if (currentLectureID == lecID){
        //router.refresh();
        router.push("/lecturehome")
      } else{
        loadLectureList()
      }
    } else {
      return
    }
  }

  async function renameLecture(lecID){
    let newLectureName = prompt(
      'Rename this Lecture:', //prompt
      `New Lecture - ${new Date().toDateString()}` //placeholder
    )
    if (newLectureName != null && newLectureName.trim()){
      const form = new FormData();
      Object.entries({lecture_id: /* lecID.toString() */lecID, new_title: newLectureName}).forEach(([key, value]) => {
        form.append(key, value);
      });
      
      const response = await fetch('https://mathgptdevs25.pythonanywhere.com/mathgpt/rename', {
        method: 'POST',
        body: form
      });
      const data = await response.json();
      console.log(data)
      loadLectureList()
    }
  }

  async function loadLectureList(){
    ttginp(false);
    tggUpdating(true);

    const form = new FormData();
    Object.entries({ student_id: user.id }).forEach(([key, value]) => {
      form.append(key, value);
    });

    const response = await fetch('https://mathgptdevs25.pythonanywhere.com/mathgpt/lectures', {
      method: 'POST',
      body: form
    });
    const data = await response.json();    
    setLectureArchive(data)
    ttginp(true);
    tggUpdating(false)
  }

  async function markComplete(){
    const form = new FormData();
    Object.entries({ lecture_id: currentLectureID.toString() }).forEach(([key, value]) => {
      form.append(key, value);
    });

    const response = await fetch('https://mathgptdevs25.pythonanywhere.com/mathgpt/complete', {
      method: 'POST',
      body: form
    });
    const data = await response.json();    
    setLectureArchive(data)
  }

  function goToProblemPage(){
    storeEquation(MathEquation);
    router.push("/newproblem")
    //window.location.href = `/newproblem?Equation=${encodeURIComponent(Equation)}`
  }

  return (
    <div>
      <NavigationBar/>
      <div className="splitsub left bg-slate-300 text-xl h-full">
        {/* This div holds the left panel */}
        <p onClick={()=>router.refresh()} className="py-3 text-xl font-extrabold underline underline-offset-8">
          Start a new Lecture
        </p>
        <h1 className="text-blue-600 px-3 pt-3 font-extrabold">Previous Sessions:</h1>
        {/*Previous Topics loaded in from database are placed here*/}
        {!updating && LectureArchive.map((lec, index) => (
            <div id={lec.lecture_id.toString()} key={lec.lecture_id} style={{padding: 4, borderRadius: 20}} className='parent flex cursor-pointer bg-transparent hover:bg-indigo-300'>
            <p onClick={()=> loadSingleLecture(lec.lecture_id, lec.topic, lec.subtopic)} className='font-bold fadeTargetIn'>{lec.title}</p>
            <div className='child space-x-2'>
              <svg onClick={()=>renameLecture(lec.lecture_id)} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil-line-icon lucide-pencil-line"><path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/><path d="m15 5 3 3"/></svg>
              <svg onClick={()=>deleteLecture(lec.lecture_id)} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e32400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide cursor-pointer lucide-trash2-icon lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
            </div>
          </div>
          ))}
      </div>
      <div className="splitmain right text-lg">
        {/* This div holds the right panel */}
          {/* <button onClick={()=> alert(user?.id)}>Try Me</button> */}
          {!Topic ? (
            <button className="mx-auto w-full py-1 cursor-pointer text-xl font-extrabold underline underline-offset-8" onClick={setNewTopic}>
              Enter a Math Topic Here
            </button>
          ):(
            <p className="flex justify-center space-x-4 text-xl font-extrabold underline underline-offset-8">
              {Topic}              
              <svg onClick={setNewTopic} xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cursor-pointer lucide lucide-pencil-line-icon lucide-pencil-line"><path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/><path d="m15 5 3 3"/></svg>
            </p>
            
          )}
          {!Subtopic ? (
            <button className="mx-auto w-full py-3 cursor-pointer text-xl italic underline-offset-8" onClick={setNewSubtopic}>
              Enter a Subtopic Here
            </button>
          ):(
            <p className="flex justify-center space-x-4 italic underline-offset-8">
              {Subtopic}              
              <svg onClick={setNewSubtopic} xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cursor-pointer lucide lucide-pencil-line-icon lucide-pencil-line"><path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/><path d="m15 5 3 3"/></svg>
            </p>
          )}
        <center>
          <div ref={chatContainer} style={{boxShadow: "0 0 30px rgb(160, 160, 160)", flex: 1, overflowY: "scroll", height: "55vh"}}> {/* //This div streams the response in real time, couldn't finish it in time */}
            {ChatStream.map((chat, index) => (
              <div id={index.toString()} key={index} className={getBubbleStyle(chat.sender, false)}> {/* Setting the id prevents warnings/errors from the map function, otherwise it in not important*/}
              <div className={getBubbleStyle(chat.sender, true)+" fadeTargetIn"}>
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {chat.message}
                </ReactMarkdown>
              </div>
            </div>
          ))}

          {InpEnabled == false && <div className="assistantOuter"> {/* Setting the id prevents warnings/errors from the map function, otherwise it in not important*/}
              <div className="currentInner">
                <WaveLoader></WaveLoader>
              </div>
            </div>}
          </div>
        <br/>
          <div /* style={{justifyContent: "center", alignSelf: "center"}} className='w-full fixed bottom-10' */>
            <div style={{ display: 'flex', gap: '1rem', alignItems: "center", justifyContent: "center" }}>
              
              {LectureStart == true ? ( 
              <div className='flex space-x-2 pb-2'>
                  <button onClick={()=>renameLecture(currentLectureID)} className="cursor-pointer rounded-lg border sm:block bg-white p-1 hover:bg-zinc-200">
                    Rename This Lecture
                  </button>
                  <button onClick={()=> router.refresh()} className="cursor-pointer rounded-lg border sm:block bg-white p-1 hover:bg-zinc-200">
                    New Lecture
                  </button>
                  <button style={{borderColor: "green"}} onClick={markComplete} className="cursor-pointer rounded-lg border sm:block bg-white p-1 hover:bg-zinc-200">
                    Complete Lecture
                  </button>
              </div>) : (
                <button onClick={startLecture} className="cursor-pointer rounded-lg border sm:block bg-white p-1 hover:bg-zinc-200">
                Start Lecture
                </button>
                )}
                {/* {MathEquation.trim() != "" && 
                  <button style={{borderColor: "blue"}} onClick={goToProblemPage} className="cursor-pointer rounded-lg border sm:block bg-white p-1 hover:bg-zinc-200">
                    Solve the Math Problem
                  </button>
                  } */}
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

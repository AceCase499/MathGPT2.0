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
  const [isCopied, setIsCopied] = useState(false);
  const markdownTest = `
The product of matrices is:
$$
AB = \\begin{pmatrix} 2 & 3 \\\\ 1 & 4 \\end{pmatrix} \\begin{pmatrix} 5 & 2 \\\\ 0 & 1 \\end{pmatrix}
$$
`;
  const [audioUrl, setAudioUrl] = useState(null);
  const [ChatStream, setChatStream] = useState([{sender: "ai", message: "Let's begin a new math lecture!"}])
  const [LectureArchive, setLectureArchive] = useState([])
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

    useEffect(() => {
      if (!user){
        router.push("/")
      } else {
        loadLectureList()
      }
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

  const disabledcss =' bg-zinc-500'
  const enabledcss = " hover:bg-zinc-200"
  const inputBar = "w-[55%] border rounded-full p-4 cursor-pointer hidden md:block "
  
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

    if (!Topic.trim()) {
      alert("Please enter a math topic by click the text that reads: 'Enter a Math Topic Here'");
      ttginp(true);
      return;
    }
    const form = new FormData();
    Object.entries({topic: Topic, student_id: user?.id}).forEach(([key, value]) => {
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
    Object.entries({ student_id: user?.id }).forEach(([key, value]) => {
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

  function renderUserInput(){
    return(<ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {InputText}
                </ReactMarkdown>)
  }

  async function TTS(copyText){
    setAudioUrl(null);
    try {
      const response = await fetch('https://mathgptdevs25.pythonanywhere.com/mathgpt/texttospeech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: copyText })
      });

      if (!response.ok) {
        throw new Error('Text-to-Speech failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    } catch (error) {
      console.error('TTS Error:', error);
      alert('Failed to generate speech.');
    }
  }

  const handleCopy = async (textt) => {
        try {
          await navigator.clipboard.writeText(textt);
          setIsCopied(true);
          // Optional: Revert "Copied!" message after a short delay
          setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
          console.error('Failed to copy text: ', err);
        }
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream, {mimeType: 'audio/webm'});
    audioChunksRef.current = [];

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorderRef.current.onstop = handleStop;
    mediaRecorderRef.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  const handleStop = async () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    const response = await fetch('https://mathgptdevs25.pythonanywhere.com/mathgpt/transcribe', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    setInputText(data.text || 'Transcription failed.');
  };

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
            <div
              id={lec.lecture_id.toString()}
              key={lec.lecture_id}
              style={{ padding: 4, borderRadius: 20 }}
              className="parent flex items-center justify-between cursor-pointer bg-transparent hover:bg-indigo-300"
            >
              <p
                onClick={() => loadSingleLecture(lec.lecture_id, lec.topic, lec.subtopic)}
                className="font-bold fadeTargetIn text-ellipsis"
              >
                {lec.title}
              </p>
              <div className="child flex items-center space-x-2">
                <svg
                  onClick={() => renameLecture(lec.lecture_id)}
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-pencil-line-icon lucide-pencil-line"
                >
                  <path d="M12 20h9" />
                  <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
                  <path d="m15 5 3 3" />
                </svg>
                <svg
                  onClick={() => deleteLecture(lec.lecture_id)}
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#e32400"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide cursor-pointer lucide-trash2-icon lucide-trash-2"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  <line x1="10" x2="10" y1="11" y2="17" />
                  <line x1="14" x2="14" y1="11" y2="17" />
                </svg>
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
              <div className={getBubbleStyle(chat.sender, true)+" fadeTargetIn tooltip"}>
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {chat.message}
                </ReactMarkdown>
                <div className='tooltiptext flex justify-center space-x-3'>
                  <svg onClick={()=>handleCopy(chat.message)} xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cursor-pointer lucide lucide-copy-icon lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                  <svg onClick={()=>TTS(chat.message)} xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className=" cursor-pointer lucide lucide-volume2-icon lucide-volume-2"><path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><path d="M16 9a5 5 0 0 1 0 6"/><path d="M19.364 18.364a9 9 0 0 0 0-12.728"/></svg>
                </div>
              </div>
            </div>
          ))}

          {InpEnabled == false && <div className="assistantOuter">
              <div className="currentInner">
                <WaveLoader></WaveLoader>
              </div>
            </div>}
          </div>
        <br/>
          <div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: "center", justifyContent: "center" }}>
              {LectureStart == true ? ( 
              <div className='flex space-x-2 pb-2'>
                  <button onClick={()=>renameLecture(currentLectureID)} className="cursor-pointer rounded-lg border sm:block bg-white p-1 hover:bg-zinc-200">
                    Rename This Lecture
                  </button>
                  <button onClick={()=> router.refresh()} className="cursor-pointer rounded-lg border sm:block bg-white p-1 hover:bg-zinc-200">
                    New Lecture
                  </button>
                  {/* <button style={{borderColor: "green"}} onClick={markComplete} className="cursor-pointer rounded-lg border sm:block bg-white p-1 hover:bg-zinc-200">
                    Complete Lecture
                  </button> */}
              </div>) : (
                <button onClick={startLecture} className="cursor-pointer rounded-lg border sm:block bg-white p-1 hover:bg-zinc-200">
                Start Lecture
                </button>
                )}
            </div>
            {audioUrl && (
              <div>
                <audio controls src={audioUrl}>
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}        
            <form onSubmit={continueLecture}>
              {/* <input
                type="text"
                id="messageinp"
                value={InputText}
                disabled={!InpEnabled}
                placeholder="Ask a Question..."
                onChange={
                  e => setInputText(e.target.value) 
                }
                className={InpEnabled ? enabledcss : disabledcss}
              /> */}
              <textarea>
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {InputText}
                </ReactMarkdown>
              </textarea>
              <div className='flex justify-center'>
                <textarea
                style={{overflowY: "scroll",resize: "block", }}
                value={InputText}
                disabled={!InpEnabled}
                placeholder="Ask a Question..."
                onChange={
                  e => setInputText(e.target.value) /* handleInputChange */
                }
                className={InpEnabled ? inputBar+enabledcss : inputBar+disabledcss}
                />
                <div onClick={recording ? stopRecording : startRecording} style={{width:60, height:60, borderWidth: 1, borderColor: "black", borderRadius: 9999, cursor:"pointer"}} className='hover:bg-zinc-200'>
                {recording ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-stop-icon lucide-circle-stop"><circle cx="12" cy="12" r="10"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="45" height="45" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="content-center lucide lucide-mic-icon lucide-mic"><path d="M12 19v3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><rect x="9" y="2" width="6" height="13" rx="3"/></svg>
                )}
                </div>
              </div>
            </form>
          </div>
          </center>
      </div>
    </div>
  )
}

//                                                Lectures Only Page
//author: Jerrod G
//run next config
//chain of thought prompting for AI: Ask AI to give YOU a prompt to solve a problem,
//break up the problem into smaller problem that gpt can handle
//Save current session and add it to the session list when: 
//  (1)user closes the tab, (2)user loads an old session, (3)user creates a new session
//give buttons and text input absolute position, and justify bottom middle CSS

'use client'
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
import AllSearch from '../components/topicSearch';
import {SendHorizontal, CircleStop, Mic, PencilLine, Trash2, X } from "lucide-react"

export default function LectureMode(){
  const { user } = useContext(AuthContext) as any;
  const router = useRouter();

  const [InputText, setInputText] = useState('')
  const [SearchText, setSearchText] = useState('')
  const [currentBotResponse, setCurrentBotResponse] = useState(''); // Temporary storage for streaming chatbot responses
  const [InpEnabled, ttginp] = useState(true) //true = enabled, false = disabled
  const [Topic, setTopic] = useState('')
  const [Subtopic, setSubtopic] = useState('')
  const [LectureStart, tggLectureStart] = useState(false)
  const [updating, tggUpdating] = useState(false)
  const [openSearch, ttgSearch] = useState(false);
  const [currentLectureID, setCurrentLectureID] = useState(0)
  const [isCopied, setIsCopied] = useState(false);

  const [vizCounter, setVizCounter] = useState(0)
  const [audioCounter, setAudCounter] = useState(0)
  const [learningStyle, setLearningStyle] = useState("Auto")

  const markdownTest = `The product of matrices is: $AB = \\begin{pmatrix} 2 & 3 \\\\ 1 & 4 \\end{pmatrix} \\begin{pmatrix} 5 & 2 \\\\ 0 & 1 \\end{pmatrix}$`;
  const [audioUrl, setAudioUrl] = useState(null);
  const [ChatStream, setChatStream] = useState([
    {sender: "assistant", message: `👋Hi, I'm your math assistant. Let's begin a new math lecture!\n🔎Click the button above to select the math topic you want to learn about.\n🧩Continue the lecture by engaging with me.\nAsk me questions, and prompt me for real world examples.\n🔄You can start over with a new topic by clicking the button on top of the screen again.`}])
  //In ChatStream, the 3 sender values are 'system' 'user' and 'assistant'
  const [LectureArchive, setLectureArchive] = useState([])
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');//used for text to speech and voice input
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

    useEffect(() => {
      if (!user){
        router.replace("/")
      } else {
        loadLectureList()
        getLStyle()
      }
    }, [user, router]); // The empty array ensures this effect runs only once on mount


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

  async function getLStyle(){
    const form = new FormData();
    Object.entries({student_id: user?.id}).forEach(([key, value]) => {
      form.append(key, value);
    });
    const response = await fetch('https://mathgptdevs25.pythonanywhere.com/get_learning_style', {
      method: 'POST',
      body: form
    });
    const data = await response.json();
    //alert("Style is "+data.learning_style)
    setLearningStyle(data.learning_style)
  }
  
  async function setNewTopic() {
    let newTopic = prompt(
      'Enter a math topic to learn about:', //prompt
      'Algebra' //placeholder
    )
    if (newTopic !== null && newTopic.trim()) {
      //only set a new topic if the user inputs a nonempty string
      setTopic(newTopic)

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

      setChatStream((prev) => [...prev, { sender: "system", message: `System: The subtopic was changed to "${newTopic}."`, }]);
      //save new chat to conversation
      ttginp(true) //enable chat bar
    } else{
      alert("Please make sure the subtopic field is not empty before starting a lecture!")
    }
  }

  function updateTopicFromSelect(tpc,stpc){
    setTopic(tpc)
    setSubtopic(stpc)
    setChatStream((prev) => [...prev, { sender: "system", message: `System: The topic was changed to: ${tpc}, ${stpc}.`, }]);
    ttgSearch(!openSearch)
  }

   const startLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    ttginp(false);
    //alert(Topic+" "+user.id)

    if (!Topic.trim() || !Subtopic.trim()){
      alert("Please enter a math topic and subtopic by clicking the button on top of the page");
      ttginp(true);
      return;
    }
    const form = new FormData();
    Object.entries({topic: Topic, subtopic: Subtopic, student_id: user?.id}).forEach(([key, value]) => {
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
    setChatStream(prev => [...prev, { sender: "assistant", message: data.lecture }]);
    console.log(data.lecture)
    scroll()
    tggLectureStart(true); // Enable "Continue Lecture" button
    ttginp(true);
    loadLectureList();
    applyStyle();
};

  async function continueLecture (e: React.FormEvent){
    e.preventDefault();
    if(!InputText.trim()){
      return
    }
    ttginp(false);
    setChatStream(prev => [...prev, { sender: "user", message: InputText }]);
  
    if (currentLectureID == 0 || Topic == "" || Subtopic == ""){
      ttgSearch(!openSearch)
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
    setChatStream(prev => [...prev, { sender: "assistant", message: data.answer }]);
    setInputText("")
    ttginp(true) //enable chat bar
    scroll()
    applyStyle()
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
        router.push("/courses")
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

  async function TTSopenai(copyText){
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
    setAudCounter(audioCounter+1);
  }

  /* const speak = (text) => {
    if (!supportsTTS || !text) return;
    const synth = window.speechSynthesis;
    synth.cancel();

    const utter = new SpeechSynthesisUtterance(toReadable(text));
    utter.voice = voices.find((v) => v.lang?.startsWith("en")) || voices[0] || null;
    utter.rate = 1;
    utter.pitch = 1;
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    synth.speak(utter);
  };

  const stopSpeaking = () => {
    if (!supportsTTS) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }; */

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

  function chosenTopic (tpc, stpc){
    setTopic(tpc)
    setSubtopic(stpc)
  }

  function rreset (){
    setChatStream([
      {sender: "assistant", message: `👋Hi, I'm your math assistant. Let's begin a new math lecture!\n🔎Click the button above to select the math topic you want to learn about.\n🧩Continue the lecture by engaging with me.\nAsk me questions, and prompt me for real world examples.\n🔄You can start over with a new topic by clicking the button on top of the screen again.`}
    ])
    setInputText("")
    setSearchText("")
    setTopic("")
    setSubtopic("")
    setCurrentLectureID(0)
    tggLectureStart(false)
  }

  function getGraphic (){
    setChatStream(prev => [...prev, { sender: "assistant", message: "(📈Insert chart, diagram, graph etc. here📊)" }]);
    setVizCounter(vizCounter+1)
    scroll();
  }

  function applyStyle (){
    alert("Hello from ")
    if (learningStyle == "Visual"){//if the style is set to Visual, generate an image to go with the lecture automatically
      getGraphic()
      return
    }
    if (learningStyle == "Audio"){//if the style is set to Audio, generate text to speech with every new message automatically
      let streamm = ChatStream
      let lastChat = streamm[streamm.length-1].message
      TTSopenai(lastChat)
      return
    }

    if (learningStyle == "Auto"){//if the user's learning style is set to 'auto', automatically use the tool that they use most often
      if (vizCounter > audioCounter){
        getGraphic()
        return
      }
      if (audioCounter > vizCounter){
        let streamm = ChatStream
        let lastChat = streamm[streamm.length-1].message
        TTSopenai(lastChat)
        return
      }
      if (audioCounter == vizCounter){//if the counters are equal, pick a tool at random and activate it automatically
        let randomVal = Math.floor(Math.random() * 2) + 1;
        if (randomVal == 1){
          getGraphic()
          return
        } else{
          let streamm = ChatStream
          let lastChat = streamm[streamm.length-1].message
          TTSopenai(lastChat)
          return
        }
      }
    }
  }
  

  return (
    <div>
      <NavigationBar/>
      <div className="splitsub px-3 left bg-slate-300 text-xl h-full">
        {/* This div holds the left panel */}
        <p onClick={rreset} className="py-3 cursor-pointer text-xl font-extrabold underline underline-offset-8">
          Start a new Lecture
        </p>
        <h1 className="text-blue-600 pt-3 font-extrabold">Previous Sessions:</h1>
        {/*Previous Topics loaded in from database are placed here*/}
        {!updating && LectureArchive.map((lec, index) => (
            <div
              id={lec.lecture_id.toString()}
              key={lec.lecture_id}
              style={{ padding: 4, borderRadius: 20 }}
              className="parent flex items-center justify-between bg-transparent hover:bg-indigo-300"
            >
              <p
                onClick={() => loadSingleLecture(lec.lecture_id, lec.topic, lec.subtopic)}
                className="px-4 font-bold cursor-pointer fadeTargetIn text-ellipsis"
              >
                {lec.title}
              </p>
              <div className="child flex items-center space-x-2">
                <PencilLine onClick={() => renameLecture(lec.lecture_id)} size={24} color="currentcolor" className='cursor-pointer'/>
                <Trash2 onClick={() => deleteLecture(lec.lecture_id)} size={24} className='cursor-pointer' color="#e32400"/>
              </div>
            </div>
          ))}
      </div>
      <div className="splitmain right text-lg">
        {/* This div holds the right panel */}
          <center><button className='cursor-pointer border-4 bg-indigo-200 rounded-xl p-2' onClick={()=>ttgSearch(!openSearch)}>
            {Topic != "" && Subtopic != "" ? (Topic+", "+Subtopic): "Select a Math Topic"}
          </button></center>
          <div ref={chatContainer} style={{boxShadow: "0 0 30px rgb(160, 160, 160)", flex: 1, overflowY: "scroll", height: "55vh"}}> {/* //This div streams the response in real time, couldn't finish it in time */}
            {ChatStream.map((chat, index) => (
              <div id={index.toString()} key={index} className={getBubbleStyle(chat.sender, false)}> {/* Setting the id prevents warnings/errors from the map function, otherwise it in not important*/}
              <div className={getBubbleStyle(chat.sender, true)+" fadeTargetIn tooltip"}>
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {chat.message}
                </ReactMarkdown>
                <div className='tooltiptext flex justify-center space-x-3'>
                  <svg onClick={()=>handleCopy(chat.message)} xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cursor-pointer lucide lucide-copy-icon lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                  <svg onClick={()=>TTSopenai(chat.message)} xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className=" cursor-pointer lucide lucide-volume2-icon lucide-volume-2"><path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><path d="M16 9a5 5 0 0 1 0 6"/><path d="M19.364 18.364a9 9 0 0 0 0-12.728"/></svg>
                </div>
              </div>
            </div>
          ))}

          {InpEnabled == false && <div className="assistantOuter">
              <div className="currentInner">
                {currentBotResponse}
                <WaveLoader></WaveLoader>
              </div>
            </div>}
          </div>
        <br/>
        <center>
          <div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: "center", justifyContent: "center" }}>
              {LectureStart == true ? ( 
              <div className='flex space-x-2 pb-2'>
                  <button onClick={()=>renameLecture(currentLectureID)} className="cursor-pointer rounded-lg border sm:block bg-white p-1 hover:bg-zinc-200">
                    Rename This Lecture
                  </button>
                  <button onClick={getGraphic} className="cursor-pointer rounded-lg border sm:block bg-white p-1 hover:bg-zinc-200">
                    Request Image/Graph
                  </button>
                  <button onClick={rreset} className="cursor-pointer rounded-lg border sm:block bg-white p-1 hover:bg-zinc-200">
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
            {LectureStart == true && 
              <form onSubmit={continueLecture}>
              <div className='fadeTargetIn flex justify-center space-x-1'>
                <textarea
                style={{overflowY: "scroll",resize: "block", }}
                value={InputText}
                disabled={!InpEnabled}
                placeholder="Ask a Question..."
                onChange={
                  e => setInputText(e.target.value)
                }
                className={InpEnabled ? inputBar+enabledcss : inputBar+disabledcss}
                />
                {/* {recording ? (
                  <button type='submit' style={{width:60, height:60, borderWidth: 1, borderColor: "black", borderRadius: 9999, cursor:"pointer"}} className='content-center hover:bg-zinc-200'>
                    <CircleStop className='centerThis' size={45} color="currentcolor"/>
                  </button>
                ) : (
                  <button type='submit' style={{width:60, height:60, borderWidth: 1, borderColor: "black", borderRadius: 9999, cursor:"pointer"}} className='content-center hover:bg-zinc-200'>
                    <Mic className='centerThis fadeTargetIn' size={45} color="currentcolor"/>
                  </button>
                )} */}
                <button type='submit' style={{width:60, height:60, borderWidth: 1, borderColor: "black", borderRadius: 9999, cursor:"pointer"}} className='hover:bg-zinc-200'>
                  <SendHorizontal className='centerThis fadeTargetIn' size={45} color="currentcolor" />
                </button>
              </div>
            </form>
            }   
          </div>
          </center>
      </div>
      {openSearch && (
        <div className="fixed inset-0 flex overflow-y-scroll items-center justify-center z-50" style={{ backgroundColor: "rgba(0, 0, 0, 0.75)" }}>
          <div className="bg-white rounded-lg p-6 w-full max-w-[50%] h-[90%] centerThis">
            <div onClick={()=>ttgSearch(!openSearch)} className='cursor-pointer bg-gray-300 rounded-full w-[45px] h-[45px]'>
              <X size={45} color="currentcolor"/>
            </div>
            <h2 className="text-2xl font-bold mb-4">Choose a Math Topic</h2>
            <center>
              <AllSearch clickAction={updateTopicFromSelect}></AllSearch>
            </center>
          </div>
        </div>
      )}
    </div>
  )
}

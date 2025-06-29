'use client';

import { useEffect, useState } from 'react';
import supabaseProj from '../getsupaproj.js';

export default function datalab() {
  //const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usr, setUsr] = useState("");
  const [pwd, setPwd] = useState("");

/*   useEffect(() => {
    const fetchData = async () => {
      console.log("Fetching data from publicTable...");
      const { data: publicTableData, error } = await supabase
        .from('publicTable')
        .select('*');

      if (error) {
        console.error('Error fetching data:', error);
        setData([]);
      } else {
        setData(publicTableData || []);
      }
      setLoading(false);
    };

    fetchData();
  }, []); */

  async function sumbitCred(){
    //alert(usr+ " " + pwd)
    if (!usr.trim() || !pwd.trim()){
      alert("Please make sure both username and password fields are filled.")
      return
    }
    const { error } = await supabaseProj.from("publicTable").insert([{username:usr, password:pwd}])
    if (error){
      console.error("Cannot sumbit credentials: ", error)
    } else {
      setUsr("")
      setPwd("")
    }
  }

  async function loadData (){
    let {data: creds, error} = await supabaseProj
      .from('publicTable')
      .select(`*`)
    
    console.log(creds)
    if (error){
      console.error("Cannot sumbit credentials: ", error)
    }    
    return
  }

  return (
    <div className='centerThis text-2xl' style={{backgroundColor: "Menu", height: "100vh"}}>
      <br/><br/><br/><br/>
      <h1>Please Create an account</h1>
      Username <input 
          placeholder='...' 
          value={usr}
          onChange={(e) => setUsr(e.target.value)}
          style={{background: "white", borderRadius: 10, color: "black"}} /><br/><br/>
      Password <input 
          placeholder='...' 
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          style={{background: "white", borderRadius: 10, color: "black"}} /><br/><br/>
      <button onClick={sumbitCred} style={{borderWidth: 3, borderColor: "black", borderRadius: 10}}>Create Account!</button><br/><br/>
      <button onClick={loadData} style={{borderWidth: 3, borderColor: "black", borderRadius: 10}}>Load Data</button><br/><br/>
      {/* {loading ? (
        <p>Loading...</p>
      ) : (
        <pre>{JSON.stringify(data, null, 2)}</pre>
      )} */}
    </div>
  );
}

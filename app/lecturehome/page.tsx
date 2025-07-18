"use client"
import React from 'react'
import { useState, useContext, useEffect } from 'react'
import { AuthContext } from "../context/AuthContext";

export default function LectureHome(){
    const { equation } = useContext(AuthContext) as any;
    const [proficiency, setProficiency] = useState(65);

    useEffect(() => {
      if (!equation) {
        alert("No Equation saved")
      }
    }, [equation]);

    function getEquation(){
      alert(equation)
    }

    function testRegex(){
      const stringgy = "$$This is a test$$"
      const regex = /\${1,2}[^$]+\${1,2}/;
      const matches = stringgy.match(/\${1,2}([^$]+)\${1,2}/);
      alert(matches[1])
    }
    
  return (
    <div className='text-2xl'>
        <p className='font-black pt-20 px-10 text-md'>Lectures</p>
        <div className='mx-auto w-full bg-indigo-300'>
            {/* <p className='flex justify-center text-4xl font-extrabold'>⭐️Topic of the Day⭐️</p> */}
            <br/>
            <div style={{borderWidth: 2, borderColor: "gray", borderRadius: 35, width:"30%", minHeight:"15vh"}} className='cursor-pointer xmx-auto w-full'>
                <p className='p-3'>Math Expressions</p>
                <div style={{width: "full", backgroundColor: "gray", height: "2px"}}></div>
                <p className='p-3'>Factoring Expressions</p>
            </div>
        </div>
        <div style={{margin: "auto"}} className='rounded-lg w-4/12 h-7 bg-red-600'>
                <div style={{width: proficiency.toString()+"%"}} className='font-extrabold h-full bg-green-500 rounded-lg'>Proficiency: {proficiency}</div>
        </div>
        <button onClick={getEquation}>TESTING Equation storage</button>
    </div>
  )
}
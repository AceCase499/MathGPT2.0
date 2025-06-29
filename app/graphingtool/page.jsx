///////////////////////////////////////////////           Graphing Tool          /////////////////////////////////////
import React from 'react';
const GraphingTool = () => {
  return (
    <>
    <body>
    <button color="primary">
        <a href="/">GO BACK</a>
      </button>
      <center>
      <img src="/graph.jpeg" width="500" height="500"></img>
      <br></br>
      <input size="sm" placeholder="Type Your Equation Here" />
      <button color="warning" variant="ghost">
        ➕
      </button>
      <button color="warning" variant="ghost">
        ➖
      </button> 
      <button color="warning" variant="ghost">
        ➗
      </button> 
      <button color="warning" variant="ghost">
        ✖️
      </button> 
      <button color="warning" variant="ghost">
        🟰
      </button> 
      </center>
    </body>
    </>
  )
}

export default GraphingTool
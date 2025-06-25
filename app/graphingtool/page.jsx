///////////////////////////////////////////////           Graphing Tool          /////////////////////////////////////
import React from 'react';
import { Input } from "@nextui-org/input";
import { Button, ButtonGroup } from "@nextui-org/button";
const GraphingTool = () => {
  return (
    <>
    <body>
    <Button color="primary">
        <a href="/">GO BACK</a>
      </Button>
      <center>
      <img src="/graph.jpeg" width="500" height="500"></img>
      <br></br>
      <Input size="sm" placeholder="Type Your Equation Here" />
      <Button color="warning" variant="ghost">
        ➕
      </Button>
      <Button color="warning" variant="ghost">
        ➖
      </Button> 
      <Button color="warning" variant="ghost">
        ➗
      </Button> 
      <Button color="warning" variant="ghost">
        ✖️
      </Button> 
      <Button color="warning" variant="ghost">
        🟰
      </Button> 
      </center>
    </body>
    </>
  )
}

export default GraphingTool
import React from "react";
import "../loader.css";

const WaveLoader = () => {
  return (
    <div className="loader">
      <div className="wave">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="circle" />
        ))}
      </div>
    </div>
  );
};

export default WaveLoader;

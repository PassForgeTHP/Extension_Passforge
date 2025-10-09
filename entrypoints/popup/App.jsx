import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="app">
      <h1>PassForge</h1>
      <p>Secure Password Management Extension</p>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          Count is {count}
        </button>
      </div>
      <p className="read-the-docs">
        Click on the button to test React
      </p>
    </div>
  );
}

export default App;

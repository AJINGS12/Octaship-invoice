import React from 'react'
console.log('SimpleApp.jsx loaded')

export default function SimpleApp() {
  return (
    <div className="app-root">
      <div className="card">
        <h1>Vite + React</h1>
        <p>This is a minimal React app (no Tailwind). The full app is still in <code>src/App.jsx</code>.</p>
        <a className="btn" href="/" onClick={(e)=>e.preventDefault()}>Demo Button</a>
      </div>
    </div>
  )
}

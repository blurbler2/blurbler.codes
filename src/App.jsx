import React from 'react'
import Header from './components/Header'
import About from './components/About'
import Projects from './components/Projects'
import Hobbies from './components/Hobbies'
import Contact from './components/Contact'
import Footer from './components/Footer'

export default function App() {
  return (
    <div className="wrap">
      <Header />

      <div className="grid">
        <main>
          <About />
          <div style={{ height: 14 }} />
          <Projects />
          <div style={{ height: 14 }} />
          <Hobbies />
        </main>

        <aside>
          <Contact />
        </aside>
      </div>

      <Footer />
    </div>
  )
}

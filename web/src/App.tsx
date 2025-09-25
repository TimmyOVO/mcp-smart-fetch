import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Hero from './components/Hero'
import Features from './components/Features'
import Architecture from './components/Architecture'
import QuickStart from './components/QuickStart'
import Deployment from './components/Deployment'
import Footer from './components/Footer'
import LoadingScreen from './components/LoadingScreen'

function App() {
  const [showMainContent, setShowMainContent] = useState(false)

  const handleLoadingComplete = () => {
    setShowMainContent(true)
  }

  return (
    <>
      <LoadingScreen onLoadingComplete={handleLoadingComplete} minLoadingTime={3000} />

      <AnimatePresence>
        {showMainContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, ease: 'easeInOut' }}
            className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900"
          >
            <Hero />
            <Features />
            <Architecture />
            <QuickStart />
            <Deployment />
            <Footer />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default App
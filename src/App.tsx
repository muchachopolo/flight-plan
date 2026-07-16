import { Routes, Route } from 'react-router-dom'
import FlightPlanForm from './FlightPlanForm'
import TemplateManager from './TemplateManager'

function App() {
  return (
    <Routes>
      <Route path="/" element={<FlightPlanForm />} />
      <Route path="/templates" element={<TemplateManager />} />
      <Route path="/templates/:section" element={<TemplateManager />} />
    </Routes>
  )
}

export default App

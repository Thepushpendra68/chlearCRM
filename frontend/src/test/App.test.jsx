import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import App from '../App'

// Mock the AuthContext and LeadContext
const MockApp = () => (
  <BrowserRouter>
    <App />
  </BrowserRouter>
)

describe('App', () => {
  it('renders without crashing', () => {
    render(<MockApp />)
    // The app should render without throwing an error
    expect(document.body).toBeInTheDocument()
  })
})
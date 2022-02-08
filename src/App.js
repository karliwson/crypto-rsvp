import './assets/App.css';

import { Route, Routes } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import Home from './pages/Home';

function App() {
  return (
    <div className="App">
      <Container fluid style={{ padding: 0 }}>
          <Routes>
            <Route exact path="/" element={<Home />} />
          </Routes>
      </Container>
    </div>
  );
}

export default App;

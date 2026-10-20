import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import CreateRoom from './pages/CreateRoom';
import JoinRoom from './pages/JoinRoom';
import RoomCreated from './pages/RoomCreated';
import Lobby from './pages/Lobby';
import GameContainer from './pages/GameContainer';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create-room" element={<CreateRoom />} />
        <Route path="/room-created" element={<RoomCreated />} />
        <Route path="/join-room" element={<Navigate to="/create-room" replace />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/game" element={<GameContainer />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

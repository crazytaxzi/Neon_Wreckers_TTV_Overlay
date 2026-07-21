import { createRoot } from 'react-dom/client';
import { Root } from './app.js';
import './styles.css';
import './concept-polish.css';
import './player-graphics.css';

createRoot(document.getElementById('root')!).render(<Root />);

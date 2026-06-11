import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatbotWidget from './components/ChatbotWidget';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1">
          <AppRoutes />
        </main>
        <Footer />
        <ChatbotWidget />
        <Toaster
          position="bottom-center"
          toastOptions={{
            duration: 2500,
            style: {
              background: '#111111',
              color: '#FFFFFF',
              fontSize: '13px',
              borderRadius: '0',
              padding: '12px 20px',
            },
          }}
        />
      </div>
    </BrowserRouter>
  );
}

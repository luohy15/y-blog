import { Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import HtmlLangUpdater from './components/HtmlLangUpdater';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import WritingPage from './pages/WritingPage';
import PostPageRoute from './pages/PostPageRoute';

export default function App() {
  return (
    <LanguageProvider>
      <HtmlLangUpdater />
      <div className="min-h-screen bg-background font-sans antialiased">
        <Header />
        <main className="flex-1 pt-20">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/writing" element={<WritingPage />} />
            <Route path="/:param" element={<PostPageRoute />} />
            <Route path="/:param/writing" element={<WritingPage />} />
            <Route path="/:param/:slug" element={<PostPageRoute />} />
          </Routes>
        </main>
      </div>
    </LanguageProvider>
  );
}

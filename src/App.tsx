import type { ReactElement } from 'react';
import { Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import HtmlLangUpdater from './components/HtmlLangUpdater';
import ScrollToTop from './components/ScrollToTop';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import WritingPage from './pages/WritingPage';
import TagsPage from './pages/TagsPage';
import PostPageRoute from './pages/PostPageRoute';
import { routeTable, type AppPage } from './lib/routes';

const pages: Record<AppPage, ReactElement> = {
  home: <HomePage />,
  writing: <WritingPage />,
  tags: <TagsPage />,
  post: <PostPageRoute />,
};

export default function App() {
  return (
    <LanguageProvider>
      <HtmlLangUpdater />
      <ScrollToTop />
      <div className="min-h-screen bg-background font-sans antialiased">
        <Header />
        <main className="flex-1 pt-20">
          <Routes>
            {routeTable.map((route) => (
              <Route key={route.path} path={route.path} element={pages[route.page]} />
            ))}
          </Routes>
        </main>
      </div>
    </LanguageProvider>
  );
}

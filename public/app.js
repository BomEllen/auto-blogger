import { Navbar } from './components/Navbar.js';
import { getHTML as homeHTML, mount as mountHome } from './pages/HomePage.js';
import { getHTML as titleHTML, mount as mountTitle } from './pages/TitleGenPage.js';

const navRoot = document.getElementById('navRoot');
const pageRoot = document.getElementById('pageRoot');

const routes = {
  '/':          { html: homeHTML,  mount: mountHome,  nav: 'home' },
  '/title-gen': { html: titleHTML, mount: mountTitle, nav: 'title-gen' },
};

let currentCleanup = null;

function navigate(hash) {
  const path = (hash || '#/').replace(/^#/, '') || '/';
  const route = routes[path] || routes['/'];

  if (currentCleanup) { currentCleanup(); currentCleanup = null; }

  pageRoot.innerHTML = route.html();
  currentCleanup = route.mount() || null;
  Navbar.setActive(route.nav);
  window.scrollTo(0, 0);
}

Navbar.init(navRoot);
navigate(location.hash);
window.addEventListener('hashchange', () => navigate(location.hash));

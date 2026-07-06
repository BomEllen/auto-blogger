import { Navbar } from './components/Navbar.js';
import { getHTML as homeHTML,  mount as mountHome  } from './pages/HomePage.js';
import { getHTML as infoHTML,  mount as mountInfo  } from './pages/InfoBlogPage.js';
import { getHTML as titleHTML, mount as mountTitle } from './pages/TitleGenPage.js';
import { getHTML as imageHTML, mount as mountImage } from './pages/ImageGenPage.js';

const navRoot = document.getElementById('navRoot');
const pageRoot = document.getElementById('pageRoot');

const routes = {
  '/':          { html: homeHTML,  mount: mountHome,  nav: 'home' },
  '/info-blog': { html: infoHTML,  mount: mountInfo,  nav: 'info-blog' },
  '/title-gen': { html: titleHTML, mount: mountTitle, nav: 'title-gen' },
  '/image-gen': { html: imageHTML, mount: mountImage, nav: 'image-gen' },
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

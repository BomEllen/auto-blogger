export const Navbar = {
  init(container) {
    container.innerHTML = `
      <div class="nav-inner">
        <a href="#/" class="nav-logo">
          <img src="/favicon.png" alt="찍기만 해!" class="nav-logo-img" />
          <span class="nav-logo-text">찍기만 해!</span>
        </a>
        <div class="nav-links">
          <a href="#/" class="nav-link" data-page="home">리뷰 블로그 작성</a>
          <a href="#/info-blog" class="nav-link" data-page="info-blog">정보성 블로그 작성</a>
          <a href="#/title-gen" class="nav-link" data-page="title-gen">따로 생성</a>
          <a href="#/image-gen" class="nav-link" data-page="image-gen">이미지 생성</a>
        </div>
      </div>
    `;
  },

  setActive(page) {
    document.querySelectorAll('.nav-link').forEach((link) => {
      link.classList.toggle('active', link.dataset.page === page);
    });
  },
};

# blog-generator ("찍기만 해!")

네이버 블로그 자동 생성 도구. Express(`server.js`) + 바닐라 JS SPA(`public/`, 해시라우터) + Gemini API(+ 일부 OpenAI). Fly.io에 `yeonnog-blog`로 배포됨.

## 아키텍처

3개 층이 분리되어 있다. 규칙(문체·형식)을 바꿀 때는 코드가 아니라 `prompts/`를 고친다.

1. **코드 로직** — `server.js`, `routes/`, `lib/`, `public/`
2. **Gemini 프롬프트 규칙** — `prompts/*.md`, `prompts/*.txt` (런타임에 `fs.readFileSync`로 읽어서 `systemInstruction`/prompt에 그대로 주입되는 AI 인격·규칙 데이터. 개발 문서 아님)
3. **개발 지침** — 이 파일

## 기능별 파일 위치

| 기능 | 프론트 | 백엔드 라우트 | 프롬프트 자산 |
|---|---|---|---|
| 리뷰 블로그 (`찍기만 해!` 메인) | `public/pages/HomePage.js` | `routes/review-blog.js` (`/api/verify-key`, `/api/extract-info`, `/api/generate`) | `prompts/review-blog-guide.md`, `prompts/style-samples.txt` |
| 제목생성/유틸 | `public/pages/TitleGenPage.js` | `routes/title-gen.js` (`/api/generate-title`, `/api/generate-hashtags`, `/api/improve-section`, `/api/describe-photo`, `/api/research-blog`) | `prompts/review-blog-guide.md` (review-blog와 각자 독립적으로 로드 — 서로 참조하지 않음) |
| 정보성 블로그 | `public/pages/InfoBlogPage.js` | `routes/info-blog.js` (`/api/generate-info-blog`) | `prompts/info-blog-guide.md` |
| 이미지 생성/편집 | `public/pages/ImageGenPage.js` | `routes/image-gen.js` (`/api/generate-image`, `/api/edit-image`) | 없음 (코드 내 상수, OpenAI `gpt-image-1`) |

공통 인프라는 `lib/`에 있다:
- `lib/ai.js` — 모델 상수(`GEMINI_MODEL`/`FALLBACK_MODEL`), 타임아웃·재시도·폴백(`withTimeout`/`isRetryable`/`withRetry`/`withFallback`), 사용자용 에러 메시지 변환(`friendlyGeminiError`)
- `lib/upload.js` — multer 인스턴스, 이미지 파일 base64 변환/정리
- `lib/naver.js` — 네이버 블로그 검색 (SEO용 제목/키워드 참고)
- `lib/text.js` — 서식 새니타이즈, 제목 파싱 (review-blog + info-blog 공유)

프론트(`public/`)는 이미 페이지별로 잘 나뉘어 있어 거의 손댈 일 없다. `app.js`는 해시라우터, 새 페이지 추가할 때만 수정.

## 규칙별로 고쳐야 할 파일

- "글 문체·톤을 바꿔줘" → 리뷰면 `prompts/review-blog-guide.md`, 정보성이면 `prompts/info-blog-guide.md`
- "리뷰 예시 글(샘플)을 바꿔줘" → `prompts/style-samples.txt`
- "타임아웃/재시도/폴백 로직을 바꿔줘" → `lib/ai.js`
- "사진 업로드 개수·용량 제한을 바꿔줘" → `lib/upload.js`
- "이 API 엔드포인트 동작을 바꿔줘" → 위 표에서 해당 기능의 `routes/*.js`
- "이 페이지 UI를 바꿔줘" → `public/pages/*.js`

## 절대 규칙

- `.md`/`.txt` 프롬프트 파일 = AI에게 주는 규칙. 문체·검증 로직을 바꾸는 지침이면 코드가 아니라 해당 파일을 고칠 것.
- `lib/*.js`는 순수 인프라만. 특정 기능(리뷰/정보성/제목생성/이미지) 전용 로직을 넣지 말 것 — 2개 이상 기능이 실제로 공유할 때만 여기로 옮긴다.
- 각 `routes/*.js`는 자신이 쓰는 프롬프트 파일을 스스로 `fs.readFileSync`한다 (다른 라우트 파일을 require해서 재사용하지 않음). 파일 하나만 열어도 그 기능이 완결되게 하기 위함.
- 배포/인프라 변경 시 비용이 발생하지 않도록 할 것 (Fly.io 무료 한도 내).

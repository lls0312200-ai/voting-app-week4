# 모아 — 4주차 투표 앱

Next.js App Router, TypeScript, Neon Postgres로 만든 투표 앱입니다. 운영자는 비밀번호로 로그인해 질문과 선택지 2~10개를 만들고 삭제할 수 있습니다. 투표자는 계정 없이 하나를 고르며, 참여 후에만 결과를 봅니다. 과제의 마감 시간, 결과 막대그래프, 제작자 이름 `이이삭`을 포함합니다.

## 로컬 실행

```powershell
npm install
npm run dev
```

`http://localhost:3000`으로 접속하세요. 이 작업 폴더에는 Git에서 제외되는 `.env.local`에 로컬 운영자 비밀번호와 세션 비밀값이 생성되어 있습니다. **운영자 비밀번호는 `.env.local`의 `ADMIN_PASSWORD` 값**입니다. 다른 컴퓨터에서는 `.env.example`을 참고해 새 값을 만드세요.

`DATABASE_URL`이 없으면 **로컬 체험 모드**로 동작하며 투표가 `.data/polls.json`에 저장됩니다. 이 모드는 한 PC의 한 서버에서 기능을 시험하기 위한 것입니다. Vercel 배포에서는 Neon 연결이 필수이고, 로컬 파일 모드는 사용하지 않습니다.

## Neon 연결

1. Neon에서 PostgreSQL 프로젝트를 만들고 연결 문자열을 `.env.local`의 `DATABASE_URL`에 설정합니다.
2. Neon SQL Editor에서 [`db/schema.sql`](db/schema.sql)을 한 번 실행합니다.
3. 개발 서버를 다시 시작합니다. 로컬 체험 모드의 데이터는 자동 이전되지 않습니다.

Vercel 프로젝트 환경변수에는 `DATABASE_URL`, `ADMIN_PASSWORD`, `SESSION_SECRET`을 설정하세요. `ADMIN_PASSWORD`는 12자 이상, `SESSION_SECRET`은 32자 이상의 무작위 문자열이어야 합니다. 로컬에서 생성한 값을 그대로 쓸 수 있지만, 두 값 모두 저장소와 공개 제출문에 올리지 마세요. 환경변수를 추가하거나 바꾸면 재배포해야 반영됩니다.

## 기능과 접근 경로

| 경로 | 기능 |
| --- | --- |
| `/` | 공개 투표 목록 |
| `/login` | 운영자 로그인 |
| `/admin` | 투표 목록·결과 미리보기·삭제 |
| `/new` | 질문, 선택지, 선택적 마감 시간으로 투표 생성 |
| `/polls/[id]` | 단일 선택 투표 |
| `/polls/[id]/results` | 참여자 또는 운영자만 볼 수 있는 득표수·막대그래프 |

`/api/polls` 생성, `/api/polls/[id]/vote` 투표, `/api/polls/[id]/results` 결과 등의 Route Handler가 있습니다. 투표 제출은 DB에서 원자적으로 중복·마감 여부를 확인합니다. 결과는 4초 간격으로 갱신됩니다. 운영자는 참여 전 0표 결과도 미리 볼 수 있습니다.

중복 투표 제한은 브라우저 쿠키를 기준으로 합니다. 쿠키 삭제·다른 기기 사용까지 막는 신원 확인이 아니므로 실제 선거에는 적합하지 않습니다. 운영자 삭제는 되돌릴 수 없으며 선택지와 투표 기록도 함께 삭제됩니다.

## 검증

```powershell
npx tsc --noEmit
npm run lint
npm run build
```

개발 서버가 실행 중일 때 `node tests/smoke.mjs`로 API를 관통하는 로컬 체험 모드 검사를 실행할 수 있습니다. 검사에서 만든 투표는 끝에 삭제합니다.

## 수업 흐름 기록

- [`CONTEXT.md`](CONTEXT.md): 도메인 용어
- [`docs/adr/0001-anonymous-voting.md`](docs/adr/0001-anonymous-voting.md): 익명 쿠키 투표와 공유 운영자 비밀번호 선택 이유
- [`specs/voting-app.md`](specs/voting-app.md): 구현 범위와 성공 기준
- [`.scratch/voting-app/issues/`](.scratch/voting-app/issues/): 순서와 의존성을 가진 작업 단위
- [`docs/review.md`](docs/review.md): 관례와 명세 두 관점의 검토

Matt Pocock Skills는 `.agents/skills`와 `.claude/skills`에 설치되어 있습니다. 이 컴퓨터에는 Claude Code 실행 파일이 없어 Codex가 같은 산출물 흐름을 작성·검증했습니다.

## 배포

GitHub 인증 후 저장소를 만들고 이 폴더의 커밋을 push합니다. Vercel에서 해당 GitHub 저장소를 가져와 Next.js 프로젝트로 배포하고 위 환경변수를 설정합니다. Neon SQL을 실행한 뒤 실제 배포 URL에서 투표 생성→참여→그래프를 확인하세요. 배포 절차와 제출 상태는 상위 폴더의 `과제-제출.md`에 기록합니다.

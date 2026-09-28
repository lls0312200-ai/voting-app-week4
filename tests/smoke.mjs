import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const env = Object.fromEntries(readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/).filter(Boolean).map((line) => line.split(/=(.*)/s).slice(0, 2)));
const created = [];
let adminCookie = "";

async function call(path, { method = "GET", body, cookie = "", origin = base } = {}) {
  const response = await fetch(base + path, {
    method,
    headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(cookie ? { Cookie: cookie } : {}), ...(method !== "GET" ? { Origin: origin } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  return { status: response.status, data, cookie: response.headers.get("set-cookie")?.split(";")[0] || "" };
}

try {
  assert.equal((await call("/api/login", { method: "POST", body: { password: "incorrect-password" }, origin: "https://foreign.example" })).status, 403);
  assert.equal((await call("/api/polls", { method: "POST", body: { question: "무단 생성 시도", options: ["A", "B"] } })).status, 401);
  assert.equal((await call("/api/login", { method: "POST", body: { password: "incorrect-password" } })).status, 401);
  const login = await call("/api/login", { method: "POST", body: { password: env.ADMIN_PASSWORD } });
  assert.equal(login.status, 200); adminCookie = login.cookie;
  assert.ok(adminCookie.startsWith("voting_admin="));
  assert.equal((await call("/api/polls", { method: "POST", cookie: adminCookie, body: { question: "마감 시간 검증 투표", options: ["A", "B"], closesAt: new Date(Date.now() - 1000).toISOString() } })).status, 400);

  const make = async (question, closesAt = null) => {
    const response = await call("/api/polls", { method: "POST", cookie: adminCookie, body: { question, options: ["좋아요", "다른 의견"], closesAt } });
    assert.equal(response.status, 201, JSON.stringify(response.data));
    created.push(response.data.id);
    return response.data.id;
  };

  const openId = await make("이번 모임에서 무엇을 할까요?");
  const detail = await call(`/api/polls/${openId}`);
  assert.equal(detail.status, 200);
  assert.equal(detail.data.options.length, 2);
  assert.equal(detail.data.options[0].voteCount, undefined, "투표 전 득표수는 공개하지 않는다");
  assert.equal((await call(`/api/polls/${openId}/results`)).status, 403);
  const optionId = detail.data.options[0].id;
  const vote = await call(`/api/polls/${openId}/vote`, { method: "POST", body: { optionId } });
  assert.equal(vote.status, 200); assert.ok(vote.cookie.startsWith("voting_voter="));
  const result = await call(`/api/polls/${openId}/results`, { cookie: vote.cookie });
  assert.equal(result.status, 200); assert.equal(result.data.totalVotes, 1);
  assert.equal(result.data.poll.options[0].voteCount, 1);
  assert.equal((await call(`/api/polls/${openId}/vote`, { method: "POST", cookie: vote.cookie, body: { optionId } })).status, 409);

  const zeroId = await make("0표 결과 화면도 보이나요?");
  const zero = await call(`/api/polls/${zeroId}/results`, { cookie: adminCookie });
  assert.equal(zero.status, 200); assert.equal(zero.data.totalVotes, 0);

  const closedId = await make("곧 마감되는 투표입니다", new Date(Date.now() + 1500).toISOString());
  const closedDetail = await call(`/api/polls/${closedId}`);
  await new Promise((resolve) => setTimeout(resolve, 1700));
  assert.equal((await call(`/api/polls/${closedId}/vote`, { method: "POST", body: { optionId: closedDetail.data.options[0].id } })).status, 403);
  console.log("smoke: auth, create, vote, duplicate, results gate, zero votes, deadline PASS");
} finally {
  for (const id of created) {
    const response = await call(`/api/polls/${id}`, { method: "DELETE", cookie: adminCookie });
    assert.equal(response.status, 200);
  }
  if (created.length) console.log("smoke: cleanup PASS");
}

import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { neon } from "@neondatabase/serverless";

export type Option = { id: string; label: string; voteCount: number };
export type Poll = {
  id: string;
  question: string;
  createdAt: string;
  closesAt: string | null;
  options: Option[];
};
export type PollSummary = Pick<Poll, "id" | "question" | "createdAt" | "closesAt"> & {
  totalVotes: number;
  optionCount: number;
};
type Vote = { pollId: string; optionId: string; voterId: string };
type LocalData = { polls: Poll[]; votes: Vote[] };
type PollRow = { id: string; question: string; created_at: string; closes_at: string | null };
type SummaryRow = PollRow & { total_votes: number | string; option_count: number | string };
type OptionRow = { id: string; label: string; vote_count: number | string };

const localFile = join(process.cwd(), ".data", "polls.json");
const isLocal = () => !process.env.DATABASE_URL && !process.env.VERCEL;
const sql = () => {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL이 없습니다. Neon 연결을 설정해 주세요.");
  return neon(process.env.DATABASE_URL);
};

function readLocal(): LocalData {
  if (!existsSync(localFile)) return { polls: [], votes: [] };
  return JSON.parse(readFileSync(localFile, "utf8")) as LocalData;
}

function writeLocal(data: LocalData) {
  mkdirSync(join(process.cwd(), ".data"), { recursive: true });
  const temporary = `${localFile}.${randomUUID()}.tmp`;
  writeFileSync(temporary, JSON.stringify(data, null, 2), { encoding: "utf8", mode: 0o600 });
  renameSync(temporary, localFile);
}

const iso = (value: string | Date | null) => value == null ? null : new Date(value).toISOString();
const mapPoll = (row: PollRow, options: Option[]): Poll => ({
  id: row.id,
  question: row.question,
  createdAt: iso(row.created_at)!,
  closesAt: iso(row.closes_at),
  options,
});

export function isClosed(poll: Pick<Poll, "closesAt">): boolean {
  return poll.closesAt !== null && new Date(poll.closesAt).getTime() <= Date.now();
}

export async function listPolls(): Promise<PollSummary[]> {
  if (isLocal()) {
    return readLocal().polls
      .map(({ id, question, createdAt, closesAt, options }) => ({
        id, question, createdAt, closesAt,
        optionCount: options.length,
        totalVotes: options.reduce((sum, option) => sum + option.voteCount, 0),
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  const rows = await sql()`
    select p.id, p.question, p.created_at, p.closes_at,
      count(o.id)::int as option_count,
      coalesce(sum(o.vote_count), 0)::int as total_votes
    from polls p left join options o on o.poll_id = p.id
    group by p.id order by p.created_at desc
  ` as SummaryRow[];
  return rows.map((row) => ({
    id: row.id, question: row.question, createdAt: iso(row.created_at)!,
    closesAt: iso(row.closes_at), optionCount: Number(row.option_count),
    totalVotes: Number(row.total_votes),
  }));
}

export async function getPoll(id: string): Promise<Poll | null> {
  if (isLocal()) return readLocal().polls.find((poll) => poll.id === id) ?? null;
  const db = sql();
  const rows = await db`select id, question, created_at, closes_at from polls where id = ${id}::uuid` as PollRow[];
  if (!rows[0]) return null;
  const options = await db`select id, label, vote_count from options where poll_id = ${id}::uuid order by sort_order` as OptionRow[];
  return mapPoll(rows[0], options.map(({ id, label, vote_count }) => ({ id, label, voteCount: Number(vote_count) })));
}

export function validatePoll(input: unknown): { question: string; labels: string[]; closesAt: string | null } {
  if (!input || typeof input !== "object") throw new Error("투표 내용을 입력해 주세요.");
  const value = input as Record<string, unknown>;
  const question = typeof value.question === "string" ? value.question.trim() : "";
  const labels = Array.isArray(value.options) ? value.options.map((item) => typeof item === "string" ? item.trim() : "") : [];
  if (question.length < 5 || question.length > 200) throw new Error("질문은 5~200자로 입력해 주세요.");
  if (labels.length < 2 || labels.length > 10 || labels.some((label) => label.length < 1 || label.length > 100)) {
    throw new Error("선택지는 2~10개, 각각 1~100자로 입력해 주세요.");
  }
  if (new Set(labels.map((label) => label.toLocaleLowerCase())).size !== labels.length) throw new Error("중복된 선택지는 사용할 수 없습니다.");
  let closesAt: string | null = null;
  if (value.closesAt !== null && value.closesAt !== undefined && value.closesAt !== "") {
    if (typeof value.closesAt !== "string" || !Number.isFinite(Date.parse(value.closesAt))) throw new Error("마감 시간을 확인해 주세요.");
    const timestamp = new Date(value.closesAt).getTime();
    if (timestamp <= Date.now()) throw new Error("마감 시간은 현재보다 미래여야 합니다.");
    closesAt = new Date(timestamp).toISOString();
  }
  return { question, labels, closesAt };
}

export async function createPoll(input: unknown): Promise<string> {
  const { question, labels, closesAt } = validatePoll(input);
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const options = labels.map((label) => ({ id: randomUUID(), label, voteCount: 0 }));
  if (isLocal()) {
    const data = readLocal();
    data.polls.push({ id, question, createdAt, closesAt, options });
    writeLocal(data);
    return id;
  }
  const db = sql();
  await db.transaction([
    db`insert into polls (id, question, closes_at) values (${id}::uuid, ${question}, ${closesAt}::timestamptz)`,
    ...options.map((option, index) => db`
      insert into options (id, poll_id, label, sort_order)
      values (${option.id}::uuid, ${id}::uuid, ${option.label}, ${index})
    `),
  ]);
  return id;
}

export async function hasVoted(pollId: string, voterId: string | undefined): Promise<boolean> {
  if (!voterId || !isUuid(voterId)) return false;
  if (isLocal()) return readLocal().votes.some((vote) => vote.pollId === pollId && vote.voterId === voterId);
  const rows = await sql()`select 1 from votes where poll_id = ${pollId}::uuid and voter_id = ${voterId}::uuid limit 1`;
  return rows.length > 0;
}

export async function castVote(pollId: string, optionId: string, voterId: string): Promise<"ok" | "duplicate" | "closed" | "missing"> {
  if (isLocal()) {
    // ponytail: this demo store is single-process only; use Neon for concurrent or deployed traffic.
    const data = readLocal();
    const poll = data.polls.find((item) => item.id === pollId);
    if (!poll || !poll.options.some((option) => option.id === optionId)) return "missing";
    if (data.votes.some((vote) => vote.pollId === pollId && vote.voterId === voterId)) return "duplicate";
    if (isClosed(poll)) return "closed";
    poll.options.find((option) => option.id === optionId)!.voteCount += 1;
    data.votes.push({ pollId, optionId, voterId });
    writeLocal(data);
    return "ok";
  }
  const db = sql();
  const changed = await db`
    with eligible as (
      select o.id as option_id, p.id as poll_id
      from options o join polls p on p.id = o.poll_id
      where p.id = ${pollId}::uuid and o.id = ${optionId}::uuid
        and (p.closes_at is null or p.closes_at > now())
    ), inserted as (
      insert into votes (poll_id, option_id, voter_id)
      select poll_id, option_id, ${voterId}::uuid from eligible
      on conflict (poll_id, voter_id) do nothing
      returning option_id
    )
    update options o set vote_count = o.vote_count + 1
    from inserted v where o.id = v.option_id returning o.id
  `;
  if (changed.length) return "ok";
  if (await hasVoted(pollId, voterId)) return "duplicate";
  const poll = await getPoll(pollId);
  if (!poll || !poll.options.some((option) => option.id === optionId)) return "missing";
  return isClosed(poll) ? "closed" : "missing";
}

export async function deletePoll(id: string): Promise<boolean> {
  if (isLocal()) {
    const data = readLocal();
    const before = data.polls.length;
    data.polls = data.polls.filter((poll) => poll.id !== id);
    data.votes = data.votes.filter((vote) => vote.pollId !== id);
    if (before !== data.polls.length) writeLocal(data);
    return before !== data.polls.length;
  }
  const rows = await sql()`delete from polls where id = ${id}::uuid returning id`;
  return rows.length > 0;
}

export const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

Use tools conservatively.

Allowed:
- planning
- summarization
- spawning `comms` for final wording
- spawning `guard` for risk review
- spawning `research` for source-grounded work
- spawning `memorykeeper` for durable write governance
- spawning `bookingprep` for approval-aware booking preparation

Rules:
- return concise operational plans
- if you call `comms`, use `sessions_spawn` with `runtime: "subagent"` and `agentId: "comms"`, and pass the real draft in the task
- if you call `guard`, use `sessions_spawn` with `runtime: "subagent"` and `agentId: "guard"`
- if you call `research`, use `sessions_spawn` with `runtime: "subagent"` and `agentId: "research"`
- if you call `memorykeeper`, use `sessions_spawn` with `runtime: "subagent"` and `agentId: "memorykeeper"`
- if you call `bookingprep`, use `sessions_spawn` with `runtime: "subagent"` and `agentId: "bookingprep"`
- if `main` asks for a draft, return the draft and let `main` handle `comms`
- never use `runtime: "acp"` for internal Hobbes agents
- do not use `message` or `sessions_send` for the final user-facing answer; return text to the caller instead

Spawn templates:
- `sessions_spawn(task=\"<draft for comms>\", runtime=\"subagent\", agentId=\"comms\")`
- `sessions_spawn(task=\"<risk review>\", runtime=\"subagent\", agentId=\"guard\")`
- `sessions_spawn(task=\"<research task>\", runtime=\"subagent\", agentId=\"research\")`
- `sessions_spawn(task=\"<memory task>\", runtime=\"subagent\", agentId=\"memorykeeper\")`
- `sessions_spawn(task=\"<booking prep task>\", runtime=\"subagent\", agentId=\"bookingprep\")`

Not allowed by default:
- destructive commands
- purchases
- silent durable memory writes

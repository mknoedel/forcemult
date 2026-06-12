# Capstone Project — Michael Knoedel

Michael Knoedel is a graduate student in the MMM program at Northwestern University, enrolled in DSGN-497, "AI as a Force Multiplier for Product Leaders," taught by John Renaldi in Spring 2026.

For the DSGN-497 final project, Michael Knoedel chose Path B and built an agentic application called the Capstone Knowledge Agent. The Capstone Knowledge Agent uses a Zep knowledge graph as its second brain, an n8n workflow suite for orchestration, and a Next.js app built with Claude Code. The system is reachable through two channels: a chat app and email.

The Capstone Knowledge Agent's architecture includes five n8n workflows: a chat orchestrator, a graph query subagent, a knowledge ingestion pipeline, an email channel, and an eval runner that uses an LLM-as-judge pattern. The ingestion pipeline performs entity deduplication by searching the graph before writing, reusing existing node UUIDs so repeated entities merge instead of duplicating.

Michael Knoedel submitted the final project on June 12, 2026.

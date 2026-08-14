# Founder Briefing Copilot

An AI-powered daily briefing generator for founders and leadership teams running fast-moving, multi-workstream organizations. Paste in raw updates from customers, suppliers, and hiring pipelines — get back an instant RED/AMBER/GREEN risk dashboard with AI-generated narrative summaries.

**[Live demo](https://founder-briefing-copilot.vercel.app)** — works immediately with the built-in rule-based risk analysis, no setup required. Adding AI-generated narrative briefings on top needs a free [Anthropic API key](https://console.anthropic.com), used client-side only and never stored or sent anywhere but api.anthropic.com. Please use fictional/sample data only.

## Who it's for

Founders, operations leads, and program/portfolio leads who receive status updates from multiple sources (customers, vendors, internal teams) and need a fast, consistent way to spot risk and decide what needs attention today — without manually re-reading every update themselves.

## Why it matters

Founders and operations leaders at an early-stage biotech startup spend a disproportionate amount of time synthesizing status updates scattered across emails, Slack threads, and meeting notes just to answer a simple question: "what needs my attention today?" This tool turns that synthesis into a 30-second morning ritual, so leadership time goes to decisions, not data-gathering.

## What it does

- Accepts daily operational updates across three categories: customers, suppliers, hiring
- Auto-detects risk signals (delays, blockers, urgency keywords) using rule-based analysis
- Outputs color-coded RAG (Red/Amber/Green) status cards with actionable summaries
- Optional Claude API integration for AI-generated narrative briefings on top of the rule-based signals

## Product decisions that mattered more than the model

1. **Deterministic fallback, not just AI** — if the API is unavailable, the tool still produces a useful keyword-based analysis rather than failing silently
2. **RAG status over raw text** — leaders scan color first, read narrative second; the interface is built around that reading pattern
3. **Three fixed categories, not open-ended tagging** — keeping the input structure simple and consistent makes the daily habit sustainable

## Built with

- React + Vite
- Tailwind CSS
- Claude API (Anthropic)

## Run locally

```bash
npm install
npm run dev
```

## Status

This is a prototype built to explore a problem space — not a finished product. Built by [Jane Natividad](https://github.com/jane-natividad).

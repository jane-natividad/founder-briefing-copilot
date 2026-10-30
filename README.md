# Founder Briefing Copilot

Turns scattered status updates into a 30 second red, amber and green briefing.

**[Try the live demo](https://founder-briefing-copilot.vercel.app)**. It works straight away with no setup. To try the AI step, paste your own LLM API key. It works with any OpenAI compatible API (OpenAI, OpenRouter, Groq, Together, or Llama running on your own machine) or an Anthropic style API. Your key stays in your browser and is only sent to the endpoint you choose. Please use fictional or sample data only.

## Why I built it

Working alongside founders, I noticed how much of their morning went into piecing together updates from email and chat before they could decide anything. I wanted that to take thirty seconds, and to keep working even on days the AI is unavailable.

## The problem

Founders and operations leaders at early stage companies spend a surprising amount of time stitching together updates from customers, suppliers and hiring just to answer one question: what needs my attention today?

## What I built

A daily briefing tool that reads customer, supplier and hiring updates, flags risk with a rule based check, and adds an AI written narrative when you connect your own model.

## Who it's for

Founders, operations leads and program leads juggling updates from many sources.

## What it does

- Accepts daily updates in three simple categories: customers, suppliers and hiring
- Flags risk signals such as delays, blockers and urgency using clear rules
- Shows colour coded status cards with a suggested next action for each
- Adds an AI written chief of staff summary when you connect your own model

## Decisions that shaped it

1. **Always gives an answer:** the rule based analysis works even without an AI model.
2. **Colour first:** leaders scan status before they read the detail.
3. **Three simple categories:** a consistent input makes the daily habit easy to keep.

## Key takeaway

A rule based fallback keeps it useful even when no AI is connected.

## Built with

- React and Vite
- Tailwind CSS
- Any LLM API (optional, bring your own key)

## Run it locally

```bash
npm install
npm run dev
```

## About this project

This is a working prototype I built to explore a real problem space. It uses illustrative, fictional data and isn't connected to any organisation's systems. You can find more of my work at [jane-natividad.github.io](https://jane-natividad.github.io).

Built by [Jane Natividad](https://github.com/jane-natividad).

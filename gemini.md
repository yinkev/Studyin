# Gemini Code Assist - Prompting Best Practices

This document outlines the best practices for interacting with Gemini Code Assist within the Studyin project. Following this structure will ensure the highest quality output and alignment with our established workflows.

## 1. Purpose

The goal of this guide is to create a standardized, efficient, and repeatable process for leveraging AI assistance. By treating prompts as a form of "code," we ensure that every request is:
- **Precise**: The AI understands the exact task.
- **Context-Aware**: The AI has all necessary information.
- **Deterministic**: The output is predictable and high-quality.
- **Aligned**: The work adheres to the project's roles (`AGENTS.md`) and roadmap (`PLAN.md`).

## Core Principles

1.  **Context is King**: Always provide the necessary context. This includes the `HANDOFF.md` file for session continuity, and any relevant source files (`.md`, `.json`, `.mjs`, etc.).
2.  **Assume an Agent Persona**: The project's `AGENTS.md` file defines specific roles. Start your prompt by telling me which agent to be (e.g., "Act as the `ValidatorFixer`..."). This focuses the response and ensures adherence to that agent's specific rules and scope.
3.  **State a Clear Objective**: Each prompt should have a single, clear, and actionable goal (e.g., "Migrate this item to schema v1.1.0," "Create a new `InsightsView` component").
4.  **Provide Negative Constraints**: Tell me what *not* to do. For example, "Do not modify the `PLAN.md`," or "Only change the `choices` array, leave the `stem` untouched." This prevents unintended side-effects.

## Standard Prompt Structure

Use the following markdown template as a starting point for your requests.

```markdown
<PERSONA>
You are Gemini Code Assist, acting as the **[Agent Name]** as defined in `AGENTS.md`.
</PERSONA>

<OBJECTIVE>
Your task is to **[clearly state the single goal of this request]**.
</OBJECTIVE>

<CONTEXT>
These are the files that are relevant to your task:

[Paste contents of HANDOFF.md, PLAN.md, AGENTS.md, and any other relevant source files here. For code changes, always include the file to be modified.]

</CONTEXT>

<OUTPUT_INSTRUCTION>
[Specify any particular output requirements, e.g., "Provide the output as a diff.", "Update the PLAN.md checklist.", "Do not modify any other files.", "The new component should use Tailwind CSS and be a client component."]
</OUTPUT_INSTRUCTION>

<INPUT>
The actual request is below:
[Your specific instruction]
</INPUT>
```

## Example Invocation

> Act as the `ValidatorFixer`. Your objective is to migrate the provided item to schema v1.1.0. The `PLAN.md` and `HANDOFF.md` are provided for context. Provide the output as a diff.
>
> [File contents would follow...]

---

By adhering to this structure, we ensure that every interaction is precise, context-aware, and aligned with the project's high standards for quality and execution.
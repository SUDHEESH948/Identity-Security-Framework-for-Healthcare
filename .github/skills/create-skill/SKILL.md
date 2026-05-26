---
name: create-skill
description: 'Guide users through creating a new VS Code agent skill file (SKILL.md) for project or personal customization. Use when you want to define on-demand workflows, reusable procedures, and skill metadata.'
argument-hint: 'Describe the workflow or task the skill should support.'
user-invocable: true
---

# Create Skill

## When to Use
- You want to add a new project-scoped or personal skill to VS Code.
- You need a reusable workflow with structured steps and asset references.
- You are creating a skill for coding workflows, build tasks, or project-specific automation.

## What This Skill Produces
- A properly structured `SKILL.md` file in `.github/skills/<name>/`.
- YAML frontmatter with `name`, `description`, and optional `argument-hint`.
- Guidance for writing body content that includes purpose, usage, and procedure.

## Procedure
1. Choose a clear skill name using lowercase letters and hyphens only.
2. Write a short description that explains what the skill does and when to use it.
3. Add an `argument-hint` if the skill accepts a slash-command prompt input.
4. Decide whether the skill should be user-invocable and set `user-invocable: true` or `false`.
5. Save the `SKILL.md` file under `.github/skills/<name>/SKILL.md`.
6. If the workflow requires scripts or references, add them to `./scripts/` or `./references/`.

## Notes
- Keep workflows concise and keyword-rich for discovery.
- Use relative references like `./scripts/example.js` in the body.
- Match the `name` field exactly with the folder name.

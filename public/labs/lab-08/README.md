# Lab 08 — Live Quiz with fetch()

This Chapter 8 lab loads quiz settings and questions from JSON files with the Fetch API. It validates each question, skips invalid entries with a warning, gives immediate answer feedback, calculates the result, and saves a best score in localStorage.

## Run locally

Serve the repository's `public` directory with a local web server, then open `labs/lab-08/`. For example, in VS Code use Live Server on `index.html`. Fetch requests do not work from a `file://` URL.

The supplied questions intentionally include one invalid answer index to demonstrate validation and the skipped-question warning. Rename or temporarily move `data/questions.json` to see the load-error and retry state.

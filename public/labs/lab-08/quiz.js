/* GIN446 · Chapter 8 · Lab 08 — Live Quiz with fetch() */
"use strict";

const INFO_URL = "data/quiz-info.json";
const QUESTIONS_URL = "data/questions.json";
const BEST_KEY = "gin446-ch08-live-quiz-best";

let info = null;
let questions = [];
let current = 0;
let score = 0;

const $ = (id) => document.getElementById(id);
function show(id) { $(id).classList.remove("hidden"); }
function hide(id) { $(id).classList.add("hidden"); }
function wait(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function getJSON(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return response.json();
}

function validateQuestion(q) {
  if (!q || typeof q.question !== "string" || q.question.trim() === "") {
    throw new Error("missing question text");
  }
  if (!Array.isArray(q.choices) || q.choices.length < 2 ||
      !q.choices.every((choice) => typeof choice === "string" && choice.trim() !== "")) {
    throw new Error("needs at least 2 non-empty choices");
  }
  if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.choices.length) {
    throw new RangeError("answer index out of range: " + q.answer);
  }
}

async function loadQuiz() {
  hide("error");
  hide("warning");
  hide("quiz");
  hide("result");
  show("loader");

  try {
    await wait(600);
    const infoPromise = getJSON(INFO_URL);
    const questionsPromise = getJSON(QUESTIONS_URL);
    const [quizInfo, all] = await Promise.all([infoPromise, questionsPromise]);

    if (!quizInfo || typeof quizInfo.title !== "string" ||
        !Number.isFinite(quizInfo.passMark)) {
      throw new Error("quiz info is invalid");
    }
    if (!Array.isArray(all)) {
      throw new Error("questions file must contain an array");
    }

    info = quizInfo;
    const skipped = [];
    questions = [];
    all.forEach((question, index) => {
      try {
        validateQuestion(question);
        questions.push(question);
      } catch (err) {
        skipped.push(`#${index + 1} ${err.name}: ${err.message}`);
      }
    });

    if (questions.length === 0) {
      throw new Error("the file contains no valid question");
    }
    if (skipped.length > 0) {
      $("warning").textContent = `Skipped invalid questions: ${skipped.join("; ")}`;
      show("warning");
    }

    $("quiz-title").textContent = info.title;
    startQuiz();
  } catch (error) {
    $("error-msg").textContent = "Could not load the quiz: " + error.message;
    show("error");
  } finally {
    hide("loader");
  }
}

function startQuiz() {
  current = 0;
  score = 0;
  hide("result");
  show("quiz");
  showQuestion();
}

function showQuestion() {
  const q = questions[current];
  $("progress").textContent = `Question ${current + 1} / ${questions.length}`;
  $("question").textContent = q.question;
  $("feedback").textContent = "";
  $("feedback").className = "feedback";
  $("next").disabled = true;
  $("next").textContent = current === questions.length - 1 ? "See my score" : "Next";

  const box = $("choices");
  box.textContent = "";
  q.choices.forEach((choice, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice";
    button.textContent = choice;
    button.addEventListener("click", () => checkAnswer(index));
    box.appendChild(button);
  });
}

function checkAnswer(index) {
  const q = questions[current];
  const buttons = $("choices").querySelectorAll("button");
  buttons.forEach((button, choiceIndex) => {
    button.disabled = true;
    if (choiceIndex === q.answer) button.classList.add("correct");
  });

  if (index === q.answer) {
    score++;
    $("feedback").textContent = "Correct!";
    $("feedback").className = "feedback ok";
  } else {
    buttons[index].classList.add("wrong");
    $("feedback").textContent = `Wrong – the answer is: ${q.choices[q.answer]}`;
    $("feedback").className = "feedback bad";
  }
  $("next").disabled = false;
}

$("next").addEventListener("click", () => {
  current++;
  if (current < questions.length) showQuestion();
  else finishQuiz();
});

function readBestScore() {
  const text = localStorage.getItem(BEST_KEY);
  if (text === null) return null;

  try {
    const best = JSON.parse(text);
    if (!best || typeof best.score !== "number" || !Number.isFinite(best.score) ||
        typeof best.total !== "number" || !Number.isFinite(best.total) ||
        best.total <= 0 || best.score < 0 || best.score > best.total) {
      throw new Error("invalid saved score");
    }
    return best;
  } catch (error) {
    localStorage.removeItem(BEST_KEY);
    return null;
  }
}

function saveBestScore(newScore, total) {
  const best = readBestScore();
  if (!best || newScore / total > best.score / best.total) {
    localStorage.setItem(BEST_KEY, JSON.stringify({
      score: newScore,
      total,
      date: new Date().toLocaleDateString()
    }));
    return true;
  }
  return false;
}

function showBestScore() {
  const best = readBestScore();
  $("best").textContent = best
    ? `Best score: ${best.score} / ${best.total} (${best.date || "date unavailable"})`
    : "Best score: – (no game yet)";
}

function finishQuiz() {
  hide("quiz");
  show("result");
  const percent = Math.round(score / questions.length * 100);
  $("score").textContent = `${score} / ${questions.length}  (${percent} %)`;

  if (percent >= info.passMark) {
    $("verdict").textContent = "Passed ✔";
    $("verdict").className = "verdict ok";
  } else {
    $("verdict").textContent = `Not passed – ${info.passMark} % needed`;
    $("verdict").className = "verdict bad";
  }

  if (saveBestScore(score, questions.length)) {
    $("verdict").textContent += " · New best score!";
  }
  showBestScore();
}

$("retry").addEventListener("click", loadQuiz);
$("restart").addEventListener("click", startQuiz);

showBestScore();
loadQuiz();

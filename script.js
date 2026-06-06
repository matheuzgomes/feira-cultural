// Adicione ou edite as perguntas do quiz neste array.
const questions = [
  {
    question: "Todos os povos indígenas do Brasil são iguais?",
    answers: ["Sim", "Não"],
    correctAnswer: 1,
  },
  {
    question: "Os povos indígenas possuem culturas entre si?",
    answers: ["Sim", "Não"],
    correctAnswer: 0,
  },
  {
    question: "Quantas línguas indígenas existem no Brasil atualmente?",
    answers: ["Menos de 20", "Cerca de 80", "Mais de 150", "Apenas uma"],
    correctAnswer: 2,
  },
  {
    question: "É verdade que indígenas não podem usar celular ou internet?",
    answers: ["Sim", "Não",],
    correctAnswer: 1,
  },
  {
    question: "Qual destes alimentos tem origem indígena?",
    answers: ["Mandioca", "Milho", "Açaí", "Todas as alternativas"],
    correctAnswer: 3,
  },
  {
    question: "O preconceito contra indígenas pode acontecer por meio de:",
    answers: ["Piadas", "Xingamentos", "Estereótipos", "Todas as alternativas"],
    correctAnswer: 3,
  },
  {
    question: "Qual destes objetos tem forte influência indígena?",
    answers: ["Rede de dormir", "Arco e flecha", "Canoa", "Todas as anteriores"],
    correctAnswer: 3,
  },
  {
    question: "Respeitar os povos indígenas significa:",
    answers: [
      "Valorizar seus direitos e culturas",
      "Fazer piadas sobre eles",
      "Ignorar suas tradições",
      "Impedir o uso de novas tecnologias",
    ],
    correctAnswer: 0,
  },
  {
    question: "O Dia dos Povos Indígenas no Brasil é comemorado em:",
    answers: ["7 de setembro", "19 de abril", "15 de novembro", "22 de abril"],
    correctAnswer: 1,
  },
  {
    question: "Qual destes é um povo indígena brasileiro?",
    answers: ["Guarani", "Yanomami", "Kayapó", "Todas as alternativas"],
    correctAnswer: 3,
  },
];

const scorePerQuestion = 100;
const answerLetters = ["A", "B", "C", "D"];

const quizCard = document.querySelector("#quiz-card");
const resultCard = document.querySelector("#result-card");
const questionElement = document.querySelector("#question");
const answersElement = document.querySelector("#answers");
const questionCountElement = document.querySelector("#question-count");
const progressBar = document.querySelector("#progress-bar");
const scoreElement = document.querySelector("#score");
const feedbackElement = document.querySelector("#feedback");
const confirmButton = document.querySelector("#confirm-button");
const buttonLabel = document.querySelector("#button-label");
const resultMessage = document.querySelector("#result-message");
const finalScore = document.querySelector("#final-score");
const restartButton = document.querySelector("#restart-button");
const appShell = document.querySelector(".app-shell");
const videoModal = document.querySelector("#video-modal");
const videoCloseButton = document.querySelector("#video-close");
const videoDock = document.querySelector("#video-dock");
const videoLoading = document.querySelector("#video-loading");
const videoStatus = document.querySelector("#video-status");
const videoFallback = document.querySelector("#video-fallback");

const youtubeVideoId = "MlJ6IjZYWyI";
const canEmbedYouTube = ["http:", "https:"].includes(window.location.protocol);

let currentQuestionIndex = 0;
let selectedAnswerIndex = null;
let score = 0;
let answerWasChecked = false;
let youtubePlayer = null;
let youtubePlayerReady = false;
let videoHasOpened = false;
let pendingQuestionAdvance = false;

function showVideoFallback(message) {
  youtubePlayerReady = false;
  document.querySelector("#youtube-player")?.setAttribute("hidden", "");
  videoStatus.textContent = message;
  videoFallback.hidden = false;
  videoLoading.classList.remove("is-ready");
  videoLoading.classList.add("is-error");
}

function createYouTubePlayer() {
  if (!canEmbedYouTube || youtubePlayer || !window.YT?.Player) return;

  youtubePlayer = new window.YT.Player("youtube-player", {
    videoId: youtubeVideoId,
    playerVars: {
      autoplay: 0,
      controls: 1,
      playsinline: 1,
      rel: 0,
      origin: window.location.origin,
      widget_referrer: window.location.href,
    },
    events: {
      onReady: () => {
        youtubePlayerReady = true;
        videoLoading.classList.add("is-ready");
      },
      onError: (event) => {
        const message = event.data === 153
          ? "O YouTube não conseguiu identificar este site para reproduzir o vídeo."
          : "O YouTube bloqueou a reprodução deste vídeo incorporado.";
        showVideoFallback(message);
      },
    },
  });
}

window.onYouTubeIframeAPIReady = createYouTubePlayer;

function initializeYouTube() {
  if (!canEmbedYouTube) {
    showVideoFallback("A reprodução incorporada estará disponível quando o quiz for publicado em um site.");
    return;
  }

  const script = document.createElement("script");
  script.src = "https://www.youtube.com/iframe_api";
  script.async = true;
  script.onerror = () => {
    showVideoFallback("Não foi possível carregar o player do YouTube.");
  };
  document.head.append(script);
}

function openVideoModal({ advanceAfterClose = false } = {}) {
  const isReopening = videoHasOpened;

  pendingQuestionAdvance = advanceAfterClose;
  videoHasOpened = true;
  videoDock.hidden = true;
  videoModal.hidden = false;
  document.body.classList.add("video-modal-open");
  appShell.inert = true;
  appShell.setAttribute("aria-hidden", "true");
  videoCloseButton.focus();

  if (isReopening && youtubePlayerReady) {
    youtubePlayer.playVideo();
  }
}

function closeVideoModal() {
  if (videoModal.hidden) return;

  if (youtubePlayerReady) {
    youtubePlayer.pauseVideo();
  }

  const shouldAdvance = pendingQuestionAdvance;
  pendingQuestionAdvance = false;
  videoModal.hidden = true;
  videoDock.hidden = false;
  document.body.classList.remove("video-modal-open");
  appShell.inert = false;
  appShell.removeAttribute("aria-hidden");

  if (shouldAdvance && currentQuestionIndex < questions.length - 1) {
    currentQuestionIndex += 1;
    renderQuestion();
    requestAnimationFrame(() => questionElement.focus());
    return;
  }

  videoDock.focus();
}

function keepFocusInsideVideoModal(event) {
  if (event.key !== "Tab" || videoModal.hidden) return;

  const focusableElements = [...videoModal.querySelectorAll("button, a, iframe")]
    .filter((element) => !element.hidden && !element.hasAttribute("disabled"));
  const firstElement = focusableElements[0];
  const lastElement = focusableElements.at(-1);

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}

function renderQuestion() {
  const currentQuestion = questions[currentQuestionIndex];

  selectedAnswerIndex = null;
  answerWasChecked = false;
  questionElement.textContent = currentQuestion.question;
  questionCountElement.textContent = `Pergunta ${currentQuestionIndex + 1} de ${questions.length}`;
  progressBar.style.width = `${((currentQuestionIndex + 1) / questions.length) * 100}%`;
  feedbackElement.textContent = "Escolha uma alternativa para continuar.";
  feedbackElement.className = "feedback";
  buttonLabel.textContent = "Confirmar resposta";
  confirmButton.disabled = true;
  answersElement.replaceChildren();

  currentQuestion.answers.forEach((answer, index) => {
    const button = document.createElement("button");
    const letter = answerLetters[index] ?? String(index + 1);

    button.className = "answer";
    button.type = "button";
    button.dataset.index = index;
    button.setAttribute("aria-pressed", "false");
    button.innerHTML = `
      <span class="answer__letter" aria-hidden="true">${letter}</span>
      <span class="answer__text"></span>
    `;
    button.querySelector(".answer__text").textContent = answer;
    button.addEventListener("click", () => selectAnswer(index));
    answersElement.append(button);
  });
}

function selectAnswer(index) {
  if (answerWasChecked) return;

  selectedAnswerIndex = index;
  confirmButton.disabled = false;

  document.querySelectorAll(".answer").forEach((answerButton) => {
    const isSelected = Number(answerButton.dataset.index) === index;
    answerButton.classList.toggle("is-selected", isSelected);
    answerButton.setAttribute("aria-pressed", String(isSelected));
  });

  feedbackElement.textContent = `Alternativa ${answerLetters[index]} selecionada.`;
}

function checkAnswer() {
  const currentQuestion = questions[currentQuestionIndex];
  const answerButtons = document.querySelectorAll(".answer");
  const isCorrect = selectedAnswerIndex === currentQuestion.correctAnswer;

  answerWasChecked = true;
  answerButtons.forEach((button, index) => {
    button.disabled = true;
    button.classList.remove("is-selected");

    if (index === currentQuestion.correctAnswer) {
      button.classList.add("is-correct");
    } else if (index === selectedAnswerIndex) {
      button.classList.add("is-wrong");
    }
  });

  if (isCorrect) {
    score += scorePerQuestion;
    scoreElement.textContent = String(score).padStart(3, "0");
    feedbackElement.textContent = "Resposta certa! Você ganhou 100 pontos.";
    feedbackElement.className = "feedback is-success";
  } else {
    feedbackElement.textContent = "Não foi dessa vez. A resposta correta está destacada.";
    feedbackElement.className = "feedback is-error";
  }

  buttonLabel.textContent = currentQuestionIndex === questions.length - 1
    ? "Ver resultado"
    : "Próxima pergunta";

  if (currentQuestionIndex === 1 && !videoHasOpened) {
    window.setTimeout(() => {
      if (currentQuestionIndex === 1 && answerWasChecked && !videoHasOpened) {
        openVideoModal({ advanceAfterClose: true });
      }
    }, 650);
  }
}

function showNextStep() {
  if (!answerWasChecked) {
    checkAnswer();
    return;
  }

  if (currentQuestionIndex === 1 && !videoHasOpened) {
    openVideoModal({ advanceAfterClose: true });
    return;
  }

  if (currentQuestionIndex < questions.length - 1) {
    currentQuestionIndex += 1;
    renderQuestion();
    return;
  }

  showResults();
}

function showResults() {
  const correctAnswers = score / scorePerQuestion;
  const total = questions.length;

  quizCard.hidden = true;
  resultCard.hidden = false;
  finalScore.textContent = score;
  resultMessage.textContent = `Você acertou ${correctAnswers} de ${total} ${total === 1 ? "pergunta" : "perguntas"}. Continue explorando, aprendendo e transformando!`;
  restartButton.focus();
}

function restartQuiz() {
  currentQuestionIndex = 0;
  selectedAnswerIndex = null;
  score = 0;
  answerWasChecked = false;
  videoHasOpened = false;
  pendingQuestionAdvance = false;
  scoreElement.textContent = "000";
  videoDock.hidden = true;
  resultCard.hidden = true;
  quizCard.hidden = false;

  if (youtubePlayerReady) {
    youtubePlayer.pauseVideo();
    youtubePlayer.seekTo(0, true);
  }

  renderQuestion();
}

confirmButton.addEventListener("click", showNextStep);
restartButton.addEventListener("click", restartQuiz);
videoCloseButton.addEventListener("click", closeVideoModal);
videoDock.addEventListener("click", () => openVideoModal());

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !videoModal.hidden) {
    closeVideoModal();
    return;
  }

  keepFocusInsideVideoModal(event);

  if (!videoModal.hidden) return;
  if (quizCard.hidden || answerWasChecked) return;

  const keyIndex = ["1", "2", "3", "4"].indexOf(event.key);
  if (keyIndex !== -1 && keyIndex < questions[currentQuestionIndex].answers.length) {
    selectAnswer(keyIndex);
  }
});

initializeYouTube();
renderQuestion();

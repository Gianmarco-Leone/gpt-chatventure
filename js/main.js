/********************************
 *                              *
 *           ON LOAD            *
 *                              *
 *******************************/

// Configurazione di ChatGPT
const API_BASE_URL = 'https://api.openai.com/v1';
const API_KEY = ''; // La API KEY non si può pushare
const GPT_MODEL = 'gpt-3.5-turbo';

// Dichiaro variabile che contiene chat come array vuoto
const completeChat = [];

// Recuperiamo gli elementi principali dalla pagina
const loader = document.querySelector('.loader');
const genreButtons = document.querySelectorAll('.genre');
const placeholder = document.querySelector('#placeholder');
const stageTemplate = document.querySelector('#stage-template');
const gameoverTemplate = document.querySelector('#gameover-template');

// Dichiaro variabile per il genere selezionato
let selectedGenre;


/********************************
 *                              *
 *           ON CLICK           *
 *                              *
 *******************************/

// Cliccando uno dei bottoni del genere devo impostarlo come genere del game e dare inizio al gioco
genreButtons.forEach(function (button) {
  button.addEventListener('click', function () {
    selectedGenre = button.dataset.genre;
    // console.log(selectedGenre);
    startGame();
  });
});


/********************************
 *                              *
 *           FUNCTIONS          *
 *                              *
 *******************************/

/**
 * funzione che aggiunge all'html la classe dinamica game-started,
 * aggiunge all'array che contiene la chat le istruzioni principali
 * per ChatGPT (vedi doc) e aggiunge un livello
 * 
 */

function startGame() {
  // Aggiungo classe "game-started"
  document.body.classList.add('game-started');

  // Aggiungo istruzioni principali all'array che contiene la chat
  completeChat.push({
    role: `system`, // * come si deve comportare ChatGPT
    content: `Voglio che ti comporti come se fossi un classico gioco di avventura testuale. Io sarò il protagonista e giocatore principale. Non fare riferimento a te stesso. L\'ambientazione di questo gioco sarà a tema ${selectedGenre}. Ogni ambientazione ha una descrizione di 150 caratteri seguita da una array di 3 azioni possibili che il giocatore può compiere. Una di queste azioni è mortale e termina il gioco. Non aggiungere mai altre spiegazioni. Non fare riferimento a te stesso. Le tue risposte sono solo in formato JSON come questo esempio:\n\n###\n\n{"description":"descrizione ambientazione","actions":["azione 1", "azione 2", "azione 3"]}###`
  });

  // Aggiungo livello
  setStage();
}

/**
 * funzione che aggiunge livello recuperando informazioni da ChatGPT
 * e stampa a schermo immagini e opzioni di gioco possibili oppure
 * termina gioco se non vengono trovati opzioni nella risposta di 
 * ChatGPT
 * 
 */

async function setStage() {
  // Aggiorno il placeholder svuotandolo ad ogni giro
  placeholder.innerHTML = '';

  // Mostro il loader durante il caricamento
  loader.classList.remove('hidden');

  // Invio istruzioni a ChatGPT tramite metodo makeRekuest
  const gptResponse = await makeRequest('/chat/completions', {
    temperature: 0.7,
    model: GPT_MODEL,
    messages: completeChat
  });

  // Terminato il caricamento faccio scomparire il loader
  loader.classList.add('hidden');

  // Aggiungo il messaggio allo storico della chat (devo memorizzarei vari messaggi inviati)
  const message = gptResponse.choices[0].message;
  completeChat.push(message);

  // Recuperare informazioni che mi servono dal contenuto del messaggio
  const content = JSON.parse(message.content);
  const actions = content.actions;
  const description = content.description;
  // console.log(actions);
  // console.log(description);

  // SE l'array delle opzioni possibili è vuoto termino il gioco
  if (actions.length === 0) {
    setGameOver(description);
  } else {
    // Mostro descrizione livello
    setStageDescription(description);

    // Mostro immagine livello
    await setStagePicture(description);

    // Mostro azioni possibili
    setStageActions(actions);
  }
}


/**
 * funzione che effettua richiesta all'API di ChatGPT
 * 
 * @param {String} endpoint parte fissa dell'url
 * @param {object} payload parametri della richiesta per ChatGPT
 */

async function makeRequest(endpoint, payload) {
  const url = API_BASE_URL + endpoint;

  // Effettuo chiamata API
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + API_KEY
    }
  });

  // Salvo risposta
  const jsonResponse = await response.json();
  return jsonResponse;
}


/**
 * funzione per mostrare descrizione livello
 * 
 * @param {String} description frase necessaria per far capire alla 
 * chat che descrizione generare
 */

function setStageDescription(description) {
  // Clono template stage
  const stageElement = stageTemplate.content.cloneNode(true);

  // Aggiungo descrizione
  stageElement.querySelector('.stage-description').innerText = description;

  // Aggiungo template
  placeholder.appendChild(stageElement);
}


/**
 * funzione per mostrare immagine livello
 * 
 * @param {String} description frase necessaria per far capire alla 
 * chat che immagine generare
 */

async function setStagePicture(description) {
  // Chiedo a OpenAI di generare un'immagine
  const generatedImage = await makeRequest('/images/generations', {
    n: 1,
    size: '512x512',
    response_format: 'url',
    prompt: `questa è una storia basata su ${selectedGenre}. ${description}`
  });

  // Recupero url da risposta API
  const imageUrl = generatedImage.data[0].url;

  // Creiamo elemento HTML
  const image = `<img alt="${description}" src="${imageUrl}">`;

  // Aggiungo all'html
  document.querySelector('.stage-picture').innerHTML = image;
}


/**
 * funzione per mostrare opzioni livello
 * 
 * @param {Array} actions Array con tutte le opzioni disponibili
 */

function setStageActions(actions) {

  // Dichiaro variabili per le opzioni disponibili
  let actionsHTML = '';

  // Per ogni opzione possibile genero un bottone
  actions.forEach(function (action) {
    actionsHTML += `<button>${action}</button>`;
  });

  // Aggiungo all'HTML
  document.querySelector('.stage-actions').innerHTML = actionsHTML;

  // Recupero i bottoni appena aggiunti
  const actionButtons = document.querySelectorAll('.stage-actions button');


  actionButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      // Recupero azione scelta
      const selectedAction = button.innerText;

      // Aggiungo istruzioni all'array che contiene la chat
      completeChat.push({
        role: `user`,
        content: `${selectedAction}. Se questa azione è mortale l'elenco delle azioni è vuoto. Non dare altro testo che non sia un oggetto JSON. Le tue risposte sono solo in formato JSON come questo esempio:\n\n###\n\n{"description": "sei morto per questa motivazione", "actions": []}###`
      });

      // Aggiungo livello
      setStage();
    })
  });
  // console.log(actionsHTML);
}


/**
 * funzione per terminare gioco e stampa a schermo il messaggio nella
 * description
 * 
 * @param {String} description messaggio di game over
 */

function setGameOver(description) {
  // Clono template gameover
  const gameoverElement = gameoverTemplate.content.cloneNode(true);

  // Aggiungo description all'HTML
  gameoverElement.querySelector('.gameover-message').innerText = description;

  // Aggiungo template
  placeholder.appendChild(gameoverElement);

  // Recupero bottone
  const replayButton = document.querySelector('.gameover button');

  replayButton.addEventListener('click', function () {
    // Ricarico pagina e riporto tutto a condizioni di start
    window.location.reload();
  })

}
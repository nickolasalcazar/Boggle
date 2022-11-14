class Trie {
  constructor() {
    this.children = {};
  }

  insert(word) {
    var cur = this;
    for (let i = 0; i < word.length; i++) {
      let c = word[i];
      if (!cur.children[c]) cur.children[c] = new Trie();
      cur = cur.children[c];
    }
    cur.isWord = true;
  }

  isWord(word) {
    let cur = this;
    for (let i = 0; i < word.length; i++) {
      let c = word[i];
      if (!cur.children[c]) return false;
      cur = cur.children[c];
    }
    return cur.isWord === true;
  }

  isPrefix(prefix) {
    let cur = this;
    for (let i = 0; i < prefix.length; i++) {
      let c = prefix[i];
      if (!cur.children[c]) return false;
      cur = cur.children[c];
    }
    return true;
  }
}
/***************************************************************/

// Initializes the Trie Tree dictionary.
let words = [0];
let dict = new Trie();

async function initDict() {
  try {
    let response = await fetch(
      "https://raw.githubusercontent.com/redbo/scrabble/master/dictionary.txt"
    );
    let data = await response.text();
    let words = await data.split("\n");
    words.forEach((word) => {
      dict.insert(word);
    });
  } catch (error) {
    console.log(error);
  }
}
initDict();

/***************************************************************/
// Gameplay

let score = 0;
let scoredWords = [];

let scoreHTML = document.getElementById("score");
let searchedListHTML = document.getElementById("searched-list");

// Buttons
let playButton = document.getElementById("play");
let revealButton = document.getElementById("reveal-words");

let solutions = [];
let solutionsHTML = document.getElementById("solutions-list");

let gameActive = false;
let displayTiles = false;

let countdown; // Global variable for countdown timer

// This sets what color the tiles changes to when it is search over
let activeColor = "lightblue";

let word = ""; // The word formed by the player as they search
let searched = []; // Array that contains searched indexes

// Store all tiles into one array
let tiles = [...document.querySelectorAll(".tile")];

/*
 * Initializes board. Adds events listeners to each tile.
 */
function initializeBoard() {
  for (let i = 0; i < tiles.length; i++) {
    tiles[i].addEventListener("click", (e) => {
      if (!gameActive || searched.includes(i)) return;

      let tile = tiles[i];
      let prevTile = tiles[searched[searched.length - 1]];
      let j = searched[searched.length - 1]; // Index of previous tile

      let searchable = []; // Contains all indexes that can be searched next

      if (word.length == 0) {
        word += tile.textContent;
        searched.push(i);
        queryTiles(tile);
      } else if (prevTile.classList.contains("left-side")) {
        searchable = [j - 4, j - 3, j + 1, j + 4, j + 5].filter(
          (k) => k > -1 && k < 16
        );
        if (searchable.includes(i)) {
          word += tile.textContent;
          searched.push(i);
          queryTiles(tile);
        }
      } else if (prevTile.classList.contains("right-side")) {
        searchable = [j - 5, j - 4, j - 1, j + 3, j + 4].filter(
          (k) => k > -1 && k < 16
        );
        if (searchable.includes(i)) {
          word += tile.textContent;
          searched.push(i);
          queryTiles(tile);
        }
      } else {
        searchable = [
          j - 5,
          j - 4,
          j - 3,
          j - 1,
          j + 1,
          j + 3,
          j + 4,
          j + 5,
        ].filter((k) => k > -1 && k < 16);
        if (searchable.includes(i)) {
          word += tile.textContent;
          searched.push(i);
          queryTiles(tile);
        }
      }
    });
  }
}

// The game starts with all tiles hidden
tiles.forEach((tile) => {
  tile.children[0].style.visibility = "hidden";
});

/*
 * Checks if word is a valid prefix.
 * If not a valid prefix, the board will handle accordingly
 * If a valid prefix,
 * 		If isWord
 *			handle board and word accordingly
 *		else do nothing (the prefix is a valid path, keep searching!)
 */
function queryTiles(currTile) {
  // Is prefix?
  if (isPrefix(word)) {
    currTile.style.backgroundColor = activeColor;
    // Is new valid word?
    let isWord = isValidWord(word);
    if (isWord && !scoredWords.includes(word)) {
      searched.forEach((i) => {
        tiles[i].style.backgroundColor = "lightgreen";
      });
      tallyScore();
      setTimeout(resetSearch, 250); // Should transition out *****
      // Are we at a deadEnd?
    } else if (deadEnd(currTile)) {
      searched.forEach((i) => {
        tiles[i].style.backgroundColor = "lightcoral";
      });
      tallyScore();
      setTimeout(resetSearch, 250);
    }
  } else {
    // Not a valid prefix, do fail sequence
    searched.forEach((i) => {
      tiles[i].style.backgroundColor = "lightcoral";
    });
    tallyScore();
    setTimeout(resetSearch, 250); // Should transition out *****
  }
}

/*
 * deadEnd returns true if player reached a dead end in their query,
 * i.e. checks if all subsequent tiles will result in an invalid prefix.
 *
 * This is meant to save the player time by avoiding the case where
 * the player is forced to input an invalid prefix in order to proceed
 * with the game. This function detects such a scenario and automatically
 * fails the query in order to let the game proceed faster.
 */
function deadEnd(tile) {
  if (searched.length == 1) return false;
  let index = searched[searched.length - 1];
  let searchable = [];

  if (tile.classList.contains("left-side")) {
    searchable = [index - 4, index - 3, index + 1, index + 4, index + 5].filter(
      (i) => i > -1 && i < 16
    );
    for (let i = 0; i < searchable.length; i++)
      if (
        isPrefix(word + tiles[searchable[i]].textContent) &&
        !searched.includes(searchable[i])
      )
        return false;
  } else if (tile.classList.contains("right-side")) {
    searchable = [index - 5, index - 4, index - 1, index + 3, index + 4].filter(
      (i) => i > -1 && i < 16
    );
    for (let i = 0; i < searchable.length; i++)
      if (
        isPrefix(word + tiles[searchable[i]].textContent) &&
        !searched.includes(searchable[i])
      )
        return false;
  } else {
    searchable = [
      index - 5,
      index - 4,
      index - 3,
      index - 1,
      index + 1,
      index + 3,
      index + 4,
      index + 5,
    ].filter((i) => i > -1 && i < 16);
    for (let i = 0; i < searchable.length; i++)
      if (
        isPrefix(word + tiles[searchable[i]].textContent) &&
        !searched.includes(searchable[i])
      )
        return false;
  }
  return true;
}

/*
 * Play button. Starts new game. Sets gameActive to true.
 */
playButton.addEventListener("click", () => {
  startGame();
  playButton.setAttribute("disabled", "disabled");
  revealButton.removeAttribute("disabled");
});

/*
 * Reveal all words button. Ends game and stops timer.
 */
revealButton.addEventListener("click", () => {
  gameActive = false;
  revealButton.setAttribute("disabled", "disabled");
  playButton.removeAttribute("disabled");
  clearTimeout(countdown);
  resetTiles();
  revealAll();
});

/*
 * Starts new game. Randomizes board.
 */
function startGame() {
  score = 0;
  scoreHTML.textContent = "0";
  resetSearch();
  initializeBoard();
  randomize();
  gameActive = true;
  activateTimer(60); // 60 seconds to play
  tiles.forEach((tile) => {
    tile.children[0].style.visibility = "visible";
  });
  searchedListHTML.innerHTML = "";
  solutionsHTML.innerHTML = "";
}

/*
 * Counts down number of seconds specified by timeleft.
 * When countdown ends, gameActive is set to false
 * and the "play" button is un-disabled.
 * Formatting issue occurs when counting down from more than 60 seconds;
 * implemented to only count down from no more than 60 seconds.
 */
function activateTimer(timeleft) {
  let timer = document.getElementById("timer");
  timer.children[0].textContent = "1:00";
  countdown = setInterval(() => {
    timeleft--;
    timer.children[0].textContent = "0:" + ("0" + timeleft).slice(-2);
    if (timeleft == 0) {
      clearInterval(countdown);
      gameActive = false;
      resetSearch();
      document.getElementById("play").removeAttribute("disabled");
      revealAll();
      revealButton.setAttribute("disabled", "disabled");
    }
  }, 1000);
}

/*
 * Resets search.
 * Resets previously visited indexes and search word.
 * Resets all tiles to their initial, inactive states.
 * Resets tile colors to original color.
 */
function resetSearch() {
  searched = [];
  word = "";
  resetTiles();
}

/*
 * Resets tiles to their dafault states. Recolors tiles to their defaults.
 */
function resetTiles() {
  tiles.forEach((tile) => {
    tile.style.backgroundColor = "white";
  });
}

/*
 * Returns if prefix p is a prefix.
 * Uses toUpperCase() because dictionary is in upper case.
 */
function isPrefix(p) {
  return dict.isPrefix(p.toUpperCase());
}

/*
 * Check if word w is a valid, score-able word.
 */
function isValidWord(w) {
  if (w.length < 3 || !gameActive) return false;
  return dict.isWord(w.toUpperCase());
}

/*
 * Keeps track of score for player. (Single-player implementation.)
 * Tallies scores based on word length of searched word.
 */
function tallyScore() {
  // Not a word
  if (!isValidWord(word)) {
    searchedListHTML.insertAdjacentHTML(
      "afterbegin",
      `<li style="color: red">"${word}" - not a word</li>`
    );
    return;
  } else if (scoredWords.includes(word)) {
    searchedListHTML.insertAdjacentHTML(
      "afterbegin",
      `<li style="color: orange">"${word}" - already scored</li>`
    );
    return;
  }

  // Add searched word to diplayed list of searched words
  searchedListHTML.insertAdjacentHTML(
    "afterbegin",
    `<li style="color: green">"${word}" - is a word</li>`
  );

  scoredWords.push(word);
  let len = word.length;

  if (len <= 4) score++;
  else if (len == 5) score += 2;
  else if (len == 6) score += 3;
  else if (len == 7) score += 5;
  else if (len > 7) score += 8;

  scoreHTML.textContent = score; // Change dispayed score
}

/*
 * Randomizes board with new letters on tiles.
 */
function randomize() {
  //let possible = "abcdefghijklmnopqrstuvwzyzaeiou";
  let possible =
    "aaafrsaaeeeeaafirsadennnaeeeemaeegmuaegmnna" +
    "firsybjkqxzccenstceiiltceilptceipstddhnotd" +
    "hhlordhlnordhlnoreiiittemotttensssufiprsyg" +
    "orrvwiprrrynootuwooottu";
  tiles.forEach((tile) => {
    tile.children[0].textContent = possible.charAt(
      Math.floor(Math.random() * possible.length)
    );
  });
}

/*
 * Finds all scoreable words on gameboard and stores them
 * in an array using recursion.
 */
function revealAll() {
  solutions = []; // Set solutions to empty array (to erase previous solutions)
  // Run revealAllHelper on each tile of the board
  for (let i = 0; i < tiles.length; i++)
    revealAllHelper(i, { visited: [] }, "");

  solutions.sort((a, b) => {
    return b.length - a.length;
  });
  solutions = solutions.filter((w) => w.length > 2);
  solutions = [...new Set(solutions)];

  solutions.forEach((word) => {
    solutionsHTML.insertAdjacentHTML("beforeend", `<li>${word}</li>`);
  });
}

/*
 * Recursive helper function for revealAll().
 */
function revealAllHelper(index, searched, prefix) {
  let tile = tiles[index];
  prefix += tile.textContent;

  if (searched.visited.includes(index)) return prefix;

  searched.visited.push(index);

  if (dict.isPrefix(prefix.toUpperCase())) {
    let searchable = []; // Contains all indexes that can be searched next

    if (dict.isWord(prefix.toUpperCase())) solutions.push(prefix);
    // Searching from left
    if (tile.classList.contains("left-side")) {
      searchable = [index - 4, index - 3, index + 1, index + 4, index + 5]
        .filter((i) => i > -1 && i < 16)
        .forEach((i) => {
          revealAllHelper(i, searched, prefix);
        });
    } else if (tile.classList.contains("right-side")) {
      // Searching from right
      searchable = [index - 5, index - 4, index - 1, index + 3, index + 4]
        .filter((i) => i > -1 && i < 16)
        .forEach((i) => {
          revealAllHelper(i, searched, prefix);
        });
    } else {
      // Searching from middle
      searchable = [
        index - 5,
        index - 4,
        index - 3,
        index - 1,
        index + 1,
        index + 3,
        index + 4,
        index + 5,
      ]
        .filter((i) => i > -1 && i < 16)
        .forEach((i) => {
          revealAllHelper(i, searched, prefix);
        });
    }
  }
  searched.visited.pop();
  return prefix;
}

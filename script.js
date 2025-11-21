
let currentBalance = 5000;
const balanceElement = document.getElementById('current-balance');
const gameContent = document.getElementById('game-content');
const gameNavItems = document.querySelectorAll('.nav-item[data-game]');

const SLOT_SYMBOLS = ['🍒', '🍋', '🔔', '7️⃣', 'BAR'];
const REEL_COUNT = 3;
const SYMBOLS_IN_REEL_VIEW = 30;


function updateBalance(amount) {
    if (currentBalance + amount < 0) {
        return false;
    }
    
    currentBalance += amount;
    balanceElement.textContent = `${currentBalance} 🪙`;
    
    balanceElement.classList.add(amount >= 0 ? 'balance-win' : 'balance-loss');
    
    setTimeout(() => {
        balanceElement.classList.remove('balance-win', 'balance-loss');
    }, 500);

    return true;
}

balanceElement.textContent = `${currentBalance} 🪙`;



function loadGame(gameKey) {
    const templateId = `template-${gameKey}`;
    const template = document.getElementById(templateId);

    if (!template) {
        gameContent.innerHTML = `<h2 class="welcome-message">Błąd!</h2><p>Gra '${gameKey}' nie została znaleziona.</p>`;
        return;
    }

    gameContent.innerHTML = '';
    const gameView = template.content.cloneNode(true);
    gameContent.appendChild(gameView);

    gameNavItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-game') === gameKey) {
            item.classList.add('active');
        }
    });


    if (gameKey === 'slots') {
        initializeSlotMachine();
    } else if (gameKey === 'roulette') {
        initializeRoulette();
    }
}



gameNavItems.forEach(item => {
    item.addEventListener('click', () => {
        const gameKey = item.getAttribute('data-game');
        
        if (!item.classList.contains('disabled')) {
            loadGame(gameKey);
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const initialActiveGame = document.querySelector('.nav-item.active[data-game]');
    if (initialActiveGame) {
        loadGame(initialActiveGame.getAttribute('data-game'));
    }
});

window.updateBalance = updateBalance;



function generateReelContent(reelElement) {
    reelElement.innerHTML = '';
    

    for (let i = 0; i < SYMBOLS_IN_REEL_VIEW; i++) {
        const symbol = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
        const div = document.createElement('div');
        div.classList.add('symbol');
        div.textContent = symbol;
        reelElement.appendChild(div);
    }
}


function spinReel(reelElement, finalSymbol, delay) {
    return new Promise(resolve => {
        setTimeout(() => {

            reelElement.style.transition = 'none';
            reelElement.style.transform = 'translateY(0)';
            
          
            generateReelContent(reelElement); 
            
            const div = document.createElement('div');
            div.classList.add('symbol', 'final-symbol');
            div.textContent = finalSymbol;
            reelElement.appendChild(div);
            
     
            const symbolHeight = 80; 

            const scrollDistance = (SYMBOLS_IN_REEL_VIEW - 2) * symbolHeight;

            
            const duration = 2000 + reelElement.getAttribute('data-reel') * 500; 

            reelElement.offsetHeight; 

            reelElement.style.transition = `transform ${duration / 1000}s cubic-bezier(0.25, 0.1, 0.25, 1)`;
            reelElement.style.transform = `translateY(-${scrollDistance}px)`;

 
            reelElement.addEventListener('transitionend', function handler() {
                reelElement.removeEventListener('transitionend', handler);
                
    
                
                reelElement.style.transition = 'none';
                
                const symbols = [];
                
 
                for (let i = 0; i < 2; i++) {
                    symbols.push(SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]);
                }
                
               
                symbols.push(finalSymbol);
                
            
                 for (let i = 0; i < 2; i++) {
                    symbols.push(SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]);
                }
                
                reelElement.innerHTML = symbols.map(s => `<div class="symbol">${s}</div>`).join('');
                

                const symbolHeight = 80; 
                reelElement.style.transform = `translateY(-${2 * symbolHeight}px)`;

                resolve(finalSymbol);
            });

        }, delay);
    });
}


const PAYOUTS = {
    '7️⃣7️⃣7️⃣': 15,
    'BARBARBAR': 10,
    '🍒🍒🍒': 5,
    '🍋🍋🍋': 3,
    '🔔🔔🔔': 2,
    'ANY_DOUBLE': 1.5 
};

function checkWin(results, betAmount) {
    const messageElement = document.getElementById('slots-message');
    const [r1, r2, r3] = results;
    let winAmount = 0;
    
   
    const key = r1 + r2 + r3;
    
    if (PAYOUTS[key]) {
  
        winAmount = betAmount * PAYOUTS[key];
        messageElement.textContent = `JACKPOT! Wygrałeś ${Math.round(winAmount)} 🪙 z kombinacji ${key}!`;
    } else if (r1 === r2 || r2 === r3 || r1 === r3) {

        winAmount = betAmount * PAYOUTS['ANY_DOUBLE'];
        messageElement.textContent = `Wygrałeś podwójny symbol: ${Math.round(winAmount)} 🪙!`;
    } else {

        messageElement.textContent = 'Spróbuj ponownie! 💔';
        messageElement.classList.add('loss');
    }

    if (winAmount > 0) {
        updateBalance(winAmount);
        messageElement.classList.add('win');
        messageElement.classList.remove('loss');
    } else {
        messageElement.classList.remove('win');
    }
}


function handleSpin() {
    const spinButton = document.getElementById('spin-button');
    const betInput = document.getElementById('bet-amount');
    const messageElement = document.getElementById('slots-message');
    const reels = document.querySelectorAll('.slots-reels .reel');

    const betAmount = parseInt(betInput.value);

    // Walidacja
    if (isNaN(betAmount) || betAmount < 50) {
        messageElement.textContent = "Minimalny zakład to 50 monet!";
        return;
    }
    if (currentBalance < betAmount) {
        messageElement.textContent = "Za mało monet na koncie!";
        return;
    }

    const deducted = updateBalance(-betAmount);
    if (!deducted) return;
    
    spinButton.disabled = true;
    messageElement.textContent = 'Obracanie...';
    messageElement.classList.remove('win', 'loss');


    const finalResults = Array.from({ length: REEL_COUNT }, () => 
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]
    );


    const spinPromises = Array.from(reels).map((reel, index) => {
        return spinReel(reel, finalResults[index], index * 200); 
    });


    Promise.all(spinPromises).then(() => {
        spinButton.disabled = false;
        checkWin(finalResults, betAmount);
    }).catch(error => {
        console.error("Błąd podczas obracania:", error);
        spinButton.disabled = false;
        messageElement.textContent = "Wystąpił błąd w grze. Spróbuj ponownie.";
    });
}


function initializeSlotMachine() {
    const spinButton = document.getElementById('spin-button');
    const reels = document.querySelectorAll('.slots-reels .reel');

    if (reels.length === 0) {
        return;
    }
    

    reels.forEach(reel => {
        reel.style.transition = 'none';
        reel.innerHTML = '';
        const symbolHeight = 80; 
       
        const initialSymbols = [];
        for (let i = 0; i < 5; i++) {
            initialSymbols.push(SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]);
        }
        
        reel.innerHTML = initialSymbols.map(s => `<div class="symbol">${s}</div>`).join('');
        
  
        reel.style.transform = `translateY(-${2 * symbolHeight}px)`; 
    });


    if (spinButton) {
        spinButton.onclick = handleSpin;
    }
    
    const betInput = document.getElementById('bet-amount');
    if (betInput) {
        betInput.value = 150;
    }
}



const ROULETTE_NUMBERS_ORDER = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];


const ROULETTE_COLORS = {
    0: 'zero',
    1: 'red', 2: 'black', 3: 'red', 4: 'black', 5: 'red', 6: 'black', 7: 'red', 8: 'black', 9: 'red', 10: 'black',
    11: 'black', 12: 'red', 13: 'black', 14: 'red', 15: 'black', 16: 'red', 17: 'black', 18: 'red', 19: 'red', 20: 'black',
    21: 'red', 22: 'black', 23: 'red', 24: 'black', 25: 'red', 26: 'black', 27: 'red', 28: 'black', 29: 'black', 30: 'red',
    31: 'black', 32: 'red', 33: 'black', 34: 'red', 35: 'black', 36: 'red'
};


const ROULETTE_BET_MAP = {
    'dozen1': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    'dozen2': [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
    'dozen3': [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36],
    'half1': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18], // 1-18
    'half2': [19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36], // 19-36
    'even': [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36],
    'odd': [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35],
    'red': Object.keys(ROULETTE_COLORS).filter(n => ROULETTE_COLORS[n] === 'red').map(Number),
    'black': Object.keys(ROULETTE_COLORS).filter(n => ROULETTE_COLORS[n] === 'black').map(Number),
    'row1': [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34], 
    'row2': [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35], 
    'row3': [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
};


const ROULETTE_PAYOUTS = {
    single: 35,
    dozen: 2, 
    half: 1
};

// Stan zakładów
let currentRouletteBets = {}; // Format: { '3': 100, 'red': 50, ... }

const TILE_WIDTH = 80; // Musi odpowiadać CSS .roulette-number-tile

/**
 * Generuje HTML paska ruletki (karuzeli)
 */
function generateRouletteStrip(stripElement) {
    // Generujemy długi pasek symboli - wielokrotność sekwencji, aby zapewnić płynny obrót
    const REPEAT_COUNT = 5; 
    let html = '';

    // Generujemy całą sekwencję (5 pełnych obrotów), aby animacja miała z czego startować
    for (let i = 0; i < REPEAT_COUNT; i++) {
        ROULETTE_NUMBERS_ORDER.forEach(number => {
            const color = ROULETTE_COLORS[number];
            html += `<div class="roulette-number-tile ${color}" data-number="${number}">${number}</div>`;
        });
    }
    
    stripElement.innerHTML = html;
}

/**
 * Uaktualnia wizualizację żetonów na stole.
 */
function updateBetChips() {
    const betCells = document.querySelectorAll('#roulette-bet-table [data-bet]');
    betCells.forEach(cell => {
        const betKey = cell.getAttribute('data-bet');
        const chip = cell.querySelector('.bet-chip');
        
        if (currentRouletteBets[betKey] > 0) {
            chip.classList.add('active');
            chip.textContent = currentRouletteBets[betKey];
        } else {
            chip.classList.remove('active');
            chip.textContent = '';
        }
    });
    
    // Zakład na zero
    const zeroCell = document.querySelector('.bet-zero');
    const zeroChip = zeroCell.querySelector('.bet-chip');
    if (zeroChip) {
        if (currentRouletteBets['0'] > 0) {
            zeroChip.classList.add('active');
            zeroChip.textContent = currentRouletteBets['0'];
        } else {
            zeroChip.classList.remove('active');
            zeroChip.textContent = '';
        }
    }
}


/**
 * Obsługa kliknięcia na pole zakładu
 */
function handleBetClick(event) {
    const cell = event.target.closest('[data-bet]');
    if (!cell) return;
    
    // Sprawdzamy czy przycisk Zakręć jest aktywny.
    const spinButton = document.getElementById('spin-roulette');
    if (spinButton && spinButton.disabled) return; 

    const betAmountInput = document.getElementById('roulette-bet-amount');
    const betAmount = parseInt(betAmountInput.value);
    const betKey = cell.getAttribute('data-bet');
    const betValue = cell.textContent.split('<span')[0].trim(); // Pobierz tylko tekst liczby/zakładu
    
    if (isNaN(betAmount) || betAmount <= 0) {
        document.getElementById('roulette-message').textContent = "Wybierz prawidłową kwotę zakładu!";
        return;
    }

    if (currentBalance < betAmount) {
        document.getElementById('roulette-message').textContent = "Za mało monet na koncie!";
        return;
    }
    
    // Zapisanie zakładu w stanie
    currentRouletteBets[betKey] = (currentRouletteBets[betKey] || 0) + betAmount;
    updateBetChips();
    
    document.getElementById('roulette-message').textContent = `Postawiłeś ${betAmount} na ${betValue}. Całkowita stawka: ${Object.values(currentRouletteBets).reduce((sum, bet) => sum + bet, 0)} 🪙.`;

}


/**
 * Oblicza wygraną i aktualizuje saldo.
 */
function checkRouletteWin(winningNumber) {
    let totalWin = 0;
    const winningColor = ROULETTE_COLORS[winningNumber];
    const messageElement = document.getElementById('roulette-message');
    
    // 1. Sprawdzenie zakładów na pojedyncze numery
    if (currentRouletteBets[winningNumber.toString()] > 0) {
        const bet = currentRouletteBets[winningNumber.toString()];
        const win = bet * ROULETTE_PAYOUTS.single + bet; // Zwracamy zakład + wygraną
        totalWin += win;
    }

    // 2. Sprawdzenie zakładów ogólnych (dozen, color, half, row)
    for (const key in currentRouletteBets) {
        // Pomijamy zakłady na pojedyncze numery
        if (!isNaN(key) && ROULETTE_NUMBERS_ORDER.includes(parseInt(key))) continue; 

        // Sprawdzamy zakłady na kolory i parzystość
        if (key === winningColor && winningNumber !== 0) { // Kolory
            totalWin += currentRouletteBets[key] * ROULETTE_PAYOUTS.half + currentRouletteBets[key];
        } else if (key === 'even' && winningNumber !== 0 && winningNumber % 2 === 0) { // Parzyste
            totalWin += currentRouletteBets[key] * ROULETTE_PAYOUTS.half + currentRouletteBets[key];
        } else if (key === 'odd' && winningNumber !== 0 && winningNumber % 2 !== 0) { // Nieparzyste
            totalWin += currentRouletteBets[key] * ROULETTE_PAYOUTS.half + currentRouletteBets[key];
        } else if (ROULETTE_BET_MAP[key] && ROULETTE_BET_MAP[key].includes(winningNumber)) {
            // Zakłady na tuziny/rzędy
            const payoutType = key.includes('dozen') || key.includes('row') ? 'dozen' : 'half';
            totalWin += currentRouletteBets[key] * ROULETTE_PAYOUTS[payoutType] + currentRouletteBets[key];
        }
    }
    
    const totalLost = Object.values(currentRouletteBets).reduce((sum, bet) => sum + bet, 0);
    const netWinLoss = totalWin - totalLost;
    
    // 3. Wyświetlenie wyników i aktualizacja salda
    if (netWinLoss > 0) {
        updateBalance(netWinLoss);
        messageElement.textContent = `Wylosowano ${winningNumber} (${winningColor.toUpperCase()})! Wygrałeś ${Math.round(netWinLoss)} 🪙! (Całkowita wygrana: ${Math.round(totalWin)})`;
        messageElement.classList.add('win');
    } else if (netWinLoss < 0) {
        messageElement.textContent = `Wylosowano ${winningNumber} (${winningColor.toUpperCase()}). Straciłeś ${Math.abs(netWinLoss)} 🪙. Spróbuj ponownie.`;
        messageElement.classList.add('loss');
        messageElement.classList.remove('win');
    } else {
        messageElement.textContent = `Wylosowano ${winningNumber} (${winningColor.toUpperCase()}). Remis! Odzyskujesz swoje pieniądze.`;
        messageElement.classList.remove('win', 'loss');
    }
    
    // Dodanie wyniku do historii
    const historyList = document.getElementById('roulette-previous-list');
    const newResult = document.createElement('li');
    newResult.textContent = winningNumber;
    newResult.classList.add(winningColor);
    
    // Usuń placeholder
    const placeholder = historyList.querySelector('.placeholder');
    if (placeholder) {
        historyList.removeChild(placeholder);
    }
    
    historyList.prepend(newResult);
    
    // Ograniczenie historii do 10 wyników
    while (historyList.children.length > 10) {
        historyList.removeChild(historyList.lastChild);
    }
    
    // Reset zakładów
    currentRouletteBets = {};
    updateBetChips();
}


/**
 * Obsługa animacji kręcenia paska ruletki.
 */
function spinRoulette(winningNumber) {
    const stripElement = document.getElementById('roulette-strip');
    
    // 1. Reset
    stripElement.style.transition = 'none';
    
    // 2. Obliczanie pozycji docelowej
    const VIEWPORT_WIDTH = 600; // Szerokość widocznego obszaru (z CSS)
    const VIEWPORT_CENTER_OFFSET = VIEWPORT_WIDTH / 2; 
    const TILE_CENTER_OFFSET = TILE_WIDTH / 2;
    
    // Znajdź indeks wylosowanej liczby (jej pierwszego wystąpienia w 3. sekwencji)
    const REPEAT_INDEX = 3; 
    const TILES_PER_SEQUENCE = ROULETTE_NUMBERS_ORDER.length; // 37
    
    // Index, na którym się zatrzymamy
    const winIndexInSequence = ROULETTE_NUMBERS_ORDER.indexOf(winningNumber); 
    const targetTileIndex = (REPEAT_INDEX * TILES_PER_SEQUENCE) + winIndexInSequence; 
    
    // Pozycja X środka kafelek
    const targetX = (targetTileIndex * TILE_WIDTH) + TILE_CENTER_OFFSET;
    
    // Ostateczne przesunięcie: -(docelowa pozycja X) + (offset do środka viewportu)
    const scrollDistance = targetX - VIEWPORT_CENTER_OFFSET;
    const finalTransform = `translateX(-${scrollDistance}px)`;
    
    // Ustawienie początkowego przesunięcia (aby animacja zaczęła się płynnie)
    // Ustawiamy na pozycję w której element znajduje się na końcu 2. sekwencji
    const preRollPosition = (REPEAT_INDEX - 1) * TILES_PER_SEQUENCE * TILE_WIDTH;
    stripElement.style.transform = `translateX(-${preRollPosition}px)`;
    
    // Wymuś reflow
    stripElement.offsetHeight; 

    // 3. Rozpoczęcie animacji
    const duration = 5000; 
    stripElement.style.transition = `transform ${duration / 1000}s cubic-bezier(0.2, 0.8, 0.5, 1)`; // Szybki start, powolne zakończenie
    stripElement.style.transform = finalTransform;

    // 4. Czekaj na zakończenie animacji
    return new Promise(resolve => {
        setTimeout(() => {
            stripElement.style.transition = 'none'; // Wyłączamy przejście po zakończeniu
            resolve(winningNumber);
        }, duration);
    });
}

/**
 * Główna funkcja obsługująca kręcenie (spin)
 */
function handleSpinRoulette() {
    const spinButton = document.getElementById('spin-roulette');
    const messageElement = document.getElementById('roulette-message');
    
    const totalBetAmount = Object.values(currentRouletteBets).reduce((sum, bet) => sum + bet, 0);
    
    if (totalBetAmount === 0) {
        messageElement.textContent = "Musisz postawić zakład, aby zakręcić!";
        return;
    }
    
    if (currentBalance < totalBetAmount) {
        messageElement.textContent = "Za mało monet na koncie, aby pokryć wszystkie zakłady!";
        return;
    }
    
    // Odjęcie zakładu i blokada
    const deducted = updateBalance(-totalBetAmount);
    if (!deducted) return;
    
    spinButton.disabled = true;
    messageElement.textContent = 'Kula w grze...';
    messageElement.classList.remove('win', 'loss');
    
    // Wylosowanie wyniku
    const randomIndex = Math.floor(Math.random() * ROULETTE_NUMBERS_ORDER.length);
    const winningNumber = ROULETTE_NUMBERS_ORDER[randomIndex];

    // Uruchomienie animacji
    spinRoulette(winningNumber).then(() => {
        spinButton.disabled = false;
        checkRouletteWin(winningNumber);
    }).catch(error => {
        console.error("Błąd podczas obracania:", error);
        spinButton.disabled = false;
        messageElement.textContent = "Wystąpił błąd w grze. Spróbuj ponownie.";
    });
}

/**
 * Inicjalizacja gry Ruletka
 */
function initializeRoulette() {
    const spinButton = document.getElementById('spin-roulette');
    const betTable = document.getElementById('roulette-bet-table');
    const resetButton = document.getElementById('reset-bets');
    const stripElement = document.getElementById('roulette-strip');
    
    // Generowanie i reset paska
    generateRouletteStrip(stripElement);
    stripElement.style.transition = 'none';
    
    // Podpięcie przycisku ZAKRĘĆ
    if (spinButton) {
        spinButton.onclick = handleSpinRoulette;
    }
    
    // Podpięcie kliknięć na pola zakładów
    if (betTable) {
        betTable.onclick = handleBetClick;
    }
    
    // Podpięcie przycisku RESET
    if (resetButton) {
        resetButton.onclick = () => {
            currentRouletteBets = {};
            updateBetChips();
            document.getElementById('roulette-message').textContent = 'Zakłady wyczyszczone.';
        };
    }
    
    // Ustawienie domyślnej kwoty zakładu
    const betAmountInput = document.getElementById('roulette-bet-amount');
    if (betAmountInput) {
        betAmountInput.value = 100;
    }
    
    // Reset stanu gry
    currentRouletteBets = {};
    updateBetChips();
    document.getElementById('roulette-message').textContent = 'Postaw zakład, wybierz pola i Zakręć!';

}

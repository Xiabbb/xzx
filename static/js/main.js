let currentWord = null;
let stats = {
    correct: 0,
    wrong: 0
};

let currentProgress = {
    current: 0,
    total: 0,
    remaining: 0
};

// 获取总单词数
async function initializeProgress() {
    const response = await fetch('/get_total_words');
    const data = await response.json();
    currentProgress.total = data.total;
}

// 添加获取当前统计的函数
async function getCurrentStats() {
    const response = await fetch('/get_current_stats?mode=guess');
    const data = await response.json();
    stats.correct = data.correct;
    stats.wrong = data.wrong;
    currentProgress.remaining = data.remaining;
}

async function getNewWord() {
    console.log("Fetching new word...");
    const response = await fetch('/get_word');
    const data = await response.json();
    console.log("Received data:", data);
    
    if (!data.word) {
        showFinalResults();
        return;
    }
    
    currentWord = data.word;
    console.log("Setting question:", currentWord.english);
    setQuestion(currentWord);
    
    // 添加选项按钮
    const multipleChoice = document.getElementById('multiple-choice');
    multipleChoice.innerHTML = '';
    
    if (data.choices) {
        data.choices.forEach(choice => {
            const button = document.createElement('button');
            button.className = 'choice-btn';
            button.textContent = choice;
            button.onclick = () => checkMultipleChoice(choice);
            multipleChoice.appendChild(button);
        });
    }
}

async function checkAnswer() {
    const answer = document.getElementById('answer-input').value;
    const response = await fetch('/check_answer', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            question: currentWord.english,
            answer: answer
        })
    });
    
    const result = await response.json();
    showFeedback(result.correct, result.correct_answer);
}

async function checkMultipleChoice(choice) {
    const response = await fetch('/check_answer', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            question: currentWord.english,
            answer: choice,
            mode: 'guess'  // 指定为猜猜猜模式
        })
    });
    
    const result = await response.json();
    showFeedback(result.correct, result.correct_answer);
    
    // 禁用所有选项按钮
    const buttons = document.querySelectorAll('.choice-btn');
    buttons.forEach(button => {
        button.disabled = true;
        if (button.textContent === result.correct_answer) {
            button.style.backgroundColor = '#4CAF50';
            button.style.color = 'white';
        } else if (button.textContent === choice && !result.correct) {
            button.style.backgroundColor = '#f44336';
            button.style.color = 'white';
        }
    });
    
    if (result.correct) {
        stats.correct++;
    } else {
        stats.wrong++;
    }
    
    // 更新剩余单词数
    currentProgress.remaining = result.remaining;
    
    // 2秒后自动进入下一题
    setTimeout(() => {
        getNewWord();
    }, 2000);

    if (window.parent) {
        window.parent.postMessage('updateStats', '*');
    }
}

function playWordAudio() {
    const audio = document.getElementById('word-audio');
    audio.play();
}

function showFeedback(correct, correctAnswer) {
    const feedback = document.getElementById('feedback');
    if (correct) {
        feedback.textContent = '正确!';
        feedback.style.color = 'green';
    } else {
        feedback.textContent = `错误! 正确答案是: ${correctAnswer}`;
        feedback.style.color = 'red';
    }
    
    // 播放正确/错误音效
    const audioElement = document.getElementById(correct ? 'correct-audio' : 'wrong-audio');
    audioElement.play();
}

function showFinalResults() {
    const totalAttempts = stats.correct + stats.wrong;
    const accuracy = Math.round((stats.correct / totalAttempts) * 100);
    const gameCard = document.querySelector('.game-card');
    
    gameCard.innerHTML = `
        <div class="final-results">
            <h2>恭喜完成所有单词！</h2>
            <div class="results-stats">
                <p>总单词数: ${currentProgress.total}</p>
                <p>总答题次数: ${totalAttempts}</p>
                <p>正确次数: ${stats.correct}</p>
                <p>错误次数: ${stats.wrong}</p>
                <p>正确率: ${accuracy}%</p>
            </div>
            <div class="final-message">
                ${accuracy >= 90 ? '太棒了！你是最棒的！' : 
                  accuracy >= 70 ? '做得不错！继续加油！' : 
                  '再接再厉，相信你可以做得更好！'}
            </div>
            <button class="next-button" onclick="restartGame()">
                再来一次
            </button>
        </div>
    `;
}

async function resetStats() {
    if (!confirm('确定要重置所有统计数据吗？')) {
        return;
    }
    
    const response = await fetch('/reset_stats', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            mode: 'guess'
        })
    });
    
    if (response.ok) {
        // 重置页面显示的统计数据
        stats.correct = 0;
        stats.wrong = 0;
        currentProgress.remaining = currentProgress.total;
        // 重新加载单词
        getNewWord();
    }
}

function setQuestion(word) {
    document.getElementById('question').textContent = word.english;
    
    // 检查是否有音频文件
    const audioButton = document.getElementById('play-audio');
    if (word.has_audio) {
        audioButton.style.display = 'flex';
        const audioElement = document.getElementById('word-audio');
        audioElement.src = word.audio_url;
        
        // 自动播放音频
        setTimeout(() => {
            audioElement.play().catch(error => {
                console.log('Auto-play failed:', error);
            });
        }, 500);
    } else {
        audioButton.style.display = 'none';
    }
}

// 修改初始化函数
window.onload = async function() {
    await initializeProgress();
    await getCurrentStats();
    getNewWord();
}; 
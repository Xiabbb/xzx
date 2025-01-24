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

async function initializeProgress() {
    const response = await fetch('/get_total_words');
    const data = await response.json();
    currentProgress.total = data.total;
}

async function getCurrentStats() {
    const response = await fetch('/get_current_stats?mode=translate');
    const data = await response.json();
    stats.correct = data.correct;
    stats.wrong = data.wrong;
    currentProgress.remaining = data.remaining;
}

async function getNewWord() {
    console.log("Fetching new word for translate...");  // 添加调试日志
    const response = await fetch('/get_word_for_translate');
    const data = await response.json();
    console.log("Received data:", data);  // 添加调试日志
    
    if (!data.word) {
        showFinalResults();
        return;
    }
    
    currentWord = data.word;
    console.log("Setting question:", currentWord.chinese);  // 添加调试日志
    document.getElementById('question').textContent = currentWord.chinese;
    document.getElementById('answer-input').value = '';
    document.getElementById('answer-input').focus();
    
    // 隐藏发音按钮，因为还没答对不应该听到发音
    document.getElementById('play-audio').style.display = 'none';
}

async function checkAnswer() {
    const answer = document.getElementById('answer-input').value.trim();
    if (!answer) {
        return;
    }
    
    const response = await fetch('/check_answer', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            question: currentWord.english,
            answer: answer,
            mode: 'translate'  // 指定为翻译模式
        })
    });
    
    const result = await response.json();
    showFeedback(result.correct, currentWord.english);  // 显示英文作为正确答案
    
    if (result.correct) {
        stats.correct++;
        // 答对了才播放音频
        if (currentWord.has_audio) {
            const wordAudio = document.getElementById('word-audio');
            wordAudio.src = currentWord.audio_url;
            setTimeout(() => {
                wordAudio.play().catch(error => {
                    console.log('Auto-play failed:', error);
                });
            }, 500);
        }
    } else {
        stats.wrong++;
    }
    
    currentProgress.remaining = result.remaining;
    
    // 禁用输入和提交按钮
    document.getElementById('answer-input').disabled = true;
    document.querySelector('.submit-btn').disabled = true;
    
    // 2秒后自动进入下一题
    setTimeout(() => {
        getNewWord();
        // 重新启用输入和提交按钮
        document.getElementById('answer-input').disabled = false;
        document.querySelector('.submit-btn').disabled = false;
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

function restartGame() {
    stats.correct = 0;
    stats.wrong = 0;
    currentProgress.current = 0;
    currentProgress.remaining = 0;
    
    location.reload();
}

// 添加回车键提交答案的功能
document.getElementById('answer-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        checkAnswer();
    }
});

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
            mode: 'translate'
        })
    });
    // ... 其余代码保持不变
}

// 修改初始化函数
window.onload = async function() {
    await initializeProgress();
    await getCurrentStats();
    getNewWord();
}; 
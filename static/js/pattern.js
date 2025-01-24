let currentPattern = null;
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
    const response = await fetch('/get_total_patterns');
    const data = await response.json();
    currentProgress.total = data.total;
}

async function getCurrentStats() {
    const response = await fetch('/get_current_stats?mode=pattern');
    const data = await response.json();
    stats.correct = data.correct;
    stats.wrong = data.wrong;
    currentProgress.remaining = data.remaining;
}

async function getNewWord() {
    const response = await fetch('/get_pattern');
    const data = await response.json();
    
    if (!data.pattern) {
        showFinalResults();
        return;
    }
    
    currentPattern = data.pattern;
    
    const typeElement = document.getElementById('pattern-type');
    typeElement.textContent = currentPattern.type;
    
    const sentence = currentPattern.sentence;
    const underline = currentPattern.underline;
    const index = sentence.indexOf(underline);
    
    if (index !== -1) {
        document.getElementById('sentence-before').textContent = sentence.substring(0, index);
        document.getElementById('sentence-underline').textContent = underline;
        document.getElementById('sentence-after').textContent = sentence.substring(index + underline.length);
    } else {
        document.getElementById('sentence-before').textContent = sentence;
        document.getElementById('sentence-underline').textContent = '';
        document.getElementById('sentence-after').textContent = '';
    }
    
    document.getElementById('chinese-translation').textContent = currentPattern.chinese;
    
    document.getElementById('answer-input').value = '';
    document.getElementById('answer-input').focus();
    document.getElementById('hint-text').textContent = '';
    
    // 显示播放按钮
    const playButton = document.getElementById('play-sentence');
    if (playButton) {
        playButton.style.display = 'flex';
    }
}

function showHint() {
    if (currentPattern && currentPattern.hint) {
        const hintElement = document.getElementById('hint-text');
        const formattedHint = currentPattern.hint.replace(/\\n/g, '\n');
        
        // 添加关闭按钮
        hintElement.innerHTML = `
            <button class="close-hint" onclick="closeHint()">×</button>
            ${formattedHint}
        `;
    }
}

function closeHint() {
    const hintElement = document.getElementById('hint-text');
    hintElement.textContent = '';
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
            question: currentPattern.id,
            answer: answer,
            mode: 'pattern'
        })
    });
    
    const result = await response.json();
    showFeedback(result.correct, currentPattern.english);
    
    if (result.correct) {
        stats.correct++;
    } else {
        stats.wrong++;
    }
    
    currentProgress.remaining = result.remaining;
    
    document.getElementById('answer-input').disabled = true;
    document.querySelector('.submit-btn').disabled = true;
    
    setTimeout(() => {
        getNewWord();
        document.getElementById('answer-input').disabled = false;
        document.querySelector('.submit-btn').disabled = false;
    }, 2000);

    // 通知父窗口更新统计
    if (window.parent) {
        window.parent.postMessage('updateStats', '*');
    }
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
    const totalAttempts = stats.correct + stats.wrong;  // 总答题次数
    const accuracy = totalAttempts > 0 ? 
        Math.round((stats.correct / totalAttempts) * 100) : 0;  // 防止除以0
    
    const gameCard = document.querySelector('.game-card');
    
    gameCard.innerHTML = `
        <div class="final-results">
            <h2>恭喜完成所有句型！</h2>
            <div class="results-stats">
                <p>总句型数: ${currentProgress.total}</p>
                <p>总答题次数: ${totalAttempts}</p>
                <p>答对次数: ${stats.correct}</p>
                <p>答错次数: ${stats.wrong}</p>
                <p>正确率: ${accuracy}%</p>
            </div>
            <div class="final-message">
                ${accuracy >= 90 ? '太棒了！你是最棒的！' : 
                  accuracy >= 70 ? '做得不错！继续加油！' : 
                  '再接再厉，相信你可以做得更好！'}
            </div>
            <button class="next-button" onclick="location.reload()">
                再来一次
            </button>
        </div>
    `;
}

document.getElementById('answer-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        checkAnswer();
    }
});

function playSentence() {
    if (currentPattern) {
        // 使用 Web Speech API 进行文本转语音
        const utterance = new SpeechSynthesisUtterance(currentPattern.sentence);
        utterance.lang = 'en-GB';     // 改为英式英语
        utterance.rate = 0.7;         // 保持较慢语速
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // 获取所有可用的声音
        const voices = window.speechSynthesis.getVoices();
        // 优先选择英式女声
        const britishVoice = voices.find(voice => 
            (voice.lang === 'en-GB' || voice.name.includes('British')) && 
            voice.name.includes('Female')
        );
        
        if (britishVoice) {
            utterance.voice = britishVoice;
            console.log("使用英式发音:", britishVoice.name);  // 调试信息
        } else {
            console.log("未找到英式发音，可用的声音:", voices.map(v => v.name));  // 调试信息
        }

        // 添加事件监听器，在语音开始时显示视觉反馈
        utterance.onstart = () => {
            const playButton = document.getElementById('play-sentence');
            if (playButton) {
                playButton.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
            }
        };

        utterance.onend = () => {
            const playButton = document.getElementById('play-sentence');
            if (playButton) {
                playButton.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
            }
        };

        // 先取消之前的语音
        speechSynthesis.cancel();
        // 播放新的语音
        speechSynthesis.speak(utterance);
    }
}

// 确保在页面加载时获取可用的语音列表
window.speechSynthesis.onvoiceschanged = () => {
    const voices = window.speechSynthesis.getVoices();
    console.log("可用的声音:", voices.map(v => `${v.name} (${v.lang})`));  // 调试信息
};

window.onload = async function() {
    await initializeProgress();
    await getCurrentStats();
    getNewWord();
}; 
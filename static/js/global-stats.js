// 全局统计数据更新
async function updateGlobalStats() {
    // 获取猜猜猜模式的统计
    const guessStats = await fetch('/get_current_stats?mode=guess').then(r => r.json());
    document.getElementById('guess-correct').textContent = guessStats.correct;
    document.getElementById('guess-wrong').textContent = guessStats.wrong;
    document.getElementById('guess-completed').textContent = guessStats.total - guessStats.remaining;
    document.getElementById('guess-total').textContent = guessStats.total;
    
    const guessAccuracy = guessStats.correct + guessStats.wrong === 0 ? 0 : 
        Math.round((guessStats.correct / (guessStats.correct + guessStats.wrong)) * 100);
    document.getElementById('guess-accuracy').textContent = `${guessAccuracy}%`;
    
    const guessProgress = Math.round(((guessStats.total - guessStats.remaining) / guessStats.total) * 100);
    document.getElementById('guess-progress').style.width = `${guessProgress}%`;

    // 获取翻译模式的统计
    const translateStats = await fetch('/get_current_stats?mode=translate').then(r => r.json());
    document.getElementById('translate-correct').textContent = translateStats.correct;
    document.getElementById('translate-wrong').textContent = translateStats.wrong;
    document.getElementById('translate-completed').textContent = translateStats.total - translateStats.remaining;
    document.getElementById('translate-total').textContent = translateStats.total;
    
    const translateAccuracy = translateStats.correct + translateStats.wrong === 0 ? 0 :
        Math.round((translateStats.correct / (translateStats.correct + translateStats.wrong)) * 100);
    document.getElementById('translate-accuracy').textContent = `${translateAccuracy}%`;
    
    const translateProgress = Math.round(((translateStats.total - translateStats.remaining) / translateStats.total) * 100);
    document.getElementById('translate-progress').style.width = `${translateProgress}%`;

    // 获取句型练习的统计
    const patternStats = await fetch('/get_current_stats?mode=pattern').then(r => r.json());
    document.getElementById('pattern-correct').textContent = patternStats.correct;
    document.getElementById('pattern-wrong').textContent = patternStats.wrong;
    document.getElementById('pattern-completed').textContent = patternStats.total - patternStats.remaining;
    document.getElementById('pattern-total').textContent = patternStats.total;
    
    const patternAccuracy = patternStats.correct + patternStats.wrong === 0 ? 0 :
        Math.round((patternStats.correct / (patternStats.correct + patternStats.wrong)) * 100);
    document.getElementById('pattern-accuracy').textContent = `${patternAccuracy}%`;
    
    const patternProgress = Math.round(((patternStats.total - patternStats.remaining) / patternStats.total) * 100);
    document.getElementById('pattern-progress').style.width = `${patternProgress}%`;
}

// 重置所有统计
async function resetAllStats() {
    if (!confirm('确定要重置所有功能的统计数据吗？')) {
        return;
    }
    
    await fetch('/reset_stats', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            mode: null  // null表示重置所有功能
        })
    });
    
    updateGlobalStats();
}

// 移除自动更新
// setInterval(updateGlobalStats, 2000);

// 页面加载时初始化统计
document.addEventListener('DOMContentLoaded', updateGlobalStats);

// 监听来自iframe的消息，在需要时更新统计
window.addEventListener('message', function(event) {
    if (event.data === 'updateStats') {
        updateGlobalStats();
    }
}); 
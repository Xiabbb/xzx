document.addEventListener('DOMContentLoaded', function() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const gameFrame = document.getElementById('game-frame');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // 移除所有活动状态
            tabBtns.forEach(b => b.classList.remove('active'));
            // 添加当前活动状态
            btn.classList.add('active');
            
            // 切换iframe内容
            const tab = btn.dataset.tab;
            gameFrame.src = `/${tab}`;
        });
    });
}); 
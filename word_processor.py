import json
import random
import os

class WordProcessor:
    def __init__(self, json_file):
        self.words = {}
        self.patterns = []
        self.stats = {
            'guess': {
                'correct_words': set(),
                'wrong_words': set()
            },
            'translate': {
                'correct_words': set(),
                'wrong_words': set()
            },
            'pattern': {
                'correct_words': set(),
                'wrong_words': set()
            }
        }
        
        current_dir = os.path.dirname(os.path.abspath(__file__))
        words_path = os.path.join(current_dir, json_file)
        patterns_path = os.path.join(current_dir, 'data', 'pattern_exercises.json')
        stats_path = os.path.join(current_dir, 'data', 'stats.json')
        
        self.stats_file = stats_path
        self.load_words(words_path)
        self.load_patterns(patterns_path)
        self.load_stats()
    
    def load_words(self, json_file):
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            self.words = data['小学英语词汇']
    
    def load_patterns(self, json_file):
        try:
            print(f"正在加载句型文件: {json_file}")  # 添加调试信息
            if not os.path.exists(json_file):
                print(f"文件不存在: {json_file}")  # 添加调试信息
                self.patterns = []
                return
            
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                print(f"成功加载句型数据，共 {len(data)} 条")  # 添加调试信息
                if not isinstance(data, list):
                    print(f"数据格式错误: {type(data)}")  # 添加调试信息
                    self.patterns = []
                    return
                
                valid_patterns = []
                for i, pattern in enumerate(data):
                    required_fields = ['sentence', 'type', 'underline', 'answer']
                    if all(field in pattern for field in required_fields):
                        if 'id' not in pattern:
                            pattern['id'] = str(i)
                        valid_patterns.append(pattern)
                    else:
                        missing = [f for f in required_fields if f not in pattern]
                        print(f"第 {i} 条数据缺少字段: {missing}")  # 添加调试信息
                
                self.patterns = valid_patterns
                print(f"有效句型数据: {len(valid_patterns)} 条")  # 添加调试信息
                
        except Exception as e:
            print(f"加载句型数据失败: {str(e)}")  # 添加调试信息
            self.patterns = []
    
    def get_total_words(self, mode='guess'):
        if mode == 'pattern':
            return len(self.patterns)
        return len(self.words)
    
    def get_remaining_words(self, mode):
        if mode == 'pattern':
            return len([p for p in self.patterns 
                       if p['id'] not in self.stats[mode]['correct_words']])
        return len(self.words) - len(self.stats[mode]['correct_words'])
    
    def get_random_word(self, mode):
        # 从特定功能未答对的单词中随机选择
        available_words = [word for word in self.words.keys() 
                          if word not in self.stats[mode]['correct_words']]
        
        if not available_words:
            return None
            
        word = random.choice(available_words)
        audio_path = os.path.join(os.path.dirname(__file__), f'static/audio/words/{word}.mp3')
        has_audio = os.path.exists(audio_path)
        
        return {
            'english': word,
            'chinese': self.words[word],
            'has_audio': has_audio,
            'audio_url': f'/static/audio/words/{word}.mp3' if has_audio else None,
            'remaining': len(available_words)
        }
    
    def check_answer(self, question, answer, mode='guess'):
        if mode == 'pattern':
            # 在句型列表中查找对应的题目
            pattern = next((p for p in self.patterns if p['id'] == question), None)
            if pattern:
                is_correct = answer.lower().strip() == pattern['answer'].lower().strip()
                if is_correct:
                    self.stats[mode]['correct_words'].add(question)
                else:
                    self.stats[mode]['wrong_words'].add(question)
                
                return {
                    'correct': is_correct,
                    'correct_answer': pattern['answer'],
                    'remaining': len([p for p in self.patterns 
                                    if p['id'] not in self.stats[mode]['correct_words']])
                }
        else:
            # 原有的单词检查逻辑
            if question in self.words:
                if mode == 'guess':
                    is_correct = self.words[question].lower() == answer.lower()
                else:
                    is_correct = question.lower() == answer.lower()
                
                if is_correct:
                    self.stats[mode]['correct_words'].add(question)
                else:
                    self.stats[mode]['wrong_words'].add(question)
                
                return {
                    'correct': is_correct,
                    'correct_answer': self.words[question] if mode == 'guess' else question,
                    'remaining': self.get_remaining_words(mode)
                }
        return {'correct': False, 'correct_answer': None, 'remaining': 0}
    
    def reset_stats(self, mode=None):
        if mode:
            # 重置特定功能的统计
            self.stats[mode]['correct_words'].clear()
            self.stats[mode]['wrong_words'].clear()
        else:
            # 重置所有功能的统计
            for mode_stats in self.stats.values():
                mode_stats['correct_words'].clear()
                mode_stats['wrong_words'].clear()
        self.save_stats()
    
    def get_current_stats(self, mode):
        if mode == 'pattern':
            total = len(self.patterns)  # 使用句型总数
            remaining = len([p for p in self.patterns 
                            if p['id'] not in self.stats[mode]['correct_words']])
        else:
            total = len(self.words)  # 使用单词总数
            remaining = self.get_remaining_words(mode)
        
        return {
            'correct': len(self.stats[mode]['correct_words']),
            'wrong': len(self.stats[mode]['wrong_words']),
            'remaining': remaining,
            'total': total
        }
    
    def load_stats(self):
        if os.path.exists(self.stats_file):
            try:
                with open(self.stats_file, 'r', encoding='utf-8') as f:
                    saved_stats = json.load(f)
                    # 加载每个功能的统计数据
                    for mode in ['guess', 'translate', 'pattern']:
                        mode_stats = saved_stats.get(mode, {})
                        self.stats[mode]['correct_words'] = set(mode_stats.get('correct_words', []))
                        self.stats[mode]['wrong_words'] = set(mode_stats.get('wrong_words', []))
            except:
                pass
    
    def save_stats(self):
        # 保存所有功能的统计数据
        saved_stats = {}
        for mode in ['guess', 'translate', 'pattern']:
            saved_stats[mode] = {
                'correct_words': list(self.stats[mode]['correct_words']),
                'wrong_words': list(self.stats[mode]['wrong_words'])
            }
        os.makedirs(os.path.dirname(self.stats_file), exist_ok=True)
        with open(self.stats_file, 'w', encoding='utf-8') as f:
            json.dump(saved_stats, f, ensure_ascii=False, indent=2)
    
    def get_multiple_choice(self, correct_word):
        # 获取一个正确答案和5个错误选项
        choices = [self.words[correct_word]]  # 正确的中文翻译
        all_translations = list(self.words.values())
        while len(choices) < 6:
            choice = random.choice(all_translations)
            if choice not in choices:
                choices.append(choice)
        random.shuffle(choices)
        return choices
    
    def get_random_pattern(self):
        available_patterns = [p for p in self.patterns 
                             if p['id'] not in self.stats['pattern']['correct_words']]
        
        if not available_patterns:
            return None
            
        pattern = random.choice(available_patterns)
        return {
            'id': pattern.get('id', str(self.patterns.index(pattern))),
            'sentence': pattern['sentence'],
            'type': pattern['type'],
            'underline': pattern['underline'],
            'chinese': pattern['chinese_translation'],
            'english': pattern['answer'],
            'hint': pattern.get('hint', ''),
            'remaining': len(available_patterns)
        } 
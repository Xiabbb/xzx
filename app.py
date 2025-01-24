from flask import Flask, render_template, request, jsonify
from word_processor import WordProcessor
import os

app = Flask(__name__)
# 使用相对路径
word_processor = WordProcessor('data/word_data.json')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/guess')
def guess():
    return render_template('guess.html')

@app.route('/translate')
def translate():
    return render_template('translate.html')

@app.route('/pattern')
def pattern():
    return render_template('pattern.html')

@app.route('/get_word')
def get_word():
    word = word_processor.get_random_word('guess')
    if not word:
        return jsonify({'word': None})
    choices = word_processor.get_multiple_choice(word['english'])
    return jsonify({
        'word': word,
        'choices': choices
    })

@app.route('/get_word_for_translate')
def get_word_for_translate():
    word = word_processor.get_random_word('translate')
    return jsonify({
        'word': word
    })

@app.route('/get_pattern')
def get_pattern():
    pattern = word_processor.get_random_pattern()
    return jsonify({
        'pattern': pattern
    })

@app.route('/check_answer', methods=['POST'])
def check_answer():
    data = request.get_json()
    question = data.get('question')
    answer = data.get('answer')
    mode = data.get('mode', 'guess')
    result = word_processor.check_answer(question, answer, mode)
    word_processor.save_stats()
    return jsonify(result)

@app.route('/get_total_words')
def get_total_words():
    total = word_processor.get_total_words()
    return jsonify({'total': total})

@app.route('/get_total_patterns')
def get_total_patterns():
    total = word_processor.get_total_words('pattern')
    return jsonify({'total': total})

@app.route('/get_current_stats')
def get_current_stats():
    mode = request.args.get('mode', 'guess')
    return jsonify(word_processor.get_current_stats(mode))

@app.route('/reset_stats', methods=['POST'])
def reset_stats():
    mode = request.json.get('mode')
    word_processor.reset_stats(mode)
    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(debug=True) 
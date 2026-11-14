"""Worked example: "I made this whole reel without a camera." A ~7 s reel with the kid. Copy its structure, not its content.

    cp <skill>/example/spec.py <edit>/work/kid-reel/spec.py
    python3 <edit-video>/scripts/voice.py <edit>/work/kid-reel --engine hyperframes
    python3 <skill>/scripts/build.py <edit>/work/kid-reel

For the girl, set CHARACTER = {'look': 'girl'} and BACKGROUND = '#E6F4FF', ACCENT = '#E0457B'.
"""

LINES = [
    'I made this whole reel *without* a camera.',
    'No Blender. No studio. | Just *code.*',
    'Your *turn.*',
]
CHARACTER = {'look': 'boy'}          # or 'girl'; colours: skin, hair, top, bottom, shoes
BACKGROUND, ACCENT = '#FFE9D6', '#3D6FE0'
VOICES = {'host': 'am_michael'}      # a Kokoro voice for --engine hyperframes ('af_heart' for the girl)


def build(T):
    code, turn = T.find('code', line=1), T.find('turn', line=2)
    return dict(
        shots=[[0, 'full'], [T.L(1) - .06, 'close'], [code - .3, 'side'], [T.L(2) - .06, 'full']],
        acts=[[code - .25, 'point', T.L(2) - .05], [T.L(2) - .05, 'wave'], [turn + .15, 'happy']],
        card={'at': code - .25, 'out': T.L(2) - .2, 'lines': ['make(reel)', 'render()']},
        sfx=[[.03, 'ui-pop', -6], [T.L(1) - .06, 'zoom-swish', -9], [code - .3, 'zoom-swish', -9], [code - .25, 'ui-pop', -2],
             [code - .15, 'typing-tick', -12], [code + .75, 'clean-ding', -10], [T.L(2) - .06, 'zoom-swish', -9],
             [T.L(2) - .05, 'thock', -6], [turn + .15, 'sparkle', -10]],
    )

import os

files = [
    'dashboard.html',
    'donor_profile.html',
    'donor_register.html',
    'request_form.html',
    'sos_screen.html'
]

icons_html = """
  <link rel="icon" href="/static/icons/app-icon.png" type="image/png">
  <link rel="apple-touch-icon" href="/static/icons/app-icon.png">
"""

for fn in files:
    path = os.path.join('templates', fn)
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    if '<link rel="icon"' not in content:
        content = content.replace('<link rel="manifest" href="/manifest.json" />', '<link rel="manifest" href="/manifest.json" />' + icons_html)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)

print("Icons injected")

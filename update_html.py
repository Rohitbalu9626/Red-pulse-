import os
import re

files = [
    'dashboard.html',
    'donor_profile.html',
    'donor_register.html',
    'request_form.html',
    'sos_screen.html'
]

bottom_nav_template = """
  <!-- Bottom Tab Navigation -->
  <nav class="bottom-tab-nav">
    <a href="/dashboard" class="tab-link {dash_active}">
      <div class="tab-icon">📊</div>
      <div class="tab-label">Dashboard</div>
    </a>
    <a href="/register" class="tab-link {reg_active}">
      <div class="tab-icon">👤</div>
      <div class="tab-label">Register Donor</div>
    </a>
    <a href="/request" class="tab-link {req_active}">
      <div class="tab-icon">💉</div>
      <div class="tab-label">Blood Request</div>
    </a>
    <a href="/sos" class="tab-link {sos_active}">
      <div class="tab-icon">🆘</div>
      <div class="tab-label">SOS System</div>
    </a>
    <a href="/dashboard" class="tab-link">
      <div class="tab-icon">🔮</div>
      <div class="tab-label">AI Forecast</div>
    </a>
  </nav>
"""

for fn in files:
    path = os.path.join('templates', fn)
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove the top nav menu and mobile toggle
    content = re.sub(r'<nav class="nav-menu" id="mobile-nav">.*?<\/nav>', '', content, flags=re.DOTALL)
    content = re.sub(r'<button class="mobile-toggle"[^>]*>.*?<\/button>', '', content, flags=re.DOTALL)
    
    # Determine active state based on file
    dash_active = 'active' if fn == 'dashboard.html' else ''
    reg_active = 'active' if fn == 'donor_register.html' else ''
    req_active = 'active' if fn == 'request_form.html' else ''
    sos_active = 'active' if fn == 'sos_screen.html' else ''
    
    # If donor_profile, none are active
    
    nav_html = bottom_nav_template.format(
        dash_active=dash_active,
        reg_active=reg_active,
        req_active=req_active,
        sos_active=sos_active
    )
    
    # Insert before Scripts
    if '<script src="' in content:
        content = content.replace('  <script src="', nav_html + '\n  <script src="', 1)
    else:
        content = content.replace('</body>', nav_html + '\n</body>')
        
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
print("Updated all templates with bottom tab nav!")

import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

def create_presentation():
    prs = Presentation()
    # Set slide dimensions to widescreen (16:9)
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    
    # Custom Palette
    COLOR_PRIMARY = RGBColor(0, 106, 78)      # Bangladesh Deep Green / UIU Primary
    COLOR_PRIMARY_DARK = RGBColor(0, 77, 56) # Deep Forest Green
    COLOR_PRIMARY_LIGHT = RGBColor(230, 240, 237) # Light Greenish Gray
    COLOR_TEXT_DARK = RGBColor(30, 41, 59)    # Slate 800
    COLOR_TEXT_MUTED = RGBColor(100, 116, 139) # Slate 500
    COLOR_WHITE = RGBColor(255, 255, 255)
    COLOR_CARD_BG = RGBColor(248, 250, 252)   # Slate 50
    COLOR_ACCENT_RED = RGBColor(239, 68, 68)   # Red (for threat indicators)
    COLOR_BORDER = RGBColor(226, 232, 240)    # Slate 200

    # Fonts
    FONT_TITLE = "Trebuchet MS"
    FONT_BODY = "Calibri"

    def remove_border(shape):
        shape.line.fill.background()

    def add_header(slide, title_text, category="VIBORA"):
        # Category Tracker
        cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.7), Inches(0.3))
        cat_tf = cat_box.text_frame
        cat_tf.word_wrap = True
        cat_tf.margin_left = cat_tf.margin_top = cat_tf.margin_right = cat_tf.margin_bottom = 0
        cat_p = cat_tf.paragraphs[0]
        cat_p.text = category.upper()
        cat_p.font.name = FONT_TITLE
        cat_p.font.size = Pt(10)
        cat_p.font.bold = True
        cat_p.font.color.rgb = COLOR_PRIMARY
        
        # Main Slide Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.65), Inches(11.7), Inches(0.8))
        title_tf = title_box.text_frame
        title_tf.word_wrap = True
        title_tf.margin_left = title_tf.margin_top = title_tf.margin_right = title_tf.margin_bottom = 0
        title_p = title_tf.paragraphs[0]
        title_p.text = title_text
        title_p.font.name = FONT_TITLE
        title_p.font.size = Pt(28)
        title_p.font.bold = True
        title_p.font.color.rgb = COLOR_TEXT_DARK
        
        # Divider Line
        line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.4), Inches(11.733), Inches(0.03))
        line.fill.solid()
        line.fill.fore_color.rgb = COLOR_PRIMARY
        remove_border(line)

    blank_layout = prs.slide_layouts[6] # Blank slide layout

    # ==========================================
    # SLIDE 1: Title Slide
    # ==========================================
    slide1 = prs.slides.add_slide(blank_layout)
    
    # Dark Green Background
    bg1 = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg1.fill.solid()
    bg1.fill.fore_color.rgb = COLOR_PRIMARY_DARK
    remove_border(bg1)
    
    # Decorative accent block (bottom green accent)
    accent_bar = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, Inches(7.3), Inches(13.333), Inches(0.2))
    accent_bar.fill.solid()
    accent_bar.fill.fore_color.rgb = COLOR_WHITE
    remove_border(accent_bar)

    # Subtitle Category Tracker
    sub_cat_box = slide1.shapes.add_textbox(Inches(1.0), Inches(1.5), Inches(11.3), Inches(0.4))
    sub_cat_tf = sub_cat_box.text_frame
    sub_cat_p = sub_cat_tf.paragraphs[0]
    sub_cat_p.text = "COMPUTER SECURITY COURSE PROJECT (CSE 4531) • GROUP T15"
    sub_cat_p.font.name = FONT_TITLE
    sub_cat_p.font.size = Pt(12)
    sub_cat_p.font.bold = True
    sub_cat_p.font.color.rgb = COLOR_PRIMARY_LIGHT
    
    # Project Title
    title_box = slide1.shapes.add_textbox(Inches(1.0), Inches(1.8), Inches(11.3), Inches(1.8))
    title_tf = title_box.text_frame
    title_tf.word_wrap = True
    title_p = title_tf.paragraphs[0]
    title_p.text = "Vibora: A Localized Community Portal\n& Social Network for Bangladesh"
    title_p.font.name = FONT_TITLE
    title_p.font.size = Pt(40)
    title_p.font.bold = True
    title_p.font.color.rgb = COLOR_WHITE
    title_p.line_spacing = 1.1
    
    # Subtitle / Focus
    sub_box = slide1.shapes.add_textbox(Inches(1.0), Inches(3.7), Inches(11.3), Inches(0.5))
    sub_tf = sub_box.text_frame
    sub_p = sub_tf.paragraphs[0]
    sub_p.text = "Securing regional social platforms against telemetry harvesting, clickjacking, and backend injection"
    sub_p.font.name = FONT_BODY
    sub_p.font.size = Pt(16)
    sub_p.font.color.rgb = COLOR_PRIMARY_LIGHT

    # Institution
    inst_box = slide1.shapes.add_textbox(Inches(1.0), Inches(4.3), Inches(11.3), Inches(0.4))
    inst_tf = inst_box.text_frame
    inst_p = inst_tf.paragraphs[0]
    inst_p.text = "Department of Computer Science and Engineering • United International University"
    inst_p.font.name = FONT_TITLE
    inst_p.font.size = Pt(13)
    inst_p.font.bold = True
    inst_p.font.color.rgb = COLOR_WHITE

    # Group Members Header
    mem_header_box = slide1.shapes.add_textbox(Inches(1.0), Inches(4.8), Inches(11.3), Inches(0.3))
    mem_header_tf = mem_header_box.text_frame
    mem_header_p = mem_header_tf.paragraphs[0]
    mem_header_p.text = "Group Members:"
    mem_header_p.font.name = FONT_TITLE
    mem_header_p.font.size = Pt(11)
    mem_header_p.font.bold = True
    mem_header_p.font.color.rgb = COLOR_PRIMARY_LIGHT

    # Group Members Grid (6 members, 2 rows of 3 columns)
    members = [
        {"name": "Shariful Islam", "id": "011221078"},
        {"name": "Md. Mahmudul Hasan", "id": "011221079"},
        {"name": "Md. Ashiquzzaman Khan", "id": "011221080"},
        {"name": "Pulok Sikdar", "id": "011221167"},
        {"name": "Rahat Ahmed Shafi", "id": "011221201"},
        {"name": "Ahmad Hasan", "id": "011221435"},
    ]
    
    col_width = Inches(3.6)
    row_height = Inches(0.7)
    start_left = Inches(1.0)
    start_top = Inches(5.2)
    
    for idx, member in enumerate(members):
        col = idx % 3
        row = idx // 3
        
        m_left = start_left + col * (col_width + Inches(0.2))
        m_top = start_top + row * (row_height + Inches(0.1))
        
        # Member Box
        m_box = slide1.shapes.add_textbox(m_left, m_top, col_width, row_height)
        m_tf = m_box.text_frame
        m_tf.word_wrap = True
        m_p1 = m_tf.paragraphs[0]
        m_p1.text = member["name"]
        m_p1.font.name = FONT_BODY
        m_p1.font.size = Pt(13)
        m_p1.font.bold = True
        m_p1.font.color.rgb = COLOR_WHITE
        
        m_p2 = m_tf.add_paragraph()
        m_p2.text = f"ID: {member['id']}"
        m_p2.font.name = FONT_BODY
        m_p2.font.size = Pt(11)
        m_p2.font.color.rgb = COLOR_PRIMARY_LIGHT

    # ==========================================
    # SLIDE 2: Problem Statement & Motivation
    # ==========================================
    slide2 = prs.slides.add_slide(blank_layout)
    add_header(slide2, "Problem Statement & Motivation", "Context & Drivers")

    # Column 1 Card: The Problem (Dark Red Tint Border)
    p_card = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(5.6), Inches(4.9))
    p_card.fill.solid()
    p_card.fill.fore_color.rgb = COLOR_CARD_BG
    p_card.line.color.rgb = COLOR_BORDER
    p_card.line.width = Pt(1.5)
    
    # Problem Icon Indicator
    p_tag = slide2.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(1.2), Inches(2.2), Inches(1.8), Inches(0.35))
    p_tag.fill.solid()
    p_tag.fill.fore_color.rgb = COLOR_ACCENT_RED
    remove_border(p_tag)
    p_tag_tf = p_tag.text_frame
    p_tag_p = p_tag_tf.paragraphs[0]
    p_tag_p.text = "THE PROBLEM"
    p_tag_p.alignment = PP_ALIGN.CENTER
    p_tag_p.font.name = FONT_TITLE
    p_tag_p.font.size = Pt(10)
    p_tag_p.font.bold = True
    p_tag_p.font.color.rgb = COLOR_WHITE

    # Problem Text
    p_text_box = slide2.shapes.add_textbox(Inches(1.2), Inches(2.7), Inches(4.8), Inches(3.7))
    p_tf = p_text_box.text_frame
    p_tf.word_wrap = True
    
    p_p1 = p_tf.paragraphs[0]
    p_p1.text = "Invasive Centralized Telemetry"
    p_p1.font.name = FONT_TITLE
    p_p1.font.size = Pt(18)
    p_p1.font.bold = True
    p_p1.font.color.rgb = COLOR_TEXT_DARK
    p_p1.space_after = Pt(8)
    
    p_p2 = p_tf.add_paragraph()
    p_p2.text = "• Centralized social media platforms run invasive SDKs & telemetry scripts that harvest raw locations, search history, and device IDs for ad targeting."
    p_p2.font.name = FONT_BODY
    p_p2.font.size = Pt(14)
    p_p2.font.color.rgb = COLOR_TEXT_DARK
    p_p2.space_after = Pt(12)
    
    p_p3 = p_tf.add_paragraph()
    p_p3.text = "Insecure Federated Alternatives"
    p_p3.font.name = FONT_TITLE
    p_p3.font.size = Pt(18)
    p_p3.font.bold = True
    p_p3.font.color.rgb = COLOR_TEXT_DARK
    p_p3.space_after = Pt(8)
    
    p_p4 = p_tf.add_paragraph()
    p_p4.text = "• Decentralized networks push trust onto local administrators. Node admins can easily sniff unencrypted databases, logs, and private conversations."
    p_p4.font.name = FONT_BODY
    p_p4.font.size = Pt(14)
    p_p4.font.color.rgb = COLOR_TEXT_DARK

    # Column 2 Card: The Motivation (Green Tint Border)
    m_card = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.9), Inches(1.8), Inches(5.6), Inches(4.9))
    m_card.fill.solid()
    m_card.fill.fore_color.rgb = COLOR_CARD_BG
    m_card.line.color.rgb = COLOR_PRIMARY
    m_card.line.width = Pt(1.5)
    
    # Motivation Icon Indicator
    m_tag = slide2.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(7.3), Inches(2.2), Inches(1.8), Inches(0.35))
    m_tag.fill.solid()
    m_tag.fill.fore_color.rgb = COLOR_PRIMARY
    remove_border(m_tag)
    m_tag_tf = m_tag.text_frame
    m_tag_p = m_tag_tf.paragraphs[0]
    m_tag_p.text = "VIBORA'S VISION"
    m_tag_p.alignment = PP_ALIGN.CENTER
    m_tag_p.font.name = FONT_TITLE
    m_tag_p.font.size = Pt(10)
    m_tag_p.font.bold = True
    m_tag_p.font.color.rgb = COLOR_WHITE

    # Motivation Text
    m_text_box = slide2.shapes.add_textbox(Inches(7.3), Inches(2.7), Inches(4.8), Inches(3.7))
    m_tf = m_text_box.text_frame
    m_tf.word_wrap = True
    
    m_p1 = m_tf.paragraphs[0]
    m_p1.text = "Privacy-Centric Discovery"
    m_p1.font.name = FONT_TITLE
    m_p1.font.size = Pt(18)
    m_p1.font.bold = True
    m_p1.font.color.rgb = COLOR_PRIMARY
    m_p1.space_after = Pt(8)
    
    m_p2 = m_tf.add_paragraph()
    m_p2.text = "• Replaces raw coordinate tracking with coarse university & district metadata to match users locally (e.g. UIU peers, district blood donors) without leaking telemetry."
    m_p2.font.name = FONT_BODY
    m_p2.font.size = Pt(14)
    m_p2.font.color.rgb = COLOR_TEXT_DARK
    m_p2.space_after = Pt(12)
    
    m_p3 = m_tf.add_paragraph()
    m_p3.text = "Mitigated Server Environment"
    m_p3.font.name = FONT_TITLE
    m_p3.font.size = Pt(18)
    m_p3.font.bold = True
    m_p3.font.color.rgb = COLOR_PRIMARY
    m_p3.space_after = Pt(8)
    
    m_p4 = m_tf.add_paragraph()
    m_p4.text = "• Operates a hardened environment with Zero external tracker dependencies, custom middleware to sanitize database queries, and secure header profiles."
    m_p4.font.name = FONT_BODY
    m_p4.font.size = Pt(14)
    m_p4.font.color.rgb = COLOR_TEXT_DARK

    # ==========================================
    # SLIDE 3: Background & Related Work
    # ==========================================
    slide3 = prs.slides.add_slide(blank_layout)
    add_header(slide3, "Background & Related Work", "Market Positioning & Precedents")

    # Left Column: The Landscape (Text & Bullet list)
    left_box = slide3.shapes.add_textbox(Inches(0.8), Inches(1.8), Inches(5.6), Inches(4.9))
    left_tf = left_box.text_frame
    left_tf.word_wrap = True
    
    lt_p1 = left_tf.paragraphs[0]
    lt_p1.text = "The Localized Utility Gap"
    lt_p1.font.name = FONT_TITLE
    lt_p1.font.size = Pt(20)
    lt_p1.font.bold = True
    lt_p1.font.color.rgb = COLOR_PRIMARY
    lt_p1.space_after = Pt(12)
    
    lt_p2 = left_tf.add_paragraph()
    lt_p2.text = "Bangladeshi internet users rely on highly disjointed platforms for daily community needs:\n" \
                "• Tuition Matching (Student tutoring boards)\n" \
                "• Emergency Blood Donor Finding (Red Crescent, FB groups)\n" \
                "• Local Classifieds & Job Openings (Bikroy, regional groups)\n" \
                "• Real-time peer networking & notices"
    lt_p2.font.name = FONT_BODY
    lt_p2.font.size = Pt(15)
    lt_p2.font.color.rgb = COLOR_TEXT_DARK
    lt_p2.space_after = Pt(15)
    
    lt_p3 = left_tf.add_paragraph()
    lt_p3.text = "These networks lack identity verification, expose sensitive contact information to generic search crawlers, and do not prioritize client or data security."
    lt_p3.font.name = FONT_BODY
    lt_p3.font.size = Pt(15)
    lt_p3.font.color.rgb = COLOR_TEXT_MUTED

    # Right Column: Comparative Grid (Cards)
    comp_data = [
        {"platform": "Facebook Groups", "security": "Poor Security Headers / Massive Ad Profiling", "privacy": "High Exposure of PII, raw profile scrapers"},
        {"platform": "Regional Boards", "security": "Lack of Query Sanitization & SSL Enforcements", "privacy": "Exposes email/mobile numbers to crawl bots"},
        {"platform": "Vibora Portal", "security": "HSTS, CSP, X-Frame-Options, NoSQL Sanitizer", "privacy": "Coarse boundaries, PII filtered on API layer"}
    ]
    
    card_width = Inches(5.6)
    card_height = Inches(1.4)
    start_left = Inches(6.9)
    start_top = Inches(1.8)
    
    for idx, comp in enumerate(comp_data):
        c_top = start_top + idx * (card_height + Inches(0.2))
        
        card = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, start_left, c_top, card_width, card_height)
        card.fill.solid()
        if idx == 2:
            # Highlight Vibora
            card.fill.fore_color.rgb = COLOR_PRIMARY_LIGHT
            card.line.color.rgb = COLOR_PRIMARY
            card.line.width = Pt(1.5)
        else:
            card.fill.fore_color.rgb = COLOR_CARD_BG
            card.line.color.rgb = COLOR_BORDER
            card.line.width = Pt(1.0)
            
        tb = slide3.shapes.add_textbox(start_left + Inches(0.2), c_top + Inches(0.1), card_width - Inches(0.4), card_height - Inches(0.2))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_top = tf.margin_bottom = tf.margin_left = tf.margin_right = 0
        
        p1 = tf.paragraphs[0]
        p1.text = comp["platform"]
        p1.font.name = FONT_TITLE
        p1.font.size = Pt(15)
        p1.font.bold = True
        if idx == 2:
            p1.font.color.rgb = COLOR_PRIMARY
        else:
            p1.font.color.rgb = COLOR_TEXT_DARK
        p1.space_after = Pt(2)
        
        p2 = tf.add_paragraph()
        p2.text = f"• Security: {comp['security']}"
        p2.font.name = FONT_BODY
        p2.font.size = Pt(12)
        p2.font.color.rgb = COLOR_TEXT_DARK
        
        p3 = tf.add_paragraph()
        p3.text = f"• Privacy: {comp['privacy']}"
        p3.font.name = FONT_BODY
        p3.font.size = Pt(12)
        p3.font.color.rgb = COLOR_TEXT_MUTED

    # ==========================================
    # SLIDE 4: Threat Model & Security Scope
    # ==========================================
    slide4 = prs.slides.add_slide(blank_layout)
    add_header(slide4, "Threat Model & Security Scope", "System Vulnerabilities & Boundaries")

    # Threat Cards (4 grid blocks)
    threats = [
        {
            "num": "01",
            "title": "Client-Side Hooking",
            "actor": "Remote Web Exploiter",
            "vector": "Injecting BeEF browser hook scripts via unhardened HTTP interfaces.",
            "impact": "Session takeover, client keylogging."
        },
        {
            "num": "02",
            "title": "Clickjacking Overlays",
            "actor": "Phishing & Spoofing Operators",
            "vector": "Framing the login portal using King Phisher overlays to harvest credentials.",
            "impact": "Credentials leak, student identity fraud."
        },
        {
            "num": "03",
            "title": "NoSQL Injection",
            "actor": "Malicious Authenticated User",
            "vector": "Sending JSON payloads containing operator bypasses ($ne, $gt) to MongoDB endpoints.",
            "impact": "Authentication bypass, database extraction."
        },
        {
            "num": "04",
            "title": "PII Harvesting",
            "actor": "Commercial Advertisers / Scrapers",
            "vector": "Scraping location details, phone numbers, and peer relationships via open REST APIs.",
            "impact": "Physical tracking, spam profile creation."
        }
    ]
    
    t_width = Inches(5.6)
    t_height = Inches(2.3)
    
    offsets = [
        (Inches(0.8), Inches(1.8)), # Top-Left
        (Inches(6.9), Inches(1.8)), # Top-Right
        (Inches(0.8), Inches(4.4)), # Bottom-Left
        (Inches(6.9), Inches(4.4))  # Bottom-Right
    ]
    
    for idx, threat in enumerate(threats):
        x, y = offsets[idx]
        
        # Threat Card shape
        card = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, t_width, t_height)
        card.fill.solid()
        card.fill.fore_color.rgb = COLOR_CARD_BG
        card.line.color.rgb = COLOR_BORDER
        card.line.width = Pt(1.0)
        
        # Indicator line on the left side of the card
        indicator = slide4.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, y + Inches(0.3), Inches(0.08), Inches(1.7))
        indicator.fill.solid()
        indicator.fill.fore_color.rgb = COLOR_ACCENT_RED
        remove_border(indicator)
        
        # Text block
        tb = slide4.shapes.add_textbox(x + Inches(0.3), y + Inches(0.15), t_width - Inches(0.5), t_height - Inches(0.3))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_top = tf.margin_bottom = tf.margin_left = tf.margin_right = 0
        
        p_title = tf.paragraphs[0]
        p_title.text = f"{threat['num']}. {threat['title']}"
        p_title.font.name = FONT_TITLE
        p_title.font.size = Pt(16)
        p_title.font.bold = True
        p_title.font.color.rgb = COLOR_TEXT_DARK
        p_title.space_after = Pt(4)
        
        p_actor = tf.add_paragraph()
        p_actor.text = f"Threat Actor: {threat['actor']}"
        p_actor.font.name = FONT_BODY
        p_actor.font.size = Pt(11)
        p_actor.font.bold = True
        p_actor.font.color.rgb = COLOR_ACCENT_RED
        p_actor.space_after = Pt(4)
        
        p_vector = tf.add_paragraph()
        p_vector.text = f"Attack: {threat['vector']}"
        p_vector.font.name = FONT_BODY
        p_vector.font.size = Pt(12)
        p_vector.font.color.rgb = COLOR_TEXT_DARK
        p_vector.space_after = Pt(4)
        
        p_impact = tf.add_paragraph()
        p_impact.text = f"Impact: {threat['impact']}"
        p_impact.font.name = FONT_BODY
        p_impact.font.size = Pt(11)
        p_impact.font.italic = True
        p_impact.font.color.rgb = COLOR_TEXT_MUTED

    # ==========================================
    # SLIDE 5: Proposed Solution & System Architecture
    # ==========================================
    slide5 = prs.slides.add_slide(blank_layout)
    add_header(slide5, "Proposed Solution & System Architecture", "Integrated Hardened Blueprint")

    # Three Vertical Columns representing Client, Server, Database
    cols = [
        {
            "title": "HARDENED CLIENT (React)",
            "tech": "Vite SPA + Tailwind CSS v4",
            "items": [
                "Strict Content Security Policy: Response headers restrict script evaluation exclusively to 'self' source blocks.",
                "Clickjacking Shields: Frames are fully blocked via X-Frame-Options: DENY configurations.",
                "Force TLS Channels: HSTS policies force clients to bypass HTTP, mitigating MITM credentials sniffing."
            ],
            "color": COLOR_PRIMARY_LIGHT,
            "border": COLOR_PRIMARY
        },
        {
            "title": "MITIGATED SERVER (Node)",
            "tech": "Express API + Native WebSockets",
            "items": [
                "NoSQL Injection Shield: Middleware scans incoming payloads recursively, stripping any keys prefixed with '$'.",
                "WebSocket Verification: Connection handshake validates JWT signatures before spawning channels.",
                "Standardized Logs: Emits JSON structures compatible with SIEM (Wazuh/ELK) for instant auditing."
            ],
            "color": COLOR_CARD_BG,
            "border": COLOR_BORDER
        },
        {
            "title": "HYBRID STORAGE DB",
            "tech": "Zero-Config Atlas / Local Fallback",
            "items": [
                "Strict Port Isolation: MongoDB bindings reject external connections; internal API traffic only.",
                "PII Filter Pipeline: Schemas sanitize output arrays, filtering sensitive hashes/emails on read.",
                "RAM Cache Protection: In-memory filters block brute-force resource exhausting request sequences."
            ],
            "color": COLOR_CARD_BG,
            "border": COLOR_BORDER
        }
    ]
    
    col_width = Inches(3.7)
    col_height = Inches(4.9)
    col_spacing = Inches(0.3)
    start_left = Inches(0.8)
    start_top = Inches(1.8)
    
    for idx, col in enumerate(cols):
        c_left = start_left + idx * (col_width + col_spacing)
        
        # Background box
        box = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, c_left, start_top, col_width, col_height)
        box.fill.solid()
        box.fill.fore_color.rgb = col["color"]
        box.line.color.rgb = col["border"]
        box.line.width = Pt(1.5)
        
        # Content textbox
        tb = slide5.shapes.add_textbox(c_left + Inches(0.2), start_top + Inches(0.2), col_width - Inches(0.4), col_height - Inches(0.4))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_top = tf.margin_bottom = tf.margin_left = tf.margin_right = 0
        
        # Title
        p_title = tf.paragraphs[0]
        p_title.text = col["title"]
        p_title.font.name = FONT_TITLE
        p_title.font.size = Pt(16)
        p_title.font.bold = True
        p_title.font.color.rgb = COLOR_TEXT_DARK
        p_title.space_after = Pt(2)
        
        # Tech sub title
        p_tech = tf.add_paragraph()
        p_tech.text = col["tech"]
        p_tech.font.name = FONT_BODY
        p_tech.font.size = Pt(11)
        p_tech.font.bold = True
        p_tech.font.color.rgb = COLOR_PRIMARY if idx != 1 else COLOR_TEXT_MUTED
        p_tech.space_after = Pt(12)
        
        # Items
        for item in col["items"]:
            p_item = tf.add_paragraph()
            parts = item.split(": ", 1)
            if len(parts) == 2:
                # Bold the prefix
                p_item.text = f"• "
                run1 = p_item.add_run()
                run1.text = parts[0] + ": "
                run1.font.bold = True
                run2 = p_item.add_run()
                run2.text = parts[1]
            else:
                p_item.text = f"• {item}"
                
            p_item.font.name = FONT_BODY
            p_item.font.size = Pt(12)
            p_item.font.color.rgb = COLOR_TEXT_DARK
            p_item.space_after = Pt(8)

    # ==========================================
    # SLIDE 6: Ethical Considerations & Safety Precautions
    # ==========================================
    slide6 = prs.slides.add_slide(blank_layout)
    add_header(slide6, "Ethical Considerations & Safety Precautions", "Human Centric Protection & Abuse Prevention")

    # Grid of 4 Ethical pillars
    pillars = [
        {
            "title": "Geotag Tracking Mitigation",
            "desc": "Mitigates physical stalker risks by rejecting GPS trackers. Coarse city/university parameters allow peer matching without compromising the physical location histories of students, tutors, or blood donors."
        },
        {
            "title": "Centralized Log Auditing",
            "desc": "Logging formats avoid capturing raw API keys, passwords, or transaction codes. Centralized structures are formatted to monitor traffic anomalies without infringing on user profile privacy rights."
        },
        {
            "title": "PII Minimization on Fetch",
            "desc": "Database responses are passed through custom filters before reaching the API layer. Credentials, email addresses, and session variables are scrubbed out by default, stopping unintentional system leaks."
        },
        {
            "title": "Denial-of-Service Defense",
            "desc": "Protects platform availability for critical operations (like emergency blood matching) by restricting socket connection handshakes and query sizes, preventing server crash attempts."
        }
    ]
    
    col_w = Inches(5.6)
    row_h = Inches(2.3)
    grid_offsets = [
        (Inches(0.8), Inches(1.8)),
        (Inches(6.9), Inches(1.8)),
        (Inches(0.8), Inches(4.4)),
        (Inches(6.9), Inches(4.4))
    ]
    
    for idx, pillar in enumerate(pillars):
        gx, gy = grid_offsets[idx]
        
        card = slide6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, gx, gy, col_w, row_h)
        card.fill.solid()
        card.fill.fore_color.rgb = COLOR_CARD_BG
        card.line.color.rgb = COLOR_PRIMARY if idx in [0, 2] else COLOR_BORDER
        card.line.width = Pt(1.2)
        
        # Subtle numerical label
        num_box = slide6.shapes.add_textbox(gx + Inches(0.2), gy + Inches(0.15), Inches(0.6), Inches(0.4))
        num_tf = num_box.text_frame
        num_p = num_tf.paragraphs[0]
        num_p.text = f"0{idx+1}"
        num_p.font.name = FONT_TITLE
        num_p.font.size = Pt(22)
        num_p.font.bold = True
        num_p.font.color.rgb = COLOR_PRIMARY_LIGHT if idx not in [0, 2] else COLOR_PRIMARY_LIGHT
        
        tb = slide6.shapes.add_textbox(gx + Inches(0.9), gy + Inches(0.15), col_w - Inches(1.1), row_h - Inches(0.3))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_top = tf.margin_bottom = tf.margin_left = tf.margin_right = 0
        
        p_title = tf.paragraphs[0]
        p_title.text = pillar["title"]
        p_title.font.name = FONT_TITLE
        p_title.font.size = Pt(16)
        p_title.font.bold = True
        p_title.font.color.rgb = COLOR_TEXT_DARK
        p_title.space_after = Pt(4)
        
        p_desc = tf.add_paragraph()
        p_desc.text = pillar["desc"]
        p_desc.font.name = FONT_BODY
        p_desc.font.size = Pt(13)
        p_desc.font.color.rgb = COLOR_TEXT_MUTED
        
    # ==========================================
    # SLIDE 7: Conclusion
    # ==========================================
    slide7 = prs.slides.add_slide(blank_layout)
    add_header(slide7, "Conclusion & Future Outlook", "Summary & Next Steps")

    # Left Box: Key Achievements
    left_card = slide7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(5.6), Inches(4.9))
    left_card.fill.solid()
    left_card.fill.fore_color.rgb = COLOR_CARD_BG
    left_card.line.color.rgb = COLOR_PRIMARY
    left_card.line.width = Pt(1.5)
    
    left_tag = slide7.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(1.2), Inches(2.2), Inches(2.2), Inches(0.35))
    left_tag.fill.solid()
    left_tag.fill.fore_color.rgb = COLOR_PRIMARY
    remove_border(left_tag)
    left_tag_tf = left_tag.text_frame
    left_tag_p = left_tag_tf.paragraphs[0]
    left_tag_p.text = "KEY ACHIEVEMENTS"
    left_tag_p.alignment = PP_ALIGN.CENTER
    left_tag_p.font.name = FONT_TITLE
    left_tag_p.font.size = Pt(10)
    left_tag_p.font.bold = True
    left_tag_p.font.color.rgb = COLOR_WHITE

    left_tb = slide7.shapes.add_textbox(Inches(1.2), Inches(2.7), Inches(4.8), Inches(3.7))
    left_tf = left_tb.text_frame
    left_tf.word_wrap = True
    
    lp1 = left_tf.paragraphs[0]
    lp1.text = "Hardened Regional Social Portal"
    lp1.font.name = FONT_TITLE
    lp1.font.size = Pt(17)
    lp1.font.bold = True
    lp1.font.color.rgb = COLOR_TEXT_DARK
    lp1.space_after = Pt(4)
    
    lp2 = left_tf.add_paragraph()
    lp2.text = "• Successfully combined localized utilities (tutor matching, blood donor finding, internship board) with a secure social environment."
    lp2.font.name = FONT_BODY
    lp2.font.size = Pt(13)
    lp2.font.color.rgb = COLOR_TEXT_DARK
    lp2.space_after = Pt(10)
    
    lp3 = left_tf.add_paragraph()
    lp3.text = "Privacy by Design Baseline"
    lp3.font.name = FONT_TITLE
    lp3.font.size = Pt(17)
    lp3.font.bold = True
    lp3.font.color.rgb = COLOR_TEXT_DARK
    lp3.space_after = Pt(4)
    
    lp4 = left_tf.add_paragraph()
    lp4.text = "• Mitigated stalker risks and third-party advertising tracking by replacing precise geolocation telemetry with coarse university and district parameters."
    lp4.font.name = FONT_BODY
    lp4.font.size = Pt(13)
    lp4.font.color.rgb = COLOR_TEXT_DARK

    # Right Box: Future Security Roadmap
    right_card = slide7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.9), Inches(1.8), Inches(5.6), Inches(4.9))
    right_card.fill.solid()
    right_card.fill.fore_color.rgb = COLOR_CARD_BG
    right_card.line.color.rgb = COLOR_BORDER
    right_card.line.width = Pt(1.5)
    
    right_tag = slide7.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(7.3), Inches(2.2), Inches(2.2), Inches(0.35))
    right_tag.fill.solid()
    right_tag.fill.fore_color.rgb = COLOR_TEXT_MUTED
    remove_border(right_tag)
    right_tag_tf = right_tag.text_frame
    right_tag_p = right_tag_tf.paragraphs[0]
    right_tag_p.text = "FUTURE ROADMAP"
    right_tag_p.alignment = PP_ALIGN.CENTER
    right_tag_p.font.name = FONT_TITLE
    right_tag_p.font.size = Pt(10)
    right_tag_p.font.bold = True
    right_tag_p.font.color.rgb = COLOR_WHITE

    right_tb = slide7.shapes.add_textbox(Inches(7.3), Inches(2.7), Inches(4.8), Inches(3.7))
    right_tf = right_tb.text_frame
    right_tf.word_wrap = True
    
    rp1 = right_tf.paragraphs[0]
    rp1.text = "SIEM & Wazuh Streaming Integration"
    rp1.font.name = FONT_TITLE
    rp1.font.size = Pt(17)
    rp1.font.bold = True
    rp1.font.color.rgb = COLOR_TEXT_DARK
    rp1.space_after = Pt(4)
    
    rp2 = right_tf.add_paragraph()
    rp2.text = "• Standardized JSON system logs are ready to be streamed to automated SIEM dashboards for active intrusion detection and security alerts."
    rp2.font.name = FONT_BODY
    rp2.font.size = Pt(13)
    rp2.font.color.rgb = COLOR_TEXT_DARK
    rp2.space_after = Pt(10)
    
    rp3 = right_tf.add_paragraph()
    rp3.text = "MFA & Session Hardening"
    rp3.font.name = FONT_TITLE
    rp3.font.size = Pt(17)
    rp3.font.bold = True
    rp3.font.color.rgb = COLOR_TEXT_DARK
    rp3.space_after = Pt(4)
    
    rp4 = right_tf.add_paragraph()
    rp4.text = "• Enforce hardware token authentication or email/SMS OTPs to completely neutralize mock phishing overlays and physical session thefts."
    rp4.font.name = FONT_BODY
    rp4.font.size = Pt(13)
    rp4.font.color.rgb = COLOR_TEXT_DARK
        
    prs.save("f:\\Web Development\\Website-Project\\Vibora_Security_Presentation.pptx")
    print("Presentation saved successfully at Vibora_Security_Presentation.pptx")

if __name__ == "__main__":
    create_presentation()

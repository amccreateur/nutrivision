import os
from PIL import Image, ImageDraw, ImageFont

def generate_paywall_screenshot(output_path):
    width, height = 1290, 2796
    img = Image.new('RGB', (width, height), color='#070D1E')
    draw = ImageDraw.Draw(img)

    # Load system TrueType fonts
    try:
        font_huge = ImageFont.truetype('arialbd.ttf', 76)
        font_title = ImageFont.truetype('arialbd.ttf', 54)
        font_plan_title = ImageFont.truetype('arialbd.ttf', 44)
        font_plan_price = ImageFont.truetype('arialbd.ttf', 48)
        font_feat_title = ImageFont.truetype('arialbd.ttf', 36)
        font_btn = ImageFont.truetype('arialbd.ttf', 44)
        font_regular = ImageFont.truetype('arial.ttf', 32)
        font_sub = ImageFont.truetype('arial.ttf', 34)
        font_small = ImageFont.truetype('arial.ttf', 26)
        font_badge = ImageFont.truetype('arialbd.ttf', 26)
        font_clock = ImageFont.truetype('arialbd.ttf', 46)
    except Exception:
        font_huge = ImageFont.load_default()
        font_title = font_huge
        font_plan_title = font_huge
        font_plan_price = font_huge
        font_feat_title = font_huge
        font_btn = font_huge
        font_regular = font_huge
        font_sub = font_huge
        font_small = font_huge
        font_badge = font_huge
        font_clock = font_huge

    # 1. Status Bar (Dynamic Island & Clock)
    # Clock 9:41
    draw.text((120, 75), "9:41", fill="#FFFFFF", font=font_clock)
    # Dynamic Island
    draw.rounded_rectangle([(width//2 - 190, 60), (width//2 + 190, 160)], radius=50, fill="#000000")
    # Battery & Wifi icons (right side)
    draw.rounded_rectangle([(width - 220, 85), (width - 160, 120)], radius=8, outline="#FFFFFF", width=3)
    draw.rectangle([(width - 215, 90), (width - 170, 115)], fill="#FFFFFF")
    draw.rectangle([(width - 157, 97), (width - 153, 108)], fill="#FFFFFF")

    # 2. Header Bar
    # Close button
    draw.rounded_rectangle([(80, 220), (160, 300)], radius=40, fill="#131C35", outline="#223055", width=2)
    draw.text((105, 238), "✕", fill="#94A3B8", font=font_title)

    # Center Badge "OFFRE EXCLUSIVE"
    badge_text = "✨ OFFRE EXCLUSIVE"
    badge_w = 360
    badge_x = width // 2 - badge_w // 2
    draw.rounded_rectangle([(badge_x, 230), (badge_x + badge_w, 290)], radius=30, fill="#2A2415", outline="#F59E0B", width=2)
    draw.text((badge_x + 35, 245), badge_text, fill="#F59E0B", font=font_badge)

    # Restore Button on right
    draw.text((width - 260, 248), "Restaurer", fill="#38BDF8", font=font_regular)

    # 3. Hero Icon & Titles
    # Glowing Crown circle
    center_y = 440
    draw.ellipse([(width//2 - 90, center_y - 90), (width//2 + 90, center_y + 90)], fill="#231B0D", outline="#F59E0B", width=4)
    draw.text((width//2 - 40, center_y - 50), "👑", fill="#F59E0B", font=font_huge)

    # Main Title
    draw.text((width//2 - 250, 570), "NutriVision Pro", fill="#FFFFFF", font=font_huge)
    # Subtitle
    sub_text = "Libérez tout le potentiel de votre nutrition sans interruption."
    draw.text((width//2 - 440, 670), sub_text, fill="#94A3B8", font=font_sub)

    # 4. Features Card
    feat_y = 780
    feat_h = 620
    draw.rounded_rectangle([(70, feat_y), (width - 70, feat_y + feat_h)], radius=36, fill="#0F172E", outline="#1E293B", width=3)

    features = [
        ("🚫", "#10B981", "100% Sans Publicité", "Bannières et annonces coupées sur toute l'app."),
        ("⚡", "#38BDF8", "Scans & Analyses IA Illimités", "Analysez chaque repas sans limite quotidienne de 2 scans."),
        ("📄", "#F59E0B", "Rapports & Bilans PDF", "Exportez vos bilans pour votre médecin ou coach."),
        ("🧠", "#A78BFA", "IA Vision Haute Précision", "Détection multi-aliments, calculs calories & macros.")
    ]

    for i, (icon, color, f_title, f_desc) in enumerate(features):
        row_y = feat_y + 35 + (i * 142)
        # Icon circle
        draw.rounded_rectangle([(110, row_y), (195, row_y + 85)], radius=24, fill="#18233C")
        draw.text((130, row_y + 18), icon, fill=color, font=font_feat_title)
        # Texts
        draw.text((225, row_y + 6), f_title, fill="#FFFFFF", font=font_feat_title)
        draw.text((225, row_y + 48), f_desc, fill="#94A3B8", font=font_regular)

    # 5. Plans Section
    draw.text((80, 1450), "Choisissez votre formule :", fill="#E2E8F0", font=font_title)

    # Card 1: À Vie (9,99 €) - Selected (Highlight)
    p1_y = 1530
    p1_h = 240
    # Gold glowing selected card
    draw.rounded_rectangle([(70, p1_y), (width - 70, p1_y + p1_h)], radius=36, fill="#1B1C28", outline="#F59E0B", width=4)
    # Badge "POPULAIRE"
    draw.rounded_rectangle([(width - 270, p1_y - 20), (width - 100, p1_y + 26)], radius=18, fill="#F59E0B")
    draw.text((width - 250, p1_y - 14), "POPULAIRE", fill="#0F172A", font=font_badge)

    # Radio circle (checked)
    draw.ellipse([(120, p1_y + 85), (180, p1_y + 145)], fill="#0F172A", outline="#F59E0B", width=4)
    draw.ellipse([(135, p1_y + 100), (165, p1_y + 130)], fill="#F59E0B")

    # Plan details
    draw.text((215, p1_y + 60), "À Vie", fill="#FFFFFF", font=font_plan_title)
    draw.text((215, p1_y + 125), "Paiement unique • Accès permanent", fill="#94A3B8", font=font_regular)

    # Price
    draw.text((width - 320, p1_y + 85), "9,99 €", fill="#F59E0B", font=font_plan_price)

    # Card 2: Mensuel (1,99 €)
    p2_y = 1810
    p2_h = 240
    draw.rounded_rectangle([(70, p2_y), (width - 70, p2_y + p2_h)], radius=36, fill="#0F172E", outline="#243354", width=3)

    # Radio circle (unchecked)
    draw.ellipse([(120, p2_y + 85), (180, p2_y + 145)], fill="#0F172A", outline="#475569", width=4)

    # Plan details
    draw.text((215, p2_y + 60), "Mensuel", fill="#CBD5E1", font=font_plan_title)
    draw.text((215, p2_y + 125), "Facturation par mois • Sans engagement", fill="#94A3B8", font=font_regular)

    # Price
    draw.text((width - 400, p2_y + 85), "1,99 € /mois", fill="#FFFFFF", font=font_plan_price)

    # 6. Big CTA Button
    btn_y = 2120
    btn_h = 140
    draw.rounded_rectangle([(70, btn_y), (width - 70, btn_y + btn_h)], radius=42, fill="#F59E0B")
    btn_text = "👑 Débloquer NutriVision Pro"
    draw.text((width//2 - 300, btn_y + 42), btn_text, fill="#0F172A", font=font_btn)

    # 7. Cancel anytime info
    draw.text((width//2 - 320, 2300), "Annulable à tout moment depuis vos réglages Store.", fill="#94A3B8", font=font_sub)

    # 8. Restore Purchases Button
    draw.rounded_rectangle([(width//2 - 220, 2370), (width//2 + 220, 2440)], radius=24, fill="#131C35")
    draw.text((width//2 - 150, 2390), "Restaurer mes achats", fill="#CBD5E1", font=font_regular)

    # 9. Legal Terms
    draw.text((width//2 - 360, 2500), "Conditions d'utilisation (CGU)   •   Confidentialité", fill="#64748B", font=font_small)
    draw.text((width//2 - 420, 2545), "Paiement sécurisé via votre compte App Store / Google Play", fill="#475569", font=font_small)

    # 10. Home Indicator
    draw.rounded_rectangle([(width//2 - 200, 2740), (width//2 + 200, 2754)], radius=8, fill="#475569")

    # Save
    img.save(output_path, "PNG", quality=95)
    print(f"Screenshot successfully generated at {output_path}")

if __name__ == "__main__":
    out = os.path.abspath("NutriVision_IAP_Paywall_Review.png")
    generate_paywall_screenshot(out)


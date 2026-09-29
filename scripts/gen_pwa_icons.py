from PIL import Image

src = Image.open("public/logo.png").convert("RGBA")
BG = (14, 17, 20, 255)  # ink-950


def resize(img, size):
    return img.resize((size, size), Image.LANCZOS)


def on_bg(img, size, scale):
    canvas = Image.new("RGBA", (size, size), BG)
    inner = int(size * scale)
    logo = resize(img, inner)
    offset = ((size - inner) // 2, (size - inner) // 2)
    canvas.paste(logo, offset, logo)
    return canvas.convert("RGB")


# Transparent "any" purpose icons
resize(src, 192).save("public/icons/icon-192.png")
resize(src, 512).save("public/icons/icon-512.png")

# Maskable icon: safe zone ~ centered logo at 65% with solid background
on_bg(src, 512, 0.65).save("public/icons/icon-maskable-512.png")

# Apple touch icon: iOS ignores alpha, needs opaque background
on_bg(src, 180, 0.82).save("public/apple-touch-icon.png")

print("done")

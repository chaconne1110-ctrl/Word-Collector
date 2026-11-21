#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

# ImageMagick 7. The source contains only the logo, with transparent surroundings.
# Android supplies the single outer shape; never draw another tile inside it.
source_icon=assets/branding/launcher-foreground.png
resource_dir=android/app/src/main/res
icon_tmp=$(mktemp -d)
trap 'rm -rf "$icon_tmp"' EXIT
# Ignore nearly invisible alpha specks when measuring padding, while retaining
# the source's antialiased edges and colors in the cropped artwork.
glyph_bounds=$(magick "$source_icon" -alpha extract -threshold 10% -format '%@' info:)
magick "$source_icon" -crop "$glyph_bounds" +repage "$icon_tmp/glyph.png"

# A 48dp glyph in the 108dp adaptive layer occupies about two thirds of the
# visible 72dp icon. Keep the white card within the logo opaque.
for spec in mdpi:1 hdpi:1.5 xhdpi:2 xxhdpi:3 xxxhdpi:4; do
  density=${spec%%:*}
  scale=${spec##*:}
  foreground_size=$(awk -v s="$scale" 'BEGIN {printf "%.0f",108*s}')
  glyph_size=$(awk -v s="$scale" 'BEGIN {printf "%.0f",48*s}')
  legacy_size=$(awk -v s="$scale" 'BEGIN {printf "%.0f",48*s}')
  legacy_glyph=$(awk -v s="$scale" 'BEGIN {printf "%.0f",32*s}')
  output="$resource_dir/mipmap-$density"
  magick "$icon_tmp/glyph.png" -resize "${glyph_size}x${glyph_size}" \
    -gravity center -background none -extent "${foreground_size}x${foreground_size}" \
    -strip "$output/ic_launcher_foreground.png"
  magick "$icon_tmp/glyph.png" -resize "${legacy_glyph}x${legacy_glyph}" \
    -gravity center -background white -extent "${legacy_size}x${legacy_size}" \
    -alpha remove -alpha off -strip "$output/ic_launcher.png"
  # Pre-adaptive round launchers also get a single shape, with no inner frame.
  center=$(awk -v n="$legacy_size" 'BEGIN {print (n-1)/2}')
  magick -size "${legacy_size}x${legacy_size}" xc:none -fill white \
    -draw "circle $center,$center $center,0" "$icon_tmp/round-mask.png"
  magick "$output/ic_launcher.png" "$icon_tmp/round-mask.png" \
    -alpha off -compose CopyOpacity -composite -strip "$output/ic_launcher_round.png"
done

# Square, opaque white web icons: the OS applies its own outer mask.
magick "$icon_tmp/glyph.png" -resize 341x341 -gravity center -background white \
  -extent 512x512 -alpha remove -alpha off -strip www/icons/icon-maskable.png
magick www/icons/icon-maskable.png -resize 256x256 -define webp:lossless=true \
  www/icons/wordcollector-app-icon.webp
magick www/icons/icon-maskable.png -resize 192x192 www/icons/apple-touch-icon.png
cp www/icons/wordcollector-app-icon.webp "$resource_dir/drawable-nodpi/wordcollector_app_icon.webp"

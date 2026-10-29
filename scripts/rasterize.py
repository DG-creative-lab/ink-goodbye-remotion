"""Rasterize vector-print frames with PDFium, avoiding screenshot paint dropouts."""
from pathlib import Path
import argparse
import pypdfium2 as pdfium

parser = argparse.ArgumentParser()
parser.add_argument('source', type=Path)
parser.add_argument('destination', type=Path)
parser.add_argument('--start', type=int, required=True)
parser.add_argument('--end', type=int, required=True)
args = parser.parse_args()
args.destination.mkdir(parents=True, exist_ok=True)
for index, frame in enumerate(range(args.start, args.end + 1)):
    document = pdfium.PdfDocument(str(args.source / f'frame-{frame:04}.pdf'))
    # Chrome can append a blank overflow sheet. The composition is the first
    # page; reject any extra page with artwork rather than silently cropping it.
    for index_page in range(1, len(document)):
        extra = document[index_page]
        if extra.render(scale=1).to_pil().convert('RGB').getextrema() != ((255, 255),) * 3:
            raise ValueError(f'Artwork overflow on frame {frame}, page {index_page + 1}')
        extra.close()
    page = document[0]
    image = page.render(scale=96 / 72).to_pil().convert('RGB')
    if image.size != (1920, 1080):
        raise ValueError(f'Unexpected dimensions at frame {frame}: {image.size}')
    image.save(args.destination / f'frame-{index:04}.png')
    page.close()
    document.close()
print(f'Rasterized {args.end - args.start + 1} frames')

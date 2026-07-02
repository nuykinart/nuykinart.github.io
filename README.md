# nuykin.art

Мемориальный сайт художника Нуйкина Владимира Дмитриевича (1956–2024).

Static site hosted on GitHub Pages (`.nojekyll` — files are served as-is, no build step).
Artwork images are hosted separately at `https://media.nuykin.art/` (see `baseUrl` in
`js/gallery-data.js`); only site assets (pictograms, collage images) live in this repo.

## Structure

```
index.html          Landing page (collage of hand-drawn links)
bio.html            Biography (collage layout)
graphics.html       Graphics gallery — albums with tag filters and a lightbox.
                    The most developed page; use it as the model for painting.html.
painting.html       Painting gallery (static grid for now, to be rebuilt like graphics)
misc.html           Placeholder

css/
  styles.css        Base styles + collage layout (.image-container, .image-wrapper)
  animation.css     Page-transition fade and the "chaos" click animation
  gallery.css       Shared gallery styles: grid, cards, bottom nav, lightbox tweaks
  graphics.css      graphics.html specifics: header with nav icons, album cards
  painting.css      painting.html specifics

js/
  collage.js        Collage pages: proportional scaling + blue hover tint
  animation.js      Page transitions and the title "chaos" animation
  gallery-data.js   Declares galleryConfig/galleryData/albumsData globals
  albums/*.js       One file per album; each pushes into albumsData/galleryData
  gallery-engine.js Renders albums/images, tag filters, hash-based URLs (#album/N),
                    keeps the lightbox and browser history in sync
```

## Run locally

Any static file server works, e.g.:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Or with Jekyll (matches GitHub Pages tooling):

```bash
gem install jekyll bundler
bundle install
bundle exec jekyll serve
```

## Adding an album to graphics

1. Upload originals to the media host under `<albumId>/`, and 1200px thumbnails
   under `<albumId>/thumbs/` (same file names). To generate thumbnails and list
   files by shot date:

   ```shell
   mogrify -path ./thumbs -resize 1200x1200 -quality 82 -format jpg ./*.jpg
   exiftool -T -CreateDate -FileName . | sort -k1 | awk -F'\t' '{print $2}'
   ```

2. Create `js/albums/<albumId>.js` following the existing files: one
   `albumsData.push({id, title, cover})` plus `galleryData.push(...)` with
   `{file, title, subtitle, tags}` per image. `file` starts with `<albumId>/`;
   that prefix is what groups images into the album.

3. Add `<script src="/js/albums/<albumId>.js"></script>` to `graphics.html`
   (before `gallery-engine.js`).

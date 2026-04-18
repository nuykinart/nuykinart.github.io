# Run the site

This site uses jekyll, to run it you need to install jekyll and bundler. You can do this with the following command:

```bash 
gem install jekyll bundler
```

Then, navigate to the root of the project and run:

```bash
bundle exec jekyll serve
```

# Thumbs

```shell
mogrify -path ./thumbs -resize 1200x1200 -quality 82 -format jpg ./*.jpg
```

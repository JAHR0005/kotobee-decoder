# Pearson Kotobee decoder

Decode and update Kotobee ePub links.

## Install

```sh
npm install -g .
```

## Usage

```sh
$ pearson-kotobee-decoder --help                                                                                 
Usage: pearson-kotobee-decoder [options]

Options:
  -v, --version               output the version number
  -O, --output <path>         the output epub file
  -F, --find <regex>          a regex to match for the replacement
  -R, --replace <string>      a replacing string for decoded urls
  -A, --attribute <attrName>  the name of an alternative attribute to set
  -h, --help                  output usage information
```

### Examples

Decode `data-kotobee` urls and store them in the `data-href` attribute:
```sh
$ pearson-kotobee-decoder path/to/book.epub -A 'data-href'
```

Specifying an output file:
```sh
$ pearson-kotobee-decoder path/to/book.epub -O path/to/converted.epub -A 'data-href'
```

Find and replace decoded urls in place (updating the `data-kotobee` attribute):
```sh
$ pearson-kotobee-decoder path/to/book.epub
    -O path/to/converted.epub
    -F '(it|en).pearson.com'
    -R 'pearson.com/$1'
```

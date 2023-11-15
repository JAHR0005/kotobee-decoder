#! /usr/bin/env node

const path = require('path');
const colors = require('colors/safe');
const program = require('commander');
const diff = require('diff');
const { name, version } = require('../package.json');
const decoder = require('../lib/index');

program
    .name(name)
    .version(version, '-v, --version')
    .option('-O, --output <path>', 'the output epub file')
    .option('-F, --find <regex>', 'a regex to match for the replacement')
    .option('-R, --replace <string>', 'a replacing string for decoded urls')
    .option('-A, --attribute <attrName>', 'the name of an alternative attribute to set')
    .action(async (fileName, options = {}) => {
        if (!options.replace && !options.attribute) {
            console.log(colors.red('missing `replace` and `attribute` flags, nothing to do'), '\n');
            program.help();
            return;
        }

        if (options.replace && !options.find) {
            console.log(colors.red('missing `find` flag for the replacement'), '\n');
            program.help();
            return;
        }

        const output = options.output || path.join(path.dirname(fileName), `${path.basename(fileName, '.epub')}.converted.epub`);

        let replacer;
        if (options.find && options.replace) {
            let regex = new RegExp(options.find, '');
            replacer = (href) => {
                return href.replace(regex, options.replace || '');
            };
        }

        const { result, summary } = decoder(fileName, replacer, options.attribute);

        if (Object.keys(summary).length) {
            console.log();
            console.log(colors.cyan(colors.bold('SUMMARY')));
            
            for (let fileName in summary) {
                console.log();
                console.log(colors.yellow(fileName), '\n');
                summary[fileName].forEach(([href, newHref]) => {
                    if (href !== newHref) {
                        let changes = diff.diffWords(href, newHref);
                        let str = changes
                        .reduce((line, diff) => {
                                if (diff.added) {
                                    line += colors.green(diff.value);
                                } else if (diff.removed) {
                                    line += colors.red(diff.value);
                                } else {
                                    line += diff.value;
                                }
                                return line;
                            }, '')
                        console.log('  ', str);
                        console.log('      ', colors.grey(newHref));
                    } else {
                        console.log('  ', newHref);
                    }
                });
            }
        }

        process.stdout.write(`\nwriting ${output}`);
        result.writeZip(output);
        process.stdout.write('\r\x1b[K');
        process.stdout.write(`${colors.bold(colors.green(`${output} saved!`))}\n`);
    })
    .parse(process.argv);
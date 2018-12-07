const fs = require('fs'),
      path = require('path'),
      shell = require('shelljs'),
      prompt = require('prompt'),
      semver = require('semver'),
      pck = require('./package.json'),
      git = require('git-state'),
      colors = require('colors'),
      argv = require('yargs').argv;


git.isGit(__dirname, (exists) => {
    if (!exists) return;
    
    git.check(__dirname, (err, result) => {
        if (err) console.log(err);

        if (!argv.dryrun) {
            if (result.branch === 'master') {
                console.log(`You are on ${result['branch'].toUpperCase()} branch. Please switch to develop or feature branch in order to continue.`.black.bgWhite);
                return;
            } 
            if (result.dirty > 0) {
                console.log(`You have ${result.dirty} uncommitted changes. Please commit your changes first.`.black.bgWhite);
                return;
            }
            // if (result['branch'].includes('feature/')) {
            //     const featureBranch = result['branch'].match(/\/(.*)/);
            //     shell.exec(`git flow feature finish ${featureBranch[1]}`);
            // }
        }
        release(argv.env);
    });
});

const lsRemoteTags = () => {
    const gitTags = shell.exec(`git ls-remote --tags https://github.com/vladbogdan10/git-flow-demo.git`, {silent:true});
	const error = gitTags.stderr;
	if (error) {
		console.log(`There was a problem getting the git version from ${error}Please abort(CTRL + C) or check latest git tag manually.`.black.bgRed);
		return;
	}
	let output = gitTags.stdout,
        strTags = output.toString().trim(),
        parsedTags = parseTags(strTags),
        latestGitTag =  parsedTags.entries().next().value;
	 
 	return latestGitTag[0];
};

const parseTags = tags => {
    const tagMap = new Map();
    tags.split('\n')
        .forEach((str) => {
            const ref = str.split(/\t/);
            tagMap.set(ref[1].split('/')[2].replace(/\^\{\}$/, ''), ref[0]);
        });
    return new Map([...tagMap.entries()]
        .filter(arr => semver.valid(arr[0]))
        .sort((a, b) => semver.compare(a[0], b[0]))
        .reverse());
};

const release = (env) => {
    // ask users to check chip dependencies are updated
    console.log('IMPORTANT');
    console.log('Did you remember to run "npm update" to update chip dependencies?'.black.bgYellow);

    prompt.get([{
        name: 'updated',
        description: '(Y/N)',
        required: true
    }], (err, res) => {
        if (res.updated === 'y') {
            // console.info('Creating', argv.env.project ,'Release Build...');
            console.log(`Current version: ${lsRemoteTags()}`.cyan);
            console.log('Please give a new version number'.cyan);

            // prompts for a new version number
            prompt.get([{
                name: 'version',
                description: 'new version',
                required: true
            }], (err, res) => {
                    // makes sure version complies to semver
                if (!semver.valid(res.version)) {
                    console.log('this version number does not comply to semver format.'.red);
                    console.log('package.json will not be updated.'.red);
                } else {
                    if (!argv.dryrun) {
                        git.check(__dirname, (err, result) => {
                            if (result['branch'].includes('feature/')) {
                                const featureBranch = result['branch'].match(/\/(.*)/);
                                shell.exec(`git flow feature finish ${featureBranch[1]}`);
                            }
                        });
                        const gitPull = shell.exec('git pull');
                        if (gitPull.code === 1) return;
                        shell.exec(`git flow release start ${res.version}`);
                    }
                    // updates package.json
                    pck.version = res.version;
                    fs.writeFileSync(path.join('.', 'package.json'), JSON.stringify(pck, null, 2));
                }
                
                // executes webpack binary in prod mode
                // with environment variables that will be used by the config file
                // shell.exec('webpack -p --config webpack.' + env.project + '.config.js --env.prod --env.version=' + res.version);
                
                for (let i = 0; i <= 50; i++) {
                    console.log('Building files...');
                }

                if (!argv.dryrun) {
                    if (lsRemoteTags() === res.version) {
                        console.log('In the meantime the git tag was already taken. Please start the process again!'.black.bgRed);
                        return;
                    }
                    shell.exec('git commit -am "version bumped"');
                    shell.exec(`git flow release finish -m "release" ${res.version}`);
                    shell.exec('git push --all --follow-tags');
                }

                console.log('Successful! Now let\'s hope you didn\'t break anything :)'.black.bgGreen);
            });
        } else {
            console.log('Please update chip dependencies with "npm update" before continuing!'.black.bgMagenta);
        }
    });
};








// const fs = require('fs'),
//       path = require('path'),
//       shell = require('shelljs'),
//       prompt = require('prompt'),
//       semver = require('semver'),
//       pck = require('./package.json'),
//       git = require('git-state'),
//       colors = require('colors'),
//       releaseConfig = require('./release.js'),
//       argv = require('yargs').argv;


// git.isGit(__dirname, (exists) => {
//     if (!exists) return;

//     git.check(__dirname, (err, result) => {
//         if (err) console.log(err);

//         if (!argv.dryrun) {
//             if (result.branch === 'master') {
//                 console.log(`You are on ${result['branch'].toUpperCase()} branch. Please switch to develop or feature branch in order to continue.`.black.bgWhite);
//                 return;
//             }
//             if (result.dirty > 0) {
//                 console.log(`You have ${result.dirty} uncommitted changes. Please commit your changes first.`.black.bgWhite);
//                 return;
//             }
//             if (result['branch'].includes('feature/')) {
//                 const featureBranch = result['branch'].match(/\/(.*)/);
//                 shell.exec(`git flow feature finish ${featureBranch[1]}`);
//             }
//         }
//         release(argv.env);
//     });
// });

// const lsRemoteTags = () => {
//     const gitTags = shell.exec(`git ls-remote --tags ssh://git@git.cxo.name/unused/chip-build-manager-versioning-test.git`, {silent:true});
//     const error = gitTags.stderr;
//     if (error) {
//         console.log(`There was a problem getting the git version from ${error}Please abort(CTRL + C) or check latest git tag manually.`.black.bgRed);
//         return;
//     }
//     let output = gitTags.stdout,
//         strTags = output.toString().trim(),
//         parsedTags = parseTags(strTags),
//         latestGitTag =  parsedTags.entries().next().value;

//     return latestGitTag[0];
// };

// const parseTags = tags => {
//     const tagMap = new Map();
//     tags.split('\n')
//         .forEach((str) => {
//             const ref = str.split(/\t/);
//             tagMap.set(ref[1].split('/')[2].replace(/\^\{\}$/, ''), ref[0]);
//         });
//     return new Map([...tagMap.entries()]
//         .filter(arr => semver.valid(arr[0]))
//         .sort((a, b) => semver.compare(a[0], b[0]))
//         .reverse());
// };

// const release = (env) => {
//     // ask users to check chip dependencies are updated
//     console.log('IMPORTANT');
//     console.log('Did you remember to run "npm update" to update chip dependencies?'.black.bgYellow);

//     prompt.get([{
//         name: 'updated',
//         description: '(Y/N)',
//         required: true
//     }], (err, res) => {
//         if (res.updated.toLowerCase() === 'y') {
//             // console.info('Creating', argv.env.project ,'Release Build...');
//             console.log(`Current version: ${lsRemoteTags()}`.cyan);
//             console.log('Please give a new version number'.cyan);

//             // prompts for a new version number
//             prompt.get([{
//                 name: 'version',
//                 description: 'new version',
//                 required: true
//             }], (err, res) => {
//                 // makes sure version complies to semver
//                 if (!semver.valid(res.version)) {
//                     console.log('this version number does not comply to semver format.'.red);
//                     console.log('package.json will not be updated.'.red);
//                 } else {
//                     if (!argv.dryrun) {
//                         const gitPull = shell.exec('git pull');
//                         if (gitPull.code === 1) return;
//                         shell.exec(`git flow release start ${res.version}`);
//                     }
//                     // updates package.json
//                     console.log('sweet! package.json will be updated with the new version: ' + res.version);
//                     pck.version = res.version;
//                     fs.writeFileSync(path.join('.', 'package.json'), JSON.stringify(pck, null, 2));
//                 }

//                 // executes webpack binary in prod mode
//                 // with environment variables that will be used by the config file
//                 shell.exec('node build.js --color=true --env.prod --env.version=' + res.version + ' --env.project=' + env.project);

//                 if (!argv.dryrun) {
//                     if (lsRemoteTags() === res.version) {
//                         console.log('In the meantime the git tag was already taken. Please start the process again!'.black.bgRed);
//                         return;
//                     }
//                     shell.exec('git commit -am "version bumped"');
//                     shell.exec(`git flow release finish -m "release" ${res.version}`);
//                     shell.exec('git push --all --follow-tags');
//                 }

//                 console.log('Successful! Now let\'s hope you didn\'t break anything :)'.black.bgGreen);
//             });
//         } else {
//             console.log('Please update chip dependencies with "npm update" before continuing!'.black.bgMagenta);
//         }
//     });
// };

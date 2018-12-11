const fs = require('fs'),
      path = require('path'),
      shell = require('shelljs'),
      prompt = require('prompt'),
      semver = require('semver'),
      pck = require('./package.json'),
      git = require('git-state'),
      colors = require('colors'),
      argv = require('yargs').argv; 


const lsRemoteTags = () => {
    const repositoryLink = 'https://github.com/vladbogdan10/git-flow-demo.git',
	      gitTags = shell.exec(`git ls-remote --tags --refs --sort=-v:refname ${repositoryLink}`, {silent:true}),
	      error = gitTags.stderr;
	if (error) {
		console.log(`There was a problem getting the git version from ${error}Please abort(CTRL + C) or check latest git tag manually.`);
		return;
    }
    let latestRefTag = gitTags.stdout.split('\n')[0],
        latestTag = latestRefTag.match(/(?:\d+\.?){3}$/);

    return latestTag[0];
};

this.release = (env) => {
    // ask users to check chip dependencies are updated
    console.log('IMPORTANT');
    console.log('Did you remember to run "npm update" to update chip dependencies?'.black.bgYellow);

    prompt.get([{
        name: 'updated',
        description: '(Y/N)',
        required: true
    }], (err, res) => {
        if (res.updated.toLowerCase() === 'y') {
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
                        const gitPull = shell.exec('git pull');
                        if (gitPull.code === 1) return;
                        const releaseBranch = shell.exec(`git flow release start ${res.version}`);
                        if (releaseBranch.code === 1) return;
                    }
                    // executes webpack binary in prod mode
                    // with environment variables that will be used by the config file
                    // const buildFiles = shell.exec('node build.js --color=true --env.prod --env.version=' + res.version + ' --env.project=' + env.project);
                    // if (buildFiles.code === 1) {
                    //     shell.exec('git checkout develop');
                    //     shell.exec(`git branch --delete release/${res.version}`);
                    //     return;
                    // }

                    for (let i = 0; i <= 50; i++) {
                        console.log('Building files...');
                    }

                    pck.version = res.version;
                    fs.writeFileSync(path.join('.', 'package.json'), JSON.stringify(pck, null, 2));
                    console.log('sweet! package.json was updated with the new version: ' + res.version);

                    if (!argv.dryrun) {
                        if (lsRemoteTags() === res.version) {
                            console.log('In the meantime the git tag was already taken. Please start the process again!'.black.bgRed);
                            return;
                        }
                        shell.exec('git commit -am "version bumped"');
                        shell.exec(`git flow release finish -m "release" ${res.version}`);
                        shell.exec('git push --all --follow-tags');
                    }
                    console.log('Successful!'.black.bgGreen);
                }
            });
        } else {
            console.log('Please update chip dependencies with "npm update" before continuing!'.black.bgMagenta);
        }
    });
};

git.isGit(__dirname, (exists) => {
    if (!exists) return;
    
    git.check(__dirname, (err, result) => {
        if (err) console.log(err);

        if (result.branch === 'master') {
            console.log(`You are on ${result.branch.toUpperCase()} branch. Please switch to develop or feature branch in order to continue.`.black.bgWhite);
            return;
        }

        if (!argv.dryrun) { 
            if (result.dirty > 0) {
                console.log(`You have ${result.dirty} uncommitted changes. Please commit your changes first.`.black.bgWhite);
                return;
            }
            if (result.branch.includes('feature/')) {
                const featureBranch = result.branch.match(/\/(.*)/);
                shell.exec(`git flow feature finish ${featureBranch[1]}`);
            }
        }
        this.release(argv.env);
    });
});
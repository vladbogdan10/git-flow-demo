const fs = require('fs'),
      path = require('path'),
      shell = require('shelljs'),
      prompt = require('prompt'),
      semver = require('semver'),
      pck = require('./package.json'),
      gitTagsRemote = require('git-tags-remote'),
      git = require('git-state'),
      releaseConfig = require('./release.js'),
      argv = require('yargs').argv;

git.isGit(__dirname, function (exists) {
    if (!exists) return
    
    git.check(__dirname, function (err, result) {
        if (err) console.log(err);
        if (result.branch == 'master') {
            console.log(`===> You are on ${result['branch'].toUpperCase()} branch. Please switch branch.`);
            return;
        } 
        if (result.dirty > 0) {
            console.log(`===> You have ${result.dirty} uncommitted changes. Please commit your changes first`);
            return;
        }
        release(argv.env);
    })
})


const release = (env) => {
    // ask users to check chip dependencies are updated
    console.log('IMPORTANT');
    console.log('Did you remember to run "npm update" to update chip dependencies?\n');

    prompt.get([{
        name: 'updated',
        description: '(Y/N)',
        required: true
    }], (err, res) => {
        if (res.updated === 'y') {
            // console.info('Creating', argv.env.project ,'Release Build...');

            console.log(`Current version: ${pck.version}`);
            console.log('Please give a new version number');

            // prompts for a new version number
            prompt.get([{
                name: 'version',
                description: 'new version',
                required: true
            }],
                (err, res) => {
                    // makes sure version complies to semver
                    if (!semver.valid(res.version)) {
                        console.log('this version number does not comply to semver format.');
                        console.log('package.json will not be updated.');
                    } else {
                        // updates package.json
                        console.log(`sweet! package.json will be updated with the new version: ${res.version}`);
                        pck.version = res.version;
                        fs.writeFileSync(path.join('.', 'package.json'), JSON.stringify(pck, null, 2));
                        // console.log(`the git tag: ${res.version} will be automagically push to the remote repository.`);
                    }

                    // executes webpack binary in prod mode
                    // with environment variables that will be used by the config file
                    // shell.exec('webpack -p --config webpack.' + env.project + '.config.js --env.prod --env.version=' + res.version);

                    // let demoBranch = 'demo-feature-branch-2';
                    // let comment = 'dummy comment';
                    
                    // shell.exec(`git flow feature start ${demoBranch}`);
                    // shell.exec(`git commit -am "${comment}"`);
                    // shell.exec(`git push --set-upstream origin feature/${demoBranch}`);
                    // shell.exec(`git flow feature finish ${demoBranch}`);
                    // shell.exec('git push');
                    // shell.exec(`git flow release start ${res.version}`);
                    // shell.exec(`git flow release finish -m "cool-message" ${res.version}`);
                    // shell.exec('git push --all --follow-tags');
                });
        } else {
            console.log('Please update chip dependencies with "npm update" before continuing!\n');
        }
    });
};

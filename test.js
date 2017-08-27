const cmd = `brew list | while read cask; do echo -n $cask; brew deps $cask | awk '{printf(" %s", $0)}'; echo ""; done`
const split = require('split');
const spawn = require('child_process').spawn;

module.exports = {
  getDeps: function (onLine, onDone) {

    const child = spawn('bash', ['-c', cmd]);

    child.stdout.pipe(split()).on('data', function (line) {
      const [cmd, ...deps] = line.split(' ')
      console.log('**' + line + '**');
      onLine({md, deps})
    })

    ls.on('close', onDone);

  }
}


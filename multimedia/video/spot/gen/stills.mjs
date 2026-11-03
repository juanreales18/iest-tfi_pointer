import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'path';
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const composition = await selectComposition({serveUrl, id: 'Spot', browserExecutable});
for (const frame of process.argv.slice(2).map(Number)) {
  await renderStill({composition, serveUrl, frame, output: `out/s${frame}.png`, browserExecutable});
  console.log('ok', frame);
}

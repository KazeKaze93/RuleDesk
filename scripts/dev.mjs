import { spawn } from 'node:child_process'
import process from 'node:process'

const isWin = process.platform === 'win32'

if (isWin) {
  // Ensure UTF-8 console so electron-vite / Electron logs render correctly on Windows.
  spawn('chcp', ['65001'], { stdio: 'ignore', shell: true }).on('close', () => {
    runDev()
  })
} else {
  runDev()
}

function runDev() {
  const child = spawn(
    'npx',
    ['cross-env', 'NODE_ENV=development', 'electron-vite', 'dev'],
    {
      stdio: 'inherit',
      shell: true,
      env: process.env,
    },
  )

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal)
      return
    }
    process.exit(code ?? 0)
  })
}

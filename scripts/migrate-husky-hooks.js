import { spawnSync } from 'node:child_process'

const result = spawnSync('git', ['config', '--local', '--get', 'core.hooksPath'], { encoding: 'utf8' })

if (result.status === 0 && result.stdout.trim() === '.husky/_') {
  const unset = spawnSync('git', ['config', '--local', '--unset', 'core.hooksPath'])

  if (unset.status !== 0) {
    throw unset.error ?? new Error(unset.stderr?.toString() || 'Failed to unset legacy Husky hooks path')
  }
}

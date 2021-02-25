import * as dayjs from 'dayjs'

interface LogArgs {
  [propName: string]: any
}

type LogType = 'info' | 'error'

function write(type: LogType, args: LogArgs = {}) {
  let time = dayjs().format('YYYY-MM-DD HH:mm:ss')
  let str = JSON.stringify({
    time,
    ...args
  })
  if (type === 'info') console.log(str)
  if (type === 'error') console.trace(str)
}

export function info(args: LogArgs) {
  write('info', args)
}

export function error(args: LogArgs) {
  write('error', args)
}
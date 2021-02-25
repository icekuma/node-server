import * as http from 'http'

import Context from './context'
import * as router from './router'
import * as logger from './logger'

const server = http.createServer(async (req, res) => {
  let startTime = Date.now()
  let ctx = new Context(req, res)
  ctx.res.setHeader('X-Request-Id', ctx.requestId)
  await router.parse(ctx)
  let endTime = Date.now()
  logger.info({
    requestId: ctx.requestId,
    ip: ctx.ip,
    statusCode: ctx.res.statusCode,
    method: ctx.req.method,
    url: ctx.req.url,
    cost: endTime - startTime,
    ...ctx.log
  })
})

export function listen(port: number, hostname: string = '0.0.0.0') {
  server.listen(port, hostname, () => logger.info({
    info: `server listening on http://${hostname}:${port}`
  }))
}

export function setStats(data: any) {
  router.setStats(data)
}